import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiGet, apiPut } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Badge, Button, Card, PageHeader } from '@/components/ui'
import { BUILTIN_THEMES } from '@/theme/themes'
import { FONT_PACKS, getStoredFontId, setFontId } from '@/theme/fonts'
import { switchTheme } from '@/theme/switchTheme'
import { useTheme } from '@/theme/useTheme'
import { APP_VERSION, formatAppVersion } from '@/lib/version'
import { useTranslation } from 'react-i18next'

export function AdminSettingsPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const { themeId } = useTheme()
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [fontPref, setFontPref] = useState(getStoredFontId)

  const [oauth, setOauth] = useState({
    allow_registration: false,
    auto_link_accounts: false,
    github_enabled: false,
    github_client_id: '',
    github_client_secret: '',
    github_redirect_url: '',
    github_configured: false,
    github_secret_set: false,
  })
  const [security, setSecurity] = useState<any>(null)
  const [prefs, setPrefs] = useState<any>(null)
  const [ai, setAi] = useState({
    enabled: false,
    provider: 'mock',
    base_url: '',
    model: 'mock',
    api_key: '',
    api_key_set: false,
    ready: false,
  })
  const [prom, setProm] = useState({
    enabled: false,
    url: '',
    timeout: '15s',
    mode: 'off',
    showcase: false,
  })

  const systemQ = useQuery({
    queryKey: ['settings-system'],
    enabled: isAdmin,
    queryFn: () => apiGet<any>('/api/v1/settings/system'),
  })
  const oauthQ = useQuery({
    queryKey: ['settings-oauth'],
    enabled: isAdmin,
    queryFn: () => apiGet<any>('/api/v1/settings/oauth'),
  })
  const securityQ = useQuery({
    queryKey: ['settings-security'],
    enabled: isAdmin,
    queryFn: () => apiGet<any>('/api/v1/settings/security'),
  })
  const prefsQ = useQuery({
    queryKey: ['settings-preferences'],
    enabled: isAdmin,
    queryFn: () => apiGet<any>('/api/v1/settings/preferences'),
  })
  const aiQ = useQuery({
    queryKey: ['settings-ai'],
    enabled: isAdmin,
    queryFn: () => apiGet<any>('/api/v1/settings/ai'),
  })
  const promQ = useQuery({
    queryKey: ['settings-prometheus'],
    enabled: isAdmin,
    queryFn: () => apiGet<any>('/api/v1/settings/prometheus'),
  })

  useEffect(() => {
    if (oauthQ.data) {
      const github = (oauthQ.data.providers || []).find((p: any) => p.name === 'github')
      const defaultRedirect =
        typeof window !== 'undefined'
          ? `${window.location.origin}/login/oauth/callback`
          : 'http://localhost:8888/login/oauth/callback'
      setOauth((prev) => ({
        ...prev,
        allow_registration: Boolean(oauthQ.data.settings?.allow_registration),
        auto_link_accounts: Boolean(oauthQ.data.settings?.auto_link_accounts),
        github_enabled: Boolean(github?.enabled),
        github_client_id: github?.client_id || '',
        github_redirect_url: github?.redirect_url || defaultRedirect,
        github_configured: Boolean(github?.configured),
        github_secret_set: Boolean(github?.client_secret_set),
        // never echo secret back into the editable field
        github_client_secret: '',
      }))
    }
  }, [oauthQ.data])

  useEffect(() => {
    if (securityQ.data) setSecurity(structuredClone(securityQ.data))
  }, [securityQ.data])

  useEffect(() => {
    if (prefsQ.data) setPrefs(structuredClone(prefsQ.data))
  }, [prefsQ.data])

  useEffect(() => {
    if (promQ.data) {
      setProm({
        enabled: Boolean(promQ.data.enabled),
        url: String(promQ.data.url || ''),
        timeout: String(promQ.data.timeout || '15s'),
        mode: String(promQ.data.mode || 'off'),
        showcase: Boolean(promQ.data.showcase),
      })
    }
  }, [promQ.data])

  useEffect(() => {
    if (aiQ.data) {
      setAi({
        enabled: Boolean(aiQ.data.enabled),
        provider: aiQ.data.provider || 'mock',
        base_url: aiQ.data.base_url || '',
        model: aiQ.data.model || '',
        api_key: '',
        api_key_set: Boolean(aiQ.data.api_key_set),
        ready: Boolean(aiQ.data.ready),
      })
    }
  }, [aiQ.data])

  if (!isAdmin) {
    return (
      <div className="rounded border border-warn/40 bg-warn/10 px-5 py-8 text-sm text-warn">
        {t('adminSettings.adminRequired')}
      </div>
    )
  }

  const saveOauth = async () => {
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const defaultRedirect = `${window.location.origin}/login/oauth/callback`
      const body: Record<string, unknown> = {
        allow_registration: oauth.allow_registration,
        auto_link_accounts: oauth.auto_link_accounts,
        github_enabled: oauth.github_enabled,
        github_client_id: oauth.github_client_id,
        github_redirect_url: oauth.github_redirect_url.trim() || defaultRedirect,
      }
      if (oauth.github_client_secret.trim()) {
        body.github_client_secret = oauth.github_client_secret.trim()
      }
      await apiPut('/api/v1/settings/oauth', body)
      setMsg(t('adminSettings.oauthSaved'))
      setOauth((o) => ({ ...o, github_client_secret: '' }))
      await oauthQ.refetch()
      await systemQ.refetch()
    } catch (e: any) {
      setErr(e?.message || t('adminSettings.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  const oauthLoginReady = oauth.github_enabled && Boolean(oauth.github_client_id.trim())

  const saveSecurity = async () => {
    if (!security) return
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      await apiPut('/api/v1/settings/security', security)
      setMsg(t('adminSettings.securitySaved'))
      await securityQ.refetch()
    } catch (e: any) {
      setErr(e?.message || t('adminSettings.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  const savePrefs = async () => {
    if (!prefs) return
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const nextTheme = prefs.ui_settings?.default_theme || 'paper'
      await apiPut('/api/v1/settings/preferences', prefs)
      // Apply immediately — server prefs alone do not drive the live UI
      switchTheme(nextTheme)
      setFontId(fontPref)
      setMsg(t('adminSettings.preferencesSaved'))
      await prefsQ.refetch()
    } catch (e: any) {
      setErr(e?.message || t('adminSettings.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  const saveAi = async () => {
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      const body: Record<string, unknown> = {
        enabled: ai.enabled,
        provider: ai.provider,
        base_url: ai.base_url,
        model: ai.model,
      }
      if (ai.api_key.trim()) body.api_key = ai.api_key.trim()
      await apiPut('/api/v1/settings/ai', body)
      setMsg(t('adminSettings.aiSaved'))
      setAi((a) => ({ ...a, api_key: '' }))
      await aiQ.refetch()
      await systemQ.refetch()
    } catch (e: any) {
      setErr(e?.message || t('adminSettings.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  const saveProm = async () => {
    setBusy(true)
    setErr('')
    setMsg('')
    try {
      await apiPut('/api/v1/settings/prometheus', {
        enabled: prom.enabled,
        url: prom.url.trim(),
        timeout: prom.timeout.trim() || '15s',
      })
      setMsg(t('adminSettings.prometheusSaved'))
      await promQ.refetch()
      await systemQ.refetch()
    } catch (e: any) {
      setErr(e?.message || t('adminSettings.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  const sys = systemQ.data
  const flagLabel = (on: unknown) => (on ? t('adminSettings.on') : t('adminSettings.off'))
  const promTone =
    prom.mode === 'showcase' || (prom.enabled && prom.url) ? 'ok' : prom.enabled ? 'warn' : 'neutral'

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <PageHeader title={t('adminPages.settingsTitle')} subtitle={t('adminPages.settingsSubtitle')} />
      {err ? (
        <div className="rounded border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{err}</div>
      ) : null}
      {msg ? (
        <div className="rounded border border-ok/30 bg-ok/10 px-4 py-2 text-sm text-ok">{msg}</div>
      ) : null}

      <Card className="space-y-2 p-5">
        <h2 className="font-display text-lg font-bold tracking-[0.12em]">
          {t('adminSettings.sectionSystem')}
        </h2>
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge tone="accent">{formatAppVersion(sys?.version || APP_VERSION)}</Badge>
          <Badge tone="neutral">{sys?.environment || '—'}</Badge>
          <Badge tone="neutral">{sys?.go_version || '—'}</Badge>
        </div>
        {sys?.features ? (
          <p className="text-xs text-text-dim">
            {t('adminSettings.featuresLine', {
              oauth: flagLabel(sys.features.oauth_enabled),
              rbac: flagLabel(sys.features.rbac_enabled),
              audit: flagLabel(sys.features.audit_log_enabled),
              ai: flagLabel(sys.features.ai_enabled),
              prometheus: flagLabel(sys.features.prometheus_enabled),
            })}
          </p>
        ) : null}
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-bold tracking-[0.12em]">AI</h2>
          <Badge tone={ai.ready ? 'ok' : 'warn'}>
            {ai.ready ? t('adminSettings.ready') : t('adminSettings.notReady')}
          </Badge>
        </div>
        <p className="text-xs text-text-dim">{t('adminPages.aiHint')}</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={ai.enabled}
            onChange={(e) => setAi((a) => ({ ...a, enabled: e.target.checked }))}
          />
          {t('adminSettings.enableAi')}
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="hud-label">{t('adminSettings.provider')}</span>
            <select
              className="hud-field"
              value={ai.provider}
              onChange={(e) => setAi((a) => ({ ...a, provider: e.target.value }))}
            >
              <option value="mock">{t('adminSettings.providerMock')}</option>
              <option value="openai">openai-compatible</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('adminSettings.model')}</span>
            <input
              className="hud-field font-mono text-xs"
              value={ai.model}
              onChange={(e) => setAi((a) => ({ ...a, model: e.target.value }))}
              placeholder="gpt-4o-mini"
            />
          </label>
          <label className="block space-y-1 md:col-span-2">
            <span className="hud-label">{t('adminSettings.baseUrlOptional')}</span>
            <input
              className="hud-field font-mono text-xs"
              value={ai.base_url}
              onChange={(e) => setAi((a) => ({ ...a, base_url: e.target.value }))}
              placeholder="https://api.openai.com/v1"
            />
          </label>
          <label className="block space-y-1 md:col-span-2">
            <span className="hud-label">
              API Key{ai.api_key_set ? t('adminSettings.secretSetSuffix') : ''}
            </span>
            <input
              type="password"
              className="hud-field font-mono text-xs"
              value={ai.api_key}
              onChange={(e) => setAi((a) => ({ ...a, api_key: e.target.value }))}
              placeholder={ai.api_key_set ? '••••••••' : 'sk-…'}
              autoComplete="new-password"
            />
          </label>
        </div>
        <Button disabled={busy} onClick={() => void saveAi()}>
          {t('adminSettings.saveAi')}
        </Button>
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-bold tracking-[0.12em]">PROMETHEUS</h2>
          <Badge tone={promTone}>{prom.mode || 'off'}</Badge>
        </div>
        <p className="text-xs text-text-dim">{t('adminPages.promHint')}</p>
        {prom.showcase && !prom.enabled ? (
          <div className="rounded border border-cyan/30 bg-cyan/10 px-3 py-2 text-xs text-cyan">
            {t('adminPages.promShowcaseBanner')}
          </div>
        ) : null}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={prom.enabled}
            onChange={(e) => setProm((p) => ({ ...p, enabled: e.target.checked }))}
          />
          {t('adminSettings.enableRemoteProm')}
        </label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1 md:col-span-2">
            <span className="hud-label">URL</span>
            <input
              className="hud-field font-mono text-xs"
              value={prom.url}
              onChange={(e) => setProm((p) => ({ ...p, url: e.target.value }))}
              placeholder="http://prometheus.monitoring.svc:9090"
            />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('adminSettings.timeout')}</span>
            <input
              className="hud-field font-mono text-xs"
              value={prom.timeout}
              onChange={(e) => setProm((p) => ({ ...p, timeout: e.target.value }))}
              placeholder="15s"
            />
          </label>
        </div>
        <Button disabled={busy} onClick={() => void saveProm()}>
          {t('adminSettings.saveProm')}
        </Button>
      </Card>

      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-bold tracking-[0.12em]">OAUTH</h2>
          <Badge tone={oauthLoginReady ? 'ok' : oauth.github_enabled ? 'warn' : 'neutral'}>
            {oauthLoginReady
              ? t('adminSettings.oauthLoginReady')
              : oauth.github_enabled
                ? t('adminSettings.oauthNeedsClientId')
                : t('adminSettings.off')}
          </Badge>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={oauth.github_enabled}
            onChange={(e) => setOauth((o) => ({ ...o, github_enabled: e.target.checked }))}
          />
          {t('adminSettings.githubLoginEnabled')}
        </label>
        {oauth.github_enabled && !oauth.github_client_id.trim() ? (
          <div className="rounded border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
            {t('adminSettings.githubMissingClientId')}
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1">
            <span className="hud-label">GitHub Client ID</span>
            <input
              className="hud-field font-mono text-xs"
              value={oauth.github_client_id}
              onChange={(e) => setOauth((o) => ({ ...o, github_client_id: e.target.value }))}
              placeholder="Iv1.xxxxxxxx"
              autoComplete="off"
            />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">
              GitHub Client Secret
              {oauth.github_secret_set ? t('adminSettings.secretSetSuffix') : ''}
            </span>
            <input
              type="password"
              className="hud-field font-mono text-xs"
              value={oauth.github_client_secret}
              onChange={(e) => setOauth((o) => ({ ...o, github_client_secret: e.target.value }))}
              placeholder={oauth.github_secret_set ? '••••••••' : 'ghsecret…'}
              autoComplete="new-password"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="hud-label">{t('adminSettings.redirectUrl')}</span>
          <input
            className="hud-field font-mono text-xs"
            value={oauth.github_redirect_url}
            onChange={(e) => setOauth((o) => ({ ...o, github_redirect_url: e.target.value }))}
            placeholder={`${window.location.origin}/login/oauth/callback`}
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={oauth.allow_registration}
            onChange={(e) => setOauth((o) => ({ ...o, allow_registration: e.target.checked }))}
          />
          {t('adminSettings.allowRegistration')}
        </label>
        <p className="text-xs text-text-dim">
          {t('adminSettings.newOauthUserPrefix')} <span className="text-warn">viewer</span>{' '}
          {t('adminSettings.newOauthUserSuffix')}
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={oauth.auto_link_accounts}
            onChange={(e) => setOauth((o) => ({ ...o, auto_link_accounts: e.target.checked }))}
          />
          {t('adminSettings.autoLinkAccounts')}
        </label>
        <Button type="button" disabled={busy} onClick={() => void saveOauth()}>
          {t('adminSettings.saveOauth')}
        </Button>
      </Card>

      {security ? (
        <Card className="space-y-3 p-5">
          <h2 className="font-display text-lg font-bold tracking-[0.12em]">
            {t('adminSettings.sectionSecurity')}
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block space-y-1">
              <span className="hud-label">{t('adminSettings.minPasswordLength')}</span>
              <input
                type="number"
                className="hud-field"
                value={security.password_policy?.min_length ?? 8}
                onChange={(e) =>
                  setSecurity((s: any) => ({
                    ...s,
                    password_policy: {
                      ...s.password_policy,
                      min_length: Number(e.target.value) || 0,
                    },
                  }))
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="hud-label">{t('adminSettings.sessionTimeout')}</span>
              <input
                type="number"
                className="hud-field"
                value={security.session_settings?.session_timeout ?? 0}
                onChange={(e) =>
                  setSecurity((s: any) => ({
                    ...s,
                    session_settings: {
                      ...s.session_settings,
                      session_timeout: Number(e.target.value) || 0,
                    },
                  }))
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="hud-label">{t('adminSettings.auditRetention')}</span>
              <input
                type="number"
                className="hud-field"
                value={security.audit_settings?.retention_days ?? 30}
                onChange={(e) =>
                  setSecurity((s: any) => ({
                    ...s,
                    audit_settings: {
                      ...s.audit_settings,
                      retention_days: Number(e.target.value) || 0,
                    },
                  }))
                }
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ['require_uppercase', 'adminSettings.pwUppercase'],
                ['require_lowercase', 'adminSettings.pwLowercase'],
                ['require_numbers', 'adminSettings.pwNumbers'],
                ['require_symbols', 'adminSettings.pwSymbols'],
              ] as const
            ).map(([key, labelKey]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(security.password_policy?.[key])}
                  onChange={(e) =>
                    setSecurity((s: any) => ({
                      ...s,
                      password_policy: { ...s.password_policy, [key]: e.target.checked },
                    }))
                  }
                />
                {t(labelKey)}
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ['log_login_attempts', 'adminSettings.logLogins'],
                ['log_api_calls', 'adminSettings.logApiCalls'],
                ['log_admin_actions', 'adminSettings.logAdminActions'],
              ] as const
            ).map(([key, labelKey]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(security.audit_settings?.[key])}
                  onChange={(e) =>
                    setSecurity((s: any) => ({
                      ...s,
                      audit_settings: { ...s.audit_settings, [key]: e.target.checked },
                    }))
                  }
                />
                {t(labelKey)}
              </label>
            ))}
          </div>
          <Button type="button" disabled={busy} onClick={() => void saveSecurity()}>
            {t('adminSettings.saveSecurity')}
          </Button>
        </Card>
      ) : null}

      {prefs ? (
        <Card className="space-y-3 p-5">
          <h2 className="font-display text-lg font-bold tracking-[0.12em]">
            {t('adminSettings.sectionPreferences')}
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block space-y-1">
              <span className="hud-label">{t('userMenu.theme')}</span>
              <select
                className="hud-field"
                value={prefs.ui_settings?.default_theme || themeId || 'paper'}
                onChange={(e) => {
                  const id = e.target.value
                  setPrefs((p: any) => ({
                    ...p,
                    ui_settings: { ...p.ui_settings, default_theme: id },
                  }))
                  switchTheme(id)
                }}
              >
                {BUILTIN_THEMES.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name} ({theme.mode})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-text-dim">{t('adminSettings.themeHint')}</p>
            </label>
            <label className="block space-y-1">
              <span className="hud-label">{t('userMenu.font')}</span>
              <select
                className="hud-field"
                value={fontPref}
                onChange={(e) => {
                  setFontPref(e.target.value)
                  setFontId(e.target.value)
                }}
              >
                {FONT_PACKS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-text-dim">{t('adminSettings.fontHint')}</p>
            </label>
            <label className="block space-y-1">
              <span className="hud-label">{t('adminSettings.defaultLanguage')}</span>
              <input
                className="hud-field"
                value={prefs.ui_settings?.default_language || ''}
                onChange={(e) =>
                  setPrefs((p: any) => ({
                    ...p,
                    ui_settings: { ...p.ui_settings, default_language: e.target.value },
                  }))
                }
              />
            </label>
            <label className="block space-y-1">
              <span className="hud-label">{t('adminSettings.itemsPerPage')}</span>
              <input
                type="number"
                className="hud-field"
                value={prefs.ui_settings?.items_per_page ?? 20}
                onChange={(e) =>
                  setPrefs((p: any) => ({
                    ...p,
                    ui_settings: {
                      ...p.ui_settings,
                      items_per_page: Number(e.target.value) || 0,
                    },
                  }))
                }
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(prefs.ui_settings?.auto_refresh)}
                onChange={(e) =>
                  setPrefs((p: any) => ({
                    ...p,
                    ui_settings: { ...p.ui_settings, auto_refresh: e.target.checked },
                  }))
                }
              />
              {t('adminSettings.autoRefresh')}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(prefs.feature_flags?.advanced_metrics)}
                onChange={(e) =>
                  setPrefs((p: any) => ({
                    ...p,
                    feature_flags: { ...p.feature_flags, advanced_metrics: e.target.checked },
                  }))
                }
              />
              {t('adminSettings.advancedMetrics')}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(prefs.feature_flags?.beta_features)}
                onChange={(e) =>
                  setPrefs((p: any) => ({
                    ...p,
                    feature_flags: { ...p.feature_flags, beta_features: e.target.checked },
                  }))
                }
              />
              {t('adminSettings.betaFeatures')}
            </label>
          </div>
          <Button type="button" disabled={busy} onClick={() => void savePrefs()}>
            {t('adminSettings.savePreferences')}
          </Button>
        </Card>
      ) : null}
    </div>
  )
}
