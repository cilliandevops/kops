import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const STEPS = [
  'cilikube bootloader v1.5.0',
  'initializing control-plane UI',
  'loading casbin policy cache',
  'probing cluster contexts',
  'mounting metrics adapters',
  'calibrating operator console',
  'securing auth gateway',
  'system online',
]

const BOOT_SESSION_KEY = 'cilikube_boot_done'

function ts(i: number): string {
  const v = (i * 0.37 + (i % 3) * 0.08 + 0.12).toFixed(2)
  return v.padStart(5, ' ')
}

export function shouldShowBootScreen(): boolean {
  if (typeof window === 'undefined') return false
  if (sessionStorage.getItem(BOOT_SESSION_KEY)) return false
  if (window.location.pathname.startsWith('/login/oauth/callback')) return false
  // Opt-out: ?boot=0 or localStorage cilikube_boot=0
  try {
    const params = new URLSearchParams(window.location.search)
    if (params.get('boot') === '0' || localStorage.getItem('cilikube_boot') === '0') {
      sessionStorage.setItem(BOOT_SESSION_KEY, '1')
      return false
    }
  } catch {
    /* ignore */
  }
  try {
    if (localStorage.getItem('cilikube_token')) return false
  } catch {
    /* ignore */
  }
  return true
}

export function markBootDone() {
  try {
    sessionStorage.setItem(BOOT_SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function BootScreen({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation()
  const [count, setCount] = useState(0)
  const [exiting, setExiting] = useState(false)
  const doneRef = useRef(false)

  const finish = () => {
    if (doneRef.current) return
    doneRef.current = true
    markBootDone()
    setExiting(true)
    window.setTimeout(onDone, 560)
  }

  useEffect(() => {
    if (count < STEPS.length) {
      const t = window.setTimeout(() => setCount((c) => c + 1), count === 0 ? 320 : 200)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(finish, 600)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  useEffect(() => {
    const skip = () => finish()
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const progress = Math.round((count / STEPS.length) * 100)
  const ready = count >= STEPS.length

  return (
    <div className={`ck-boot${exiting ? ' ck-boot-exit' : ''}`} role="dialog" aria-label="booting">
      <div className="ck-boot-scan" aria-hidden />
      <div className="ck-boot-inner">
        <div className="ck-boot-logo" data-text="CILIKUBE">
          CILI<span className="accent">KUBE</span>
        </div>
        <div className="ck-boot-sub">// {t('boot.subtitle')}</div>

        <div className="ck-boot-log">
          {STEPS.slice(0, count).map((s, i) => (
            <div className="ck-boot-line" key={s}>
              <span className="ck-boot-ts">[{ts(i)}]</span>
              <span className="ck-boot-ok">OK</span>
              <span className="ck-boot-msg">{s}</span>
            </div>
          ))}
          {ready ? (
            <div className="ck-boot-line ck-boot-ready">
              <span className="ck-boot-msg">ENTERING CONSOLE</span>
              <span className="ck-boot-cursor">▋</span>
            </div>
          ) : null}
        </div>

        <div className="ck-boot-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="ck-boot-hint">press any key to skip</div>
      </div>
    </div>
  )
}
