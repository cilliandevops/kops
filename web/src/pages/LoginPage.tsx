import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { fetchOAuthProviders, register, type OAuthProviderInfo } from '@/api/auth'
import { fetchShowcaseInfo, type ShowcaseInfo } from '@/api/showcase'
import { useAuth } from '@/store/auth'
import { BrandMark } from '@/components/BrandMark'
import { ParticleField } from '@/components/ParticleField'
import { StarSupportRotator } from '@/components/StarSupportCta'
import { Button, Input } from '@/components/ui'
import { APP_REPO_URL, APP_VERSION, formatAppVersion } from '@/lib/version'

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.41-4.04-1.41-.55-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z" />
    </svg>
  )
}

export function LoginPage() {
  const { t } = useTranslation()
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [providers, setProviders] = useState<OAuthProviderInfo[]>([])
  const [allowRegistration, setAllowRegistration] = useState(false)
  const [oauthStatus, setOauthStatus] = useState<'loading' | 'ready' | 'partial' | 'off' | 'error'>(
    'loading',
  )
  const [oauthHint, setOauthHint] = useState('')
  const [showcase, setShowcase] = useState<ShowcaseInfo | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [oauthData, showcaseData] = await Promise.all([
          fetchOAuthProviders(),
          fetchShowcaseInfo(),
        ])
        if (cancelled) return
        setShowcase(showcaseData.showcase ? showcaseData : null)
        const list = oauthData.providers || []
        setProviders(list)
        // Never offer self-registration on the public showcase.
        setAllowRegistration(Boolean(oauthData.allow_registration) && !showcaseData.showcase)
        const ready = list.filter((p) => p.login_ready && p.auth_url)
        const enabledOnly = list.filter((p) => p.enabled && !p.configured)
        if (showcaseData.showcase) {
          setOauthStatus('off')
          setOauthHint('')
        } else if (ready.length) {
          setOauthStatus('ready')
          setOauthHint('')
        } else if (enabledOnly.length) {
          setOauthStatus('partial')
          setOauthHint(t('login.oauthMissing'))
        } else {
          setOauthStatus('off')
          setOauthHint('')
        }
      } catch {
        if (!cancelled) {
          setOauthStatus('error')
          setOauthHint(t('login.oauthLoadFailed'))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [t])

  if (isAuthenticated) return <Navigate to="/ai" replace />

  const readyProviders = providers.filter((p) => p.login_ready && p.auth_url)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'register') {
        await register(username.trim(), email.trim(), password)
        await login(username.trim(), password)
      } else {
        await login(username, password)
      }
      navigate('/ai')
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || t('login.requestFailed'))
    } finally {
      setLoading(false)
    }
  }

  const fillAccount = (user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
    setMode('login')
    setError('')
  }

  return (
    <div className="login-page relative flex min-h-dvh w-full flex-col overflow-x-hidden">
      {/* Fixed, not absolute: the grid it lights up is a `background-attachment: fixed`
          layer, so anchoring to the viewport is what keeps the two in register. The
          explicit size is load-bearing — inset alone leaves a replaced element like
          <canvas> at its intrinsic 300x150. */}
      <ParticleField className="pointer-events-none fixed inset-0 h-full w-full" />

      <div className="login-enter relative mx-auto grid w-full max-w-[1100px] flex-1 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-center lg:gap-x-10 xl:gap-x-16">
        {/* Brand / pitch — top on mobile, left on desktop */}
        <aside className="login-brand flex flex-col items-center px-5 pb-3 pt-[max(1.25rem,env(safe-area-inset-top))] text-center sm:px-8 lg:items-start lg:justify-center lg:px-6 lg:py-8 lg:text-left xl:px-2">
          <div className="flex w-full max-w-md flex-col items-center justify-center lg:items-start">
            <BrandMark
              brandClassName="text-3xl sm:text-4xl lg:text-[2.75rem]"
              className="items-baseline justify-center gap-2 sm:gap-2.5 lg:justify-start"
            />
            <p className="mt-2 max-w-md text-sm tracking-[0.12em] text-text-dim uppercase sm:mt-3 sm:text-[13px]">
              {t('boot.subtitle')}
            </p>
            <div className="mt-4 flex justify-center lg:justify-start">
              <StarSupportRotator className="justify-center text-center lg:justify-start lg:text-left" />
            </div>
            <p className="mt-5 hidden max-w-md text-[15px] leading-relaxed text-text lg:block">
              {t('login.pitch')}
            </p>
            <ul className="mt-7 hidden max-w-md space-y-3 text-sm leading-snug text-text-dim lg:block">
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                {t('login.pitchBullet1')}
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
                {t('login.pitchBullet2')}
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                {t('login.pitchBullet3')}
              </li>
            </ul>
          </div>
        </aside>

        {/* Form — below brand on mobile, right on desktop */}
        <main className="login-form-col flex items-start justify-center px-4 pb-2 pt-1 sm:px-8 sm:pt-2 lg:items-center lg:justify-end lg:px-6 lg:py-8 xl:px-2">
          <form
            className="hud-panel login-card w-full max-w-md space-y-3.5 rounded-md p-5 sm:space-y-4 sm:p-6"
            onSubmit={onSubmit}
          >
            <div>
              <div className="hud-label">{t('login.authenticate')}</div>
              <h1 className="mt-1 font-display text-xl font-bold tracking-[0.12em] text-text">
                {mode === 'login' ? t('login.signIn') : t('login.register')}
              </h1>
              <p className="mt-1 text-[13px] text-text-dim">
                {mode === 'login' ? t('login.subtitle') : t('login.createAccount')}
              </p>
            </div>

            {showcase?.accounts?.length ? (
              <div className="rounded border border-cyan/30 bg-cyan/5 px-3 py-2.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="hud-label text-cyan">{t('login.accounts')}</div>
                  <span className="shrink-0 text-[10px] text-text-dim">{t('login.clickToFill')}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {showcase.accounts.map((a) => (
                    <button
                      key={a.username}
                      type="button"
                      className="w-full rounded border border-line/60 bg-bg/50 px-3 py-2 text-left transition hover:border-cyan/50"
                      onClick={() => fillAccount(a.username, a.password)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-medium text-text">{a.username}</span>
                        <span className="shrink-0 rounded bg-cyan/10 px-1.5 py-0.5 text-[10px] tracking-wide text-cyan uppercase">
                          {a.role}
                        </span>
                      </div>
                      <div className="mt-0.5 break-all font-mono text-[11px] leading-snug text-text-dim">
                        {a.password}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="block space-y-1">
              <span className="hud-label">{t('login.username')}</span>
              <Input
                className="h-11 text-base sm:h-10 sm:text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            {mode === 'register' ? (
              <label className="block space-y-1">
                <span className="hud-label">{t('login.email')}</span>
                <Input
                  className="h-11 text-base sm:h-10 sm:text-sm"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
            ) : null}
            <label className="block space-y-1">
              <span className="hud-label">{t('login.password')}</span>
              <Input
                className="h-11 text-base sm:h-10 sm:text-sm"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </label>

            {error ? (
              <div className="rounded border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              className="h-11 w-full tracking-[0.14em] uppercase sm:h-10"
              disabled={loading}
            >
              {loading
                ? t('common.loading')
                : mode === 'login'
                  ? t('login.enter')
                  : t('login.createAccount')}
            </Button>

            {allowRegistration ? (
              <button
                type="button"
                className="w-full text-center text-xs tracking-[0.12em] text-cyan uppercase hover:underline"
                onClick={() => {
                  setMode((m) => (m === 'login' ? 'register' : 'login'))
                  setError('')
                }}
              >
                {mode === 'login' ? t('login.needAccount') : t('login.haveAccount')}
              </button>
            ) : null}

            {oauthStatus === 'partial' || oauthStatus === 'error' ? (
              <div className="rounded border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-warn">
                {oauthHint}
              </div>
            ) : null}

            {oauthStatus === 'ready' && readyProviders.length ? (
              <>
                <div className="flex items-center gap-3 text-[11px] tracking-[0.14em] text-text-dim uppercase">
                  <span className="h-px flex-1 bg-line" />
                  {t('login.or')}
                  <span className="h-px flex-1 bg-line" />
                </div>
                {readyProviders.map((p) => (
                  <Button
                    key={p.name}
                    type="button"
                    variant="outline"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 tracking-[0.14em] uppercase"
                    onClick={() => {
                      window.location.href = p.auth_url!
                    }}
                  >
                    {p.name === 'github' ? <GitHubMark className="h-4 w-4 shrink-0" /> : null}
                    {p.name === 'github'
                      ? t('login.continueGithub')
                      : `${t('login.enter')} ${p.display_name || p.name}`}
                  </Button>
                ))}
                {allowRegistration ? (
                  <p className="text-center text-[10px] text-text-dim">{t('login.oauthViewerHint')}</p>
                ) : (
                  <p className="text-center text-[10px] text-text-dim">{t('login.oauthLinkedOnly')}</p>
                )}
              </>
            ) : null}
          </form>
        </main>
      </div>

      <footer className="login-footer">
        <a href={APP_REPO_URL} target="_blank" rel="noreferrer noopener">
          ★ {t('cta.starAction')}
        </a>
        <span className="login-footer-sep" aria-hidden>
          ·
        </span>
        <a href={APP_REPO_URL} target="_blank" rel="noreferrer noopener">
          cilikube-2026@ciliverse
        </a>
        <span className="login-footer-sep" aria-hidden>
          ·
        </span>
        <span>{formatAppVersion(APP_VERSION)}</span>
      </footer>
    </div>
  )
}
