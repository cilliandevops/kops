package service

import (
	"context"
	"fmt"
	"sort"
	"time"

	corev1 "k8s.io/api/core/v1"
	policyv1 "k8s.io/api/policy/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/util/retry"
)

// NodeOpsService implements the node lifecycle operations kubectl exposes:
// cordon/uncordon, drain, and taint/label editing.
type NodeOpsService struct{}

func NewNodeOpsService() *NodeOpsService {
	return &NodeOpsService{}
}

// DrainOptions mirrors the subset of `kubectl drain` flags that make sense from a UI.
type DrainOptions struct {
	GracePeriodSeconds int64
	DeleteEmptyDirData bool
	IgnoreDaemonSets   bool
	// Force evicts pods not managed by a controller. Without it such pods abort the drain,
	// because nothing would recreate them elsewhere.
	Force          bool
	TimeoutSeconds int64
	DryRun         bool
}

// DrainPodResult reports the outcome for one pod so the UI can show a per-pod list
// instead of a single opaque success/failure.
type DrainPodResult struct {
	Namespace string `json:"namespace"`
	Name      string `json:"name"`
	Action    string `json:"action"` // evicted | skipped | failed
	Reason    string `json:"reason,omitempty"`
}

type DrainResult struct {
	Node     string           `json:"node"`
	Cordoned bool             `json:"cordoned"`
	Evicted  int              `json:"evicted"`
	Skipped  int              `json:"skipped"`
	Failed   int              `json:"failed"`
	DryRun   bool             `json:"dryRun"`
	Pods     []DrainPodResult `json:"pods"`
}

// SetUnschedulable cordons (true) or uncordons (false) a node.
func (s *NodeOpsService) SetUnschedulable(ctx context.Context, clientset kubernetes.Interface, nodeName string, unschedulable bool) (*corev1.Node, error) {
	var updated *corev1.Node
	err := retry.RetryOnConflict(retry.DefaultRetry, func() error {
		node, err := clientset.CoreV1().Nodes().Get(ctx, nodeName, metav1.GetOptions{})
		if err != nil {
			return err
		}
		if node.Spec.Unschedulable == unschedulable {
			updated = node
			return nil
		}
		node.Spec.Unschedulable = unschedulable
		updated, err = clientset.CoreV1().Nodes().Update(ctx, node, metav1.UpdateOptions{})
		return err
	})
	return updated, err
}

// UpdateTaints replaces the node's taint list.
func (s *NodeOpsService) UpdateTaints(ctx context.Context, clientset kubernetes.Interface, nodeName string, taints []corev1.Taint) (*corev1.Node, error) {
	for i := range taints {
		if taints[i].Key == "" {
			return nil, fmt.Errorf("taint[%d]: key is required", i)
		}
		switch taints[i].Effect {
		case corev1.TaintEffectNoSchedule, corev1.TaintEffectPreferNoSchedule, corev1.TaintEffectNoExecute:
		default:
			return nil, fmt.Errorf("taint %q: effect must be NoSchedule, PreferNoSchedule or NoExecute", taints[i].Key)
		}
	}
	var updated *corev1.Node
	err := retry.RetryOnConflict(retry.DefaultRetry, func() error {
		node, err := clientset.CoreV1().Nodes().Get(ctx, nodeName, metav1.GetOptions{})
		if err != nil {
			return err
		}
		node.Spec.Taints = taints
		updated, err = clientset.CoreV1().Nodes().Update(ctx, node, metav1.UpdateOptions{})
		return err
	})
	return updated, err
}

// UpdateMeta merges label/annotation changes. A nil map is left untouched; an entry
// with an empty value in remove* removes the key.
func (s *NodeOpsService) UpdateMeta(
	ctx context.Context,
	clientset kubernetes.Interface,
	nodeName string,
	labels map[string]string,
	removeLabels []string,
	annotations map[string]string,
	removeAnnotations []string,
) (*corev1.Node, error) {
	var updated *corev1.Node
	err := retry.RetryOnConflict(retry.DefaultRetry, func() error {
		node, err := clientset.CoreV1().Nodes().Get(ctx, nodeName, metav1.GetOptions{})
		if err != nil {
			return err
		}
		if len(labels) > 0 {
			if node.Labels == nil {
				node.Labels = map[string]string{}
			}
			for k, v := range labels {
				node.Labels[k] = v
			}
		}
		for _, k := range removeLabels {
			delete(node.Labels, k)
		}
		if len(annotations) > 0 {
			if node.Annotations == nil {
				node.Annotations = map[string]string{}
			}
			for k, v := range annotations {
				node.Annotations[k] = v
			}
		}
		for _, k := range removeAnnotations {
			delete(node.Annotations, k)
		}
		updated, err = clientset.CoreV1().Nodes().Update(ctx, node, metav1.UpdateOptions{})
		return err
	})
	return updated, err
}

// Drain cordons the node and evicts its pods through the eviction API so
// PodDisruptionBudgets are respected.
func (s *NodeOpsService) Drain(ctx context.Context, clientset kubernetes.Interface, nodeName string, opts DrainOptions) (*DrainResult, error) {
	if opts.TimeoutSeconds <= 0 {
		opts.TimeoutSeconds = 120
	}
	if opts.GracePeriodSeconds < 0 {
		opts.GracePeriodSeconds = 30
	}
	ctx, cancel := context.WithTimeout(ctx, time.Duration(opts.TimeoutSeconds)*time.Second)
	defer cancel()

	result := &DrainResult{Node: nodeName, DryRun: opts.DryRun, Pods: []DrainPodResult{}}

	podList, err := clientset.CoreV1().Pods("").List(ctx, metav1.ListOptions{
		FieldSelector: "spec.nodeName=" + nodeName,
	})
	if err != nil {
		return nil, fmt.Errorf("list pods on node: %w", err)
	}

	// Classify first so a blocking pod aborts before anything is cordoned or evicted.
	type target struct {
		pod  corev1.Pod
		skip string
	}
	targets := make([]target, 0, len(podList.Items))
	for _, pod := range podList.Items {
		if pod.Status.Phase == corev1.PodSucceeded || pod.Status.Phase == corev1.PodFailed {
			targets = append(targets, target{pod: pod, skip: "already terminated"})
			continue
		}
		if _, mirror := pod.Annotations[corev1.MirrorPodAnnotationKey]; mirror {
			targets = append(targets, target{pod: pod, skip: "static (mirror) pod"})
			continue
		}
		controller := metav1.GetControllerOf(&pod)
		if controller != nil && controller.Kind == "DaemonSet" {
			if !opts.IgnoreDaemonSets {
				return nil, fmt.Errorf("pod %s/%s is managed by a DaemonSet; enable \"ignore DaemonSets\" to drain anyway", pod.Namespace, pod.Name)
			}
			targets = append(targets, target{pod: pod, skip: "managed by DaemonSet"})
			continue
		}
		if controller == nil && !opts.Force {
			return nil, fmt.Errorf("pod %s/%s is not managed by a controller and would not be recreated; enable \"force\" to evict it anyway", pod.Namespace, pod.Name)
		}
		if !opts.DeleteEmptyDirData && podHasEmptyDir(&pod) {
			return nil, fmt.Errorf("pod %s/%s uses emptyDir storage that would be lost; enable \"delete emptyDir data\" to continue", pod.Namespace, pod.Name)
		}
		targets = append(targets, target{pod: pod})
	}

	sort.SliceStable(targets, func(i, j int) bool {
		if targets[i].pod.Namespace != targets[j].pod.Namespace {
			return targets[i].pod.Namespace < targets[j].pod.Namespace
		}
		return targets[i].pod.Name < targets[j].pod.Name
	})

	if !opts.DryRun {
		if _, err := s.SetUnschedulable(ctx, clientset, nodeName, true); err != nil {
			return nil, fmt.Errorf("cordon node: %w", err)
		}
		result.Cordoned = true
	}

	for _, tgt := range targets {
		if tgt.skip != "" {
			result.Skipped++
			result.Pods = append(result.Pods, DrainPodResult{
				Namespace: tgt.pod.Namespace, Name: tgt.pod.Name, Action: "skipped", Reason: tgt.skip,
			})
			continue
		}
		if opts.DryRun {
			result.Evicted++
			result.Pods = append(result.Pods, DrainPodResult{
				Namespace: tgt.pod.Namespace, Name: tgt.pod.Name, Action: "evicted", Reason: "dry run",
			})
			continue
		}
		grace := opts.GracePeriodSeconds
		evictErr := clientset.CoreV1().Pods(tgt.pod.Namespace).EvictV1(ctx, &policyv1.Eviction{
			ObjectMeta:    metav1.ObjectMeta{Name: tgt.pod.Name, Namespace: tgt.pod.Namespace},
			DeleteOptions: &metav1.DeleteOptions{GracePeriodSeconds: &grace},
		})
		switch {
		case evictErr == nil:
			result.Evicted++
			result.Pods = append(result.Pods, DrainPodResult{
				Namespace: tgt.pod.Namespace, Name: tgt.pod.Name, Action: "evicted",
			})
		case apierrors.IsNotFound(evictErr):
			result.Skipped++
			result.Pods = append(result.Pods, DrainPodResult{
				Namespace: tgt.pod.Namespace, Name: tgt.pod.Name, Action: "skipped", Reason: "already gone",
			})
		default:
			reason := evictErr.Error()
			if apierrors.IsTooManyRequests(evictErr) {
				reason = "blocked by PodDisruptionBudget: " + reason
			}
			result.Failed++
			result.Pods = append(result.Pods, DrainPodResult{
				Namespace: tgt.pod.Namespace, Name: tgt.pod.Name, Action: "failed", Reason: reason,
			})
		}
	}

	return result, nil
}

func podHasEmptyDir(pod *corev1.Pod) bool {
	for _, v := range pod.Spec.Volumes {
		if v.EmptyDir != nil {
			return true
		}
	}
	return false
}
