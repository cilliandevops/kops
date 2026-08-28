import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  Boxes,
  History,
  Loader2,
  MessageSquarePlus,
  PanelLeftClose,
  Search,
  Terminal,
  X,
  Zap,
} from 'lucide-react'
import { getAiStatus, streamAiChat, type AiChatMessage, type AiResourceRef } from '@/api/ai'
import { AiComposer } from '@/components/AiComposer'
import { AiSessionRow } from '@/components/AiSessionRow'
import {
  clearAiSessions,
  createAiSession,
  deleteAiSession,
  displayChatTitle,
  duplicateAiSession,
  getAiSession,
  groupAiSessions,
  listAiSessions,
  migrateEmptyChatTitles,
  renameAiSession,
  saveAiSession,
  type AiSession,
} from '@/lib/aiSessions'
import {
  allAiSkills,
  deleteCustomSkill,
  upsertCustomSkill,
  type AiSkillDef,
} from '@/lib/aiSkills'
import { getFleetSummary } from '@/api/cluster'
import {
  buildFleetFocusPrompt,
  buildFleetInspectPrompt,
  buildFleetTourStepPrompt,
  buildFleetTourSummaryPrompt,
  buildInvestigatePrompt,
  fleetIssueScore,
  parseFleetFocus,
  parseFleetInspectSearch,
  parseFleetTourSearch,
  clusterContextReady,
  parseInvestigateSearch,
  resourceRefLabel,
} from '@/lib/aiInvestigate'
import { shouldSkipEnterAnim } from '@/lib/motionPrefs'
import { useCluster } from '@/store/cluster'
import { useNamespace } from '@/store/namespace'
import { cn } from '@/lib/utils'

function useIsDesktopHistory() {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => setDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return desktop
}

export function AiChatPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const emptyTitle = t('ai.newChat')
  const { clusterId, activeCluster, setClusterId, switchCluster, switching } = useCluster()
  const { namespace, setNamespace } = useNamespace()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const skipMotion = shouldSkipEnterAnim()
  const statusQ = useQuery({
    queryKey: ['ai-status'],
    queryFn: getAiStatus,
    refetchInterval: 30_000,
  })

  const [sessions, setSessions] = useState<AiSession[]>(() => migrateEmptyChatTitles())
  const [activeId, setActiveId] = useState<string>(() => migrateEmptyChatTitles()[0]?.id || '')
  const [messages, setMessages] = useState<AiChatMessage[]>(
    () => migrateEmptyChatTitles()[0]?.messages || [],
  )
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [skills, setSkills] = useState<AiSkillDef[]>(() => allAiSkills(lang))

  useEffect(() => {
    setSkills(allAiSkills(lang))
  }, [lang])

  useEffect(() => {
    setSessions(migrateEmptyChatTitles())
  }, [lang])
  const isDesktop = useIsDesktopHistory()
  const [historyOpen, setHistoryOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('cilikube_ai_rail')
      if (saved === '0') return false
      if (saved === '1') return true
    } catch {
      /* ignore */
    }
    return typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  })

  const toggleHistory = () => {
    setHistoryOpen((v) => {
      const next = !v
      try {
        localStorage.setItem('cilikube_ai_rail', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  const closeHistory = () => {
    setHistoryOpen(false)
    try {
      localStorage.setItem('cilikube_ai_rail', '0')
    } catch {
      /* ignore */
    }
  }

  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  /** Skip one persist after hydrating another session (avoids writing A’s messages into B). */
  const skipPersistRef = useRef(false)
  /** Consume resource-page / inspect deep-link (prompt + optional ns/cluster + auto). */
  const investigateJobRef = useRef<{
    prompt: string
    namespaceOverride?: string
    titleHint: string
    auto: boolean
    /** Switch to this cluster before sending (fleet inspect). */
    clusterId?: string
  } | null>(null)
  /** Fleet-wide serial inspect (`?tour=1`). */
  const fleetTourPendingRef = useRef<{ auto: boolean } | null>(null)
  const fleetTourCancelRef = useRef(false)
  const fleetTourRunningRef = useRef(false)

  const ready = Boolean(statusQ.data?.ready)
  const isEmpty = messages.length === 0

  const refreshSessions = useCallback(() => setSessions(listAiSessions()), [])

  const hydrateSession = useCallback((id: string, nextMessages: AiChatMessage[]) => {
    skipPersistRef.current = true
    setActiveId(id)
    setMessages(nextMessages)
    setErr('')
    setInput('')
  }, [])

  const ensureSession = useCallback((): string => {
    if (activeId && getAiSession(activeId)) return activeId
    const s = createAiSession({
      clusterId: clusterId || undefined,
      clusterName: activeCluster?.name,
      emptyTitle,
    })
    hydrateSession(s.id, [])
    refreshSessions()
    return s.id
  }, [activeId, clusterId, activeCluster?.name, emptyTitle, hydrateSession, refreshSessions])

  useEffect(() => {
    if (!activeId) {
      const s = createAiSession({
        clusterId: clusterId || undefined,
        clusterName: activeCluster?.name,
        emptyTitle,
      })
      hydrateSession(s.id, [])
      refreshSessions()
    }
  }, [activeId, clusterId, activeCluster?.name, emptyTitle, hydrateSession, refreshSessions])

  // Resource page → /ai?investigate=1&kind=&name=&namespace=
  // Fleet card → /ai?inspect=1&cluster=&name=&focus=
  // Fleet tour → /ai?tour=1
  useEffect(() => {
    const tour = parseFleetTourSearch(searchParams)
    if (tour) {
      fleetTourPendingRef.current = { auto: tour.auto }
      navigate('/ai', { replace: true })
      return
    }
    const fleet = parseFleetInspectSearch(searchParams)
    if (fleet) {
      const auto = searchParams.get('auto') !== '0'
      const focus = parseFleetFocus(searchParams)
      investigateJobRef.current = {
        prompt: focus
          ? buildFleetFocusPrompt(fleet.clusterName, focus, lang)
          : buildFleetInspectPrompt(fleet.clusterName, lang),
        titleHint: focus
          ? `${fleet.clusterName} · ${focus === 'unhealthy' ? t('ai.unhealthyPods') : t('fleet.warnings')}`
          : fleet.clusterName,
        auto,
        clusterId: fleet.clusterId,
      }
      if (fleet.clusterId && !clusterContextReady(fleet.clusterId, clusterId, activeCluster)) {
        setClusterId(fleet.clusterId)
      }
      navigate('/ai', { replace: true })
      return
    }
    const target = parseInvestigateSearch(searchParams)
    if (!target) return
    const auto = searchParams.get('auto') !== '0'
    investigateJobRef.current = {
      prompt: buildInvestigatePrompt(target, lang),
      namespaceOverride: target.namespace,
      titleHint: resourceRefLabel(target),
      auto,
    }
    navigate('/ai', { replace: true })
  }, [searchParams, navigate, clusterId, activeCluster?.name, setClusterId, lang, t])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: skipMotion ? 'auto' : 'smooth' })
  }, [messages, busy, skipMotion])

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false
      return
    }
    if (!activeId || busy) return
    const cur = getAiSession(activeId)
    if (!cur) return
    saveAiSession({
      ...cur,
      messages,
      clusterId: clusterId || cur.clusterId,
      clusterName: activeCluster?.name || cur.clusterName,
    })
    refreshSessions()
  }, [messages, activeId, busy, clusterId, activeCluster?.name, refreshSessions])

  const evidence = useMemo(() => {
    const refs: AiResourceRef[] = []
    const seen = new Set<string>()
    for (const m of messages) {
      for (const r of m.resources || []) {
        const k = r.href + (r.console || '')
        if (seen.has(k)) continue
        seen.add(k)
        refs.push(r)
      }
    }
    return refs
  }, [messages])

  const stopGeneration = useCallback(() => {
    fleetTourCancelRef.current = true
    abortRef.current?.abort()
    abortRef.current = null
    setBusy(false)
  }, [])

  const startNew = () => {
    stopGeneration()
    const s = createAiSession({
      clusterId: clusterId || undefined,
      clusterName: activeCluster?.name,
      emptyTitle,
    })
    hydrateSession(s.id, [])
    if (!isDesktop) closeHistory()
    refreshSessions()
  }

  const selectSession = (id: string) => {
    if (id === activeId) return
    const s = getAiSession(id)
    if (!s) return
    stopGeneration()
    hydrateSession(id, s.messages || [])
    if (!isDesktop) closeHistory()
  }

  const sessionGroups = useMemo(
    () =>
      groupAiSessions(sessions, {
        today: t('ai.groupToday'),
        yesterday: t('ai.groupYesterday'),
        week: t('ai.groupWeek'),
        month: t('ai.groupMonth'),
        older: t('ai.groupOlder'),
      }),
    [sessions, t],
  )

  const removeSession = (id: string) => {
    const cur = getAiSession(id)
    const label = displayChatTitle(cur?.title, t('ai.thisChat'))
    if (!window.confirm(t('ai.deleteChatConfirm', { title: label }))) return
    stopGeneration()
    deleteAiSession(id)
    const rest = listAiSessions()
    refreshSessions()
    if (id === activeId) {
      if (rest[0]) {
        hydrateSession(rest[0].id, rest[0].messages || [])
      } else {
        startNew()
      }
    }
  }

  const renameSession = (id: string, title: string) => {
    renameAiSession(id, title)
    refreshSessions()
  }

  const duplicateSession = (id: string) => {
    const copy = duplicateAiSession(id, {
      emptyTitle,
      copySuffix: t('ai.copySuffix'),
    })
    if (!copy) return
    stopGeneration()
    hydrateSession(copy.id, copy.messages || [])
    refreshSessions()
    if (!isDesktop) closeHistory()
  }

  const clearAllSessions = () => {
    if (!sessions.length) return
    if (!window.confirm(t('ai.clearAllConfirm', { count: sessions.length }))) return
    stopGeneration()
    clearAiSessions()
    refreshSessions()
    startNew()
  }

  const stop = () => {
    stopGeneration()
  }

  const send = async (
    text?: string,
    skillId?: string,
    opts?: {
      baseMessages?: AiChatMessage[]
      namespaceOverride?: string
      sessionId?: string
      /** Skip in-flight guard (e.g. resource-page investigate after stop). */
      force?: boolean
    },
  ): Promise<AiChatMessage[] | undefined> => {
    const content = (text ?? input).trim()
    if (!content) return undefined
    if (busy && !opts?.force) {
      setErr(t('ai.stopBeforeSend'))
      return undefined
    }
    if (!ready) {
      setErr(statusQ.isError ? t('ai.connectFailed') : t('ai.unavailable'))
      return undefined
    }

    if (!opts?.sessionId) ensureSession()
    setErr('')
    setInput('')

    const prior = opts?.baseMessages ?? messages
    const history = [...prior, { role: 'user' as const, content }]
    setMessages(history)
    setBusy(true)

    let assistant: AiChatMessage = { role: 'assistant', content: '', tools: [], resources: [] }
    setMessages([...history, assistant])

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const ns =
      opts?.namespaceOverride !== undefined
        ? opts.namespaceOverride
        : !namespace || namespace === 'all'
          ? ''
          : namespace

    const patchAssistant = (fn: (m: AiChatMessage) => AiChatMessage) => {
      assistant = fn(assistant)
      setMessages([...history, assistant])
    }

    try {
      await streamAiChat(
        history.map((m) => ({ role: m.role, content: m.content })),
        {
          namespace: ns,
          skillId,
          language: lang,
          signal: ac.signal,
        },
        {
          onToolCall: (name) => {
            patchAssistant((m) => ({
              ...m,
              tools: [...(m.tools || []), { name, ok: undefined }],
            }))
          },
          onToolResult: (name, ok, toolContent) => {
            patchAssistant((m) => {
              const tools = [...(m.tools || [])]
              const idx = tools.map((t) => t.name).lastIndexOf(name)
              if (idx >= 0) tools[idx] = { name, ok, content: toolContent }
              else tools.push({ name, ok, content: toolContent })
              return { ...m, tools }
            })
          },
          onResources: (items) => {
            patchAssistant((m) => ({ ...m, resources: mergeRefs(m.resources || [], items) }))
          },
          onMessage: (msg) => patchAssistant((m) => ({ ...m, content: msg })),
          onError: (message) => {
            setErr(message)
            patchAssistant((m) => ({
              ...m,
              content: m.content || t('ai.errorPrefix', { message }),
            }))
          },
        },
      )
    } catch (e: any) {
      if (e?.name !== 'AbortError') setErr(e?.message || t('ai.requestFailed'))
      else return undefined
    } finally {
      setBusy(false)
    }
    return [...history, assistant]
  }

  // Run pending investigate/inspect job after AI is ready (and cluster switch settles).
  useEffect(() => {
    const job = investigateJobRef.current
    if (!job) return
    if (statusQ.isLoading || switching) return
    if (!clusterContextReady(job.clusterId, clusterId, activeCluster)) return

    investigateJobRef.current = null
    if (job.namespaceOverride) setNamespace(job.namespaceOverride)

    abortRef.current?.abort()
    abortRef.current = null
    setBusy(false)
    const s = createAiSession({
      clusterId: clusterId || undefined,
      clusterName: activeCluster?.name,
      emptyTitle,
    })
    hydrateSession(s.id, [])
    renameAiSession(
      s.id,
      `${job.clusterId ? t('ai.inspectLabel') : t('ai.investigateLabel')} · ${job.titleHint}`,
    )
    refreshSessions()
    if (!isDesktop) closeHistory()

    if (job.auto) {
      if (!ready) {
        setInput(job.prompt)
        setErr(statusQ.isError ? t('ai.connectFailed') : t('ai.unavailable'))
        return
      }
      void send(job.prompt, undefined, {
        baseMessages: [],
        namespaceOverride: job.namespaceOverride || '',
        sessionId: s.id,
        force: true,
      })
      return
    }
    setInput(job.prompt)
    // job consumed via ref; deps only gate "when AI/cluster settles"
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per queued investigate job
  }, [
    ready,
    statusQ.isLoading,
    statusQ.isError,
    switching,
    clusterId,
    activeCluster?.name,
    activeCluster?.id,
    isDesktop,
    setNamespace,
    hydrateSession,
    refreshSessions,
  ])

  // Fleet tour: serial inspect across reachable clusters, then summary.
  useEffect(() => {
    const pending = fleetTourPendingRef.current
    if (!pending || fleetTourRunningRef.current) return
    if (statusQ.isLoading) return

    fleetTourPendingRef.current = null
    fleetTourRunningRef.current = true
    fleetTourCancelRef.current = false

    void (async () => {
      try {
        const summary = await getFleetSummary()
        const reachable = [...(summary.clusters || [])]
          .filter((c) => c.reachable && c.id)
          .sort((a, b) => fleetIssueScore(b) - fleetIssueScore(a))
        const targets = reachable.slice(0, 8).map((c) => ({ id: c.id, name: c.name }))

        if (!targets.length) {
          setErr(t('ai.noReachableClusters'))
          return
        }

        abortRef.current?.abort()
        abortRef.current = null
        setBusy(false)

        const s = createAiSession({
          clusterId: targets[0].id,
          clusterName: targets[0].name,
          emptyTitle,
        })
        hydrateSession(s.id, [])
        renameAiSession(
          s.id,
          `${t('ai.fleetHealth', { count: targets.length })}${reachable.length > targets.length ? '+' : ''}`,
        )
        refreshSessions()
        if (!isDesktop) closeHistory()

        if (!pending.auto || !ready) {
          setInput(buildFleetTourSummaryPrompt(targets.map((c) => c.name), lang))
          setErr(statusQ.isError ? t('ai.connectFailed') : t('ai.unavailable'))
          return
        }

        let base: AiChatMessage[] = []
        for (let i = 0; i < targets.length; i++) {
          if (fleetTourCancelRef.current) break
          const c = targets[i]
          await switchCluster(c.id)
          if (fleetTourCancelRef.current) break
          const next = await send(
            buildFleetTourStepPrompt(c.name, i + 1, targets.length, lang),
            undefined,
            {
              baseMessages: base,
              namespaceOverride: '',
              sessionId: s.id,
              force: true,
            },
          )
          if (!next) break
          base = next
        }

        if (!fleetTourCancelRef.current && base.length > 0) {
          await send(buildFleetTourSummaryPrompt(targets.map((c) => c.name), lang), undefined, {
            baseMessages: base,
            namespaceOverride: '',
            sessionId: s.id,
            force: true,
          })
        }
      } catch (e: any) {
        if (!fleetTourCancelRef.current) {
          setErr(e?.message || t('ai.requestFailed'))
        }
      } finally {
        fleetTourRunningRef.current = false
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot tour kickoff
  }, [ready, statusQ.isLoading, statusQ.isError, isDesktop, hydrateSession, refreshSessions, switchCluster])

  const startSkills = useMemo(() => skills.filter((s) => s.group === 'combo').slice(0, 3), [skills])

  const composer = (
    <AiComposer
      value={input}
      onChange={setInput}
      onSend={(text, skillId) => {
        void send(typeof text === 'string' ? text : input, skillId)
      }}
      onStop={stop}
      busy={busy}
      ready={ready}
      err={err}
      evidence={evidence}
      skills={skills}
      landing={isEmpty}
      onSaveCustomSkill={(input) => {
        const saved = upsertCustomSkill(input, lang)
        if (saved) setSkills(allAiSkills(lang))
        return saved
      }}
      onDeleteCustomSkill={(id) => {
        if (deleteCustomSkill(id)) setSkills(allAiSkills(lang))
      }}
    />
  )

  const historyRail = (onClose?: () => void) => (
    <div className="ai-ops-rail">
      <div className="ai-ops-rail-head">
        <div className="ai-ops-rail-title">{t('ai.chats')}</div>
        <div className="ai-ops-rail-actions">
          <button type="button" className="ai-ops-icon-btn" onClick={startNew} title={t('ai.newChat')}>
            <MessageSquarePlus className="h-4 w-4" />
          </button>
          {onClose ? (
            <button
              type="button"
              className="ai-ops-icon-btn"
              onClick={onClose}
              title={t('ai.closeHistory')}
              aria-label={t('ai.closeHistory')}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <button type="button" className="ai-ops-new" onClick={startNew}>
        {t('ai.newChat')}
      </button>

      <div className="ai-ops-session-list">
        {sessions.length === 0 ? (
          <p className="ai-ops-rail-empty">{t('ai.historyEmpty')}</p>
        ) : (
          <div className="ai-ops-timeline">
            {sessionGroups.map((group) => (
              <div key={group.key} className="ai-ops-session-group">
                <div className="ai-ops-session-group-label">{group.label}</div>
                {group.sessions.map((s) => (
                  <AiSessionRow
                    key={s.id}
                    session={s}
                    active={s.id === activeId}
                    onSelect={() => selectSession(s.id)}
                    onRename={(title) => renameSession(s.id, title)}
                    onDuplicate={() => duplicateSession(s.id)}
                    onDelete={() => removeSession(s.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {sessions.length > 0 ? (
        <button type="button" className="ai-ops-clear-all" onClick={clearAllSessions}>
          {t('ai.clearHistory')}
        </button>
      ) : null}
    </div>
  )

  return (
    <div className={cn('ai-ops', isEmpty && 'is-landing', historyOpen && 'rail-open')}>
      <div className="ai-ops-atmosphere" aria-hidden />

      <aside
        className={cn('ai-ops-aside', historyOpen ? 'is-open' : 'is-closed')}
        aria-hidden={!historyOpen || !isDesktop}
      >
        {historyRail(closeHistory)}
      </aside>

      <AnimatePresence>
        {historyOpen && !isDesktop ? (
          <>
            <motion.button
              type="button"
              className="ai-ops-backdrop"
              aria-label={t('ai.closeHistory')}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeHistory}
            />
            <motion.aside
              className="ai-ops-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.2 }}
            >
              {historyRail(closeHistory)}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <section className="ai-ops-stage">
        <div className="ai-ops-toolbar">
          <button
            type="button"
            className="ai-ops-icon-btn ai-ops-history-btn"
            onClick={toggleHistory}
            aria-label={historyOpen ? t('ai.closeHistory') : t('ai.openHistory')}
            aria-expanded={historyOpen}
          >
            {historyOpen && isDesktop ? <PanelLeftClose className="h-4 w-4" /> : <History className="h-4 w-4" />}
          </button>
        </div>

        {!ready ? (
          <div className="ai-ops-banner">{t('ai.unavailable')}</div>
        ) : null}

        {isEmpty ? (
          <div className="ai-ops-empty">
            <div className="ai-ops-empty-core">
              <h2 className="ai-ops-hero-title">{t('ai.heroTitle')}</h2>
              <p className="ai-ops-start-lead">{t('ai.heroSub')}</p>
              <div className="ai-ops-start-list">
                {startSkills.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="ai-ops-start-item"
                    disabled={busy || !ready}
                    onClick={() => {
                      void send(s.prompt, s.id)
                    }}
                  >
                    <span className="ai-ops-start-icon" aria-hidden>
                      {s.id === 'skill_inspect_combo' ? (
                        <Activity className="h-4 w-4" />
                      ) : s.id === 'skill_triage_combo' ? (
                        <Search className="h-4 w-4" />
                      ) : (
                        <Boxes className="h-4 w-4" />
                      )}
                    </span>
                    <span className="ai-ops-start-copy">
                      <span className="ai-ops-start-label">{s.label}</span>
                      <span className="ai-ops-start-blurb">{s.blurb}</span>
                    </span>
                  </button>
                ))}
              </div>
              {composer}
            </div>
          </div>
        ) : (
          <>
            <div className="ai-ops-messages">
              <div className="ai-ops-messages-inner">
                {messages.map((m, i) => (
                  <MessageBlock
                    key={`${activeId}-${i}`}
                    message={m}
                    pending={busy && i === messages.length - 1 && m.role === 'assistant' && !m.content}
                  />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
            <div className="ai-ops-dock">{composer}</div>
          </>
        )}
      </section>
    </div>
  )
}

function MessageBlock({ message, pending }: { message: AiChatMessage; pending?: boolean }) {
  const { t } = useTranslation()
  const user = message.role === 'user'
  return (
    <div className={cn('ai-ops-msg', user ? 'is-user' : 'is-bot')}>
      <div className="ai-ops-bubble">
        {message.tools?.length ? (
          <div className="ai-ops-tools">
            {message.tools.map((tool, ti) => (
              <div key={ti} className="ai-ops-tool">
                {tool.ok === undefined ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <span className={tool.ok ? 'ok' : 'err'}>{tool.ok ? 'OK' : 'ERR'}</span>
                )}
                <code>{tool.name}</code>
              </div>
            ))}
          </div>
        ) : null}
        <div className="ai-ops-text">
          {message.content || (pending ? <span className="ai-ops-typing">{t('ai.typing')}</span> : '')}
        </div>
        {message.resources?.length ? (
          <div className="ai-ops-cards">
            {message.resources.map((r) => (
              <ResourceCard key={r.href + (r.console || '')} refItem={r} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ResourceCard({ refItem }: { refItem: AiResourceRef }) {
  const isConsole = Boolean(refItem.console)
  // Prefer structured path so console=? survives encoding edge cases from model/tool output.
  const to = refItem.href?.startsWith('/')
    ? refItem.href
    : `/${(refItem.kind || 'pods').replace(/^\//, '')}`
  return (
    <Link to={to} className="ai-ops-card" title={refItem.label || refItem.name}>
      {isConsole ? <Terminal className="h-3.5 w-3.5 shrink-0" /> : <Zap className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{refItem.label || refItem.name}</span>
    </Link>
  )
}

function mergeRefs(a: AiResourceRef[], b: AiResourceRef[]): AiResourceRef[] {
  const seen = new Set(a.map((r) => r.href + (r.console || '')))
  const out = [...a]
  for (const r of b) {
    const k = r.href + (r.console || '')
    if (!r.href || seen.has(k)) continue
    seen.add(k)
    out.push(r)
  }
  return out
}
