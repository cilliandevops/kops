export function nodeIsCordoned(node: any): boolean {
  return Boolean(node?.spec?.unschedulable)
}

export function nodeIsReady(node: any): boolean {
  const ready = (node?.status?.conditions || []).find((c: any) => c.type === 'Ready')
  return ready?.status === 'True'
}

/** `key=value:Effect` per taint, matching kubectl describe. */
export function formatNodeTaints(node: any): string[] {
  return (node?.spec?.taints || []).map(
    (t: any) => `${t.key}${t.value ? `=${t.value}` : ''}:${t.effect}`,
  )
}
