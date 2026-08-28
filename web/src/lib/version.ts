/** App release — keep in sync with repo root `VERSION`. */
export const APP_VERSION = '1.5.0'

export const APP_REPO_URL = 'https://github.com/ciliverse/cilikube'

/** Display form: always `vX.Y.Z`. */
export function formatAppVersion(v: string = APP_VERSION): string {
  const t = v.trim()
  if (!t) return 'v1.5.0'
  return t.startsWith('v') ? t : `v${t}`
}
