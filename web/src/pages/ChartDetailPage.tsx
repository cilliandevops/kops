import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getHelmChart, installHelmRelease } from '@/api/helm'
import { Badge, Button, Card, EmptyState, HudSelect, Input, Modal, PageHeader } from '@/components/ui'
import { useAuth } from '@/store/auth'
import { useCluster } from '@/store/cluster'
import { ALL_NAMESPACES, useNamespace } from '@/store/namespace'
import { cn } from '@/lib/utils'

// Chart READMEs come from third-party repositories, so raw HTML is never
// enabled; react-markdown escapes it by default and only GFM is added.
const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => <h1 className="mt-6 mb-3 text-lg font-semibold text-text first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-6 mb-2.5 text-base font-semibold text-text first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-5 mb-2 text-sm font-semibold text-text first:mt-0">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-4 mb-2 text-sm font-semibold text-text-dim first:mt-0">{children}</h4>,
  p: ({ children }) => <p className="my-2.5 leading-relaxed text-text-dim">{children}</p>,
  ul: ({ children }) => <ul className="my-2.5 list-disc space-y-1 pl-5 text-text-dim">{children}</ul>,
  ol: ({ children }) => <ol className="my-2.5 list-decimal space-y-1 pl-5 text-text-dim">{children}</ol>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noreferrer noopener" className="text-cyan hover:underline">
      {children}
    </a>
  ),
  code: ({ children, className }) =>
    className?.includes('language-') ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-[12px] text-text">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="term-surface my-3 overflow-x-auto rounded border border-line p-3 font-mono text-[12px] leading-relaxed">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-2 border-line pl-3 text-text-dim italic">{children}</blockquote>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-line bg-mist px-2.5 py-1.5 font-semibold text-text">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-line px-2.5 py-1.5 align-top text-text-dim">{children}</td>
  ),
  hr: () => <hr className="my-5 border-line" />,
  img: () => null,
}

/** Chart icons are remote URLs from the repo index; unreachable ones must not
 *  leave an empty framed box behind. Keyed by src so state resets per chart. */
function ChartIcon({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    <img
      src={src}
      alt=""
      className="h-10 w-10 shrink-0 rounded border border-line bg-panel-solid object-contain p-1"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}

export function ChartDetailPage() {
  const { t } = useTranslation()
  const params = useParams<{ repo: string; chart: string }>()
  const navigate = useNavigate()
  const { canEdit, isViewerOnly } = useAuth()
  const { clusterId, clusters } = useCluster()
  const { namespace } = useNamespace()

  const ref = `${params.repo || ''}/${params.chart || ''}`
  const [version, setVersion] = useState('')
  const [pane, setPane] = useState<'readme' | 'values'>('readme')
  const [installOpen, setInstallOpen] = useState(false)

  const detailQ = useQuery({
    queryKey: ['helm-chart', ref, version],
    queryFn: () => getHelmChart(ref, version || undefined),
    enabled: Boolean(params.repo && params.chart),
  })

  const detail = detailQ.data
  const err = (detailQ.error as Error | null)?.message || ''
  const mayInstall = canEdit && !isViewerOnly

  const versionOptions = useMemo(
    () => (detail?.versions || []).map((v) => ({ value: v, label: v })),
    [detail?.versions],
  )

  const activeCluster = clusters?.find((c) => c.id === clusterId)

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <PageHeader
        title={detail?.name || params.chart || ''}
        subtitle={detail?.description || ref}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              type="button"
              className="px-2.5 py-2 text-xs"
              onClick={() => navigate('/marketplace')}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('common.back')}
            </Button>
            {versionOptions.length > 1 ? (
              <HudSelect
                value={version || detail?.version || ''}
                onChange={setVersion}
                options={versionOptions}
                className="min-w-[9rem]"
                aria-label={t('marketplace.version')}
              />
            ) : null}
            {mayInstall ? (
              <Button type="button" onClick={() => setInstallOpen(true)} disabled={!detail}>
                {t('marketplace.install')}
              </Button>
            ) : null}
          </div>
        }
      />

      {err ? (
        <div className="rounded border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{err}</div>
      ) : null}

      {detail ? (
        <Card className="flex flex-wrap items-center gap-x-5 gap-y-2 p-4">
          <div className="flex min-w-0 items-center gap-3">
            {detail.icon ? <ChartIcon key={detail.icon} src={detail.icon} /> : null}
            <div className="min-w-0">
              <div className="font-mono text-xs text-text-dim">{detail.ref}</div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                <Badge tone="accent">{detail.version}</Badge>
                {detail.appVersion ? <Badge tone="neutral">app {detail.appVersion}</Badge> : null}
                {detail.deprecated ? <Badge tone="warn">{t('marketplace.deprecated')}</Badge> : null}
              </div>
            </div>
          </div>
          {detail.keywords?.length ? (
            <div className="flex min-w-0 flex-wrap gap-1.5">
              {detail.keywords.slice(0, 8).map((k) => (
                <span key={k} className="rounded border border-line px-2 py-0.5 text-[11px] text-text-dim">
                  {k}
                </span>
              ))}
            </div>
          ) : null}
          {detail.home ? (
            <a
              href={detail.home}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-xs text-cyan hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t('marketplace.projectHome')}
            </a>
          ) : null}
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-1">
        {(['readme', 'values'] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPane(key)}
            className={cn(
              'rounded border px-3 py-1.5 text-xs font-semibold tracking-wide transition',
              key === pane
                ? 'border-cyan/50 bg-cyan-faint text-cyan'
                : 'border-line text-text-dim hover:border-cyan/40 hover:text-text',
            )}
          >
            {t(`marketplace.${key}`)}
          </button>
        ))}
      </div>

      <Card className="min-h-0 p-4 sm:p-5">
        {detailQ.isLoading ? (
          <EmptyState>{t('marketplace.loadingChart')}</EmptyState>
        ) : pane === 'readme' ? (
          detail?.readme?.trim() ? (
            <div className="max-w-none overflow-x-auto text-[13px]">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
                {detail.readme}
              </ReactMarkdown>
            </div>
          ) : (
            <EmptyState>{t('marketplace.noReadme')}</EmptyState>
          )
        ) : detail?.values?.trim() ? (
          <pre className="term-surface max-h-[60dvh] overflow-auto rounded border border-line p-3 font-mono text-[12px] leading-relaxed">
            {detail.values}
          </pre>
        ) : (
          <EmptyState>{t('marketplace.noValues')}</EmptyState>
        )}
      </Card>

      {detail ? (
        <InstallModal
          open={installOpen}
          onClose={() => setInstallOpen(false)}
          chartRef={detail.ref}
          chartName={detail.name}
          version={version || detail.version}
          defaultValues={detail.values || ''}
          clusterLabel={activeCluster?.name || clusterId || ''}
          initialNamespace={namespace && namespace !== ALL_NAMESPACES ? namespace : 'default'}
          onInstalled={() => navigate('/marketplace/installed')}
        />
      ) : null}
    </div>
  )
}

function InstallModal({
  open,
  onClose,
  chartRef,
  chartName,
  version,
  defaultValues,
  clusterLabel,
  initialNamespace,
  onInstalled,
}: {
  open: boolean
  onClose: () => void
  chartRef: string
  chartName: string
  version: string
  defaultValues: string
  clusterLabel: string
  initialNamespace: string
  onInstalled: () => void
}) {
  const { t } = useTranslation()
  const [releaseName, setReleaseName] = useState(chartName)
  const [ns, setNs] = useState(initialNamespace)
  const [createNs, setCreateNs] = useState(true)
  const [values, setValues] = useState('')
  const [output, setOutput] = useState('')

  useEffect(() => {
    if (open) {
      setReleaseName(chartName)
      setNs(initialNamespace)
      setValues('')
      setOutput('')
    }
  }, [open, chartName, initialNamespace])

  const install = useMutation({
    mutationFn: () =>
      installHelmRelease({
        name: releaseName.trim(),
        namespace: ns.trim(),
        chart: chartRef,
        version: version || undefined,
        values: values.trim() ? values : undefined,
        createNamespace: createNs,
      }),
    onSuccess: (data) => {
      setOutput(data?.output || '')
      onInstalled()
    },
  })

  const err = (install.error as Error | null)?.message || ''

  return (
    <Modal
      open={open}
      title={t('marketplace.installTitle')}
      subtitle={`${chartRef}${version ? ` · ${version}` : ''}`}
      onClose={onClose}
      wide
    >
      <div className="space-y-3 p-4 sm:p-5">
        {err ? (
          <div className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs whitespace-pre-wrap text-danger">
            {err}
          </div>
        ) : null}
        {output ? (
          <pre className="term-surface max-h-40 overflow-auto rounded border border-line p-3 font-mono text-[12px]">
            {output}
          </pre>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block space-y-1">
            <span className="hud-label">{t('marketplace.releaseName')}</span>
            <Input value={releaseName} onChange={(e) => setReleaseName(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('common.namespace')}</span>
            <Input value={ns} onChange={(e) => setNs(e.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('marketplace.targetCluster')}</span>
            <Input value={clusterLabel} readOnly disabled />
          </label>
        </div>

        <label className="flex items-center gap-2 text-xs text-text-dim">
          <input
            type="checkbox"
            checked={createNs}
            onChange={(e) => setCreateNs(e.target.checked)}
            className="h-3.5 w-3.5 accent-cyan"
          />
          {t('marketplace.createNamespace')}
        </label>

        <label className="block space-y-1">
          <span className="hud-label">{t('marketplace.overrideValues')}</span>
          <textarea
            className="term-surface min-h-[160px] w-full rounded border border-line px-3 py-2 font-mono text-[12px] outline-none"
            value={values}
            onChange={(e) => setValues(e.target.value)}
            spellCheck={false}
            placeholder={t('marketplace.overrideValuesHint')}
          />
          <span className="block text-[11px] text-text-dim">
            {t('marketplace.overrideValuesNote')}
          </span>
        </label>

        {defaultValues.trim() ? (
          <details className="rounded border border-line">
            <summary className="cursor-pointer px-3 py-2 text-xs text-text-dim">
              {t('marketplace.showDefaultValues')}
            </summary>
            <pre className="term-surface max-h-56 overflow-auto border-t border-line p-3 font-mono text-[12px] leading-relaxed">
              {defaultValues}
            </pre>
          </details>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="ghost" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            disabled={install.isPending || !releaseName.trim() || !ns.trim()}
            onClick={() => install.mutate()}
          >
            {install.isPending ? t('marketplace.installing') : t('marketplace.install')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
