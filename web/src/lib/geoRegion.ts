import type { TFunction } from 'i18next'

type RegionSource = {
  region?: string
  /** Set by the backend only for non-public addresses (loopback, private, …). */
  region_kind?: string
  country?: string
  province?: string
  city?: string
}

/**
 * Region text for an audited IP.
 *
 * Public addresses resolve through ip2region, whose database ships Chinese
 * place names only — those are passed through untranslated. Addresses the
 * database cannot place carry a `region_kind` instead, and those are ours to
 * word, so they follow the active locale.
 */
export function regionLabel(row: RegionSource, t: TFunction, fallback = '—'): string {
  if (row.region_kind) {
    return t(`audit.region.${row.region_kind}`, { defaultValue: row.region || fallback })
  }
  return (
    row.region || [row.country, row.province, row.city].filter(Boolean).join(' ') || fallback
  )
}
