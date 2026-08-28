/** Lightweight Agent + Skill catalog for the AI landing page (not a skill marketplace). */

export type AiSkillGroup = 'combo' | 'inspect' | 'incident' | 'navigate' | 'custom'

export type AiAgentMeta = {
  id: string
  name: string
  blurb: string
}

export type AiSkillDef = {
  id: string
  code: string
  label: string
  blurb: string
  prompt: string
  group: AiSkillGroup
  /** User-authored skill persisted in localStorage. */
  custom?: boolean
  /** Display-only hint of tools the skill tends to exercise. */
  toolsHint?: string[]
}

export type CustomSkillInput = {
  label: string
  prompt: string
  blurb?: string
}

type Loc = { en: string; zh: string }

type SkillSeed = {
  id: string
  code: string
  label: Loc
  blurb: Loc
  prompt: Loc
  group: Exclude<AiSkillGroup, 'custom'>
  toolsHint?: string[]
}

const CUSTOM_STORAGE_KEY = 'cilikube_ai_custom_skills_v1'
const MAX_CUSTOM_SKILLS = 30
const MAX_LABEL = 24
const MAX_BLURB = 48
const MAX_PROMPT = 2000

function uid() {
  return `skill_custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function isZhLang(lang?: string): boolean {
  return (lang || '').toLowerCase().startsWith('zh')
}

function pick(lang: string | undefined, v: Loc): string {
  return isZhLang(lang) ? v.zh : v.en
}

const AGENT_LOC: { name: Loc; blurb: Loc } = {
  name: { en: 'Cluster investigator', zh: '集群调查员' },
  blurb: {
    en: 'Read-only triage · ask first, then open the console',
    zh: '只读查证 · 问清楚再进控制台',
  },
}

export function defaultAiAgent(lang?: string): AiAgentMeta {
  return {
    id: 'cluster_investigator',
    name: pick(lang, AGENT_LOC.name),
    blurb: pick(lang, AGENT_LOC.blurb),
  }
}

/** @deprecated use defaultAiAgent(lang) */
export const DEFAULT_AI_AGENT: AiAgentMeta = defaultAiAgent('en')

const REPLY_EN = ' Reply in concise English.'
const REPLY_ZH = '请用简洁中文回答。'

const SKILL_SEEDS: SkillSeed[] = [
  {
    id: 'skill_inspect_combo',
    code: 'S1',
    label: { en: 'Smart inspect', zh: '智能点检' },
    blurb: { en: 'See if the cluster is healthy', zh: '先看集群是否健康' },
    prompt: {
      en:
        'Run a smart inspect: cluster overview, then Failed/Pending pods, then recent Warning/Error events.' +
        REPLY_EN,
      zh: '请做一次智能点检：先给集群概览，再列出 Failed 或 Pending 的 Pod，并汇总最近 Warning / Error 事件。' + REPLY_ZH,
    },
    group: 'combo',
    toolsHint: ['get_cluster_overview', 'list_resources'],
  },
  {
    id: 'skill_triage_combo',
    code: 'S2',
    label: { en: 'Quick triage', zh: '快速调查' },
    blurb: { en: 'Sample logs from a bad pod', zh: '从异常 Pod 抽日志定位' },
    prompt: {
      en:
        'Quick triage: find Failed or Pending pods, sample logs from a representative one, and tell me where to click in the console next.' +
        REPLY_EN,
      zh: '快速调查：找出 Failed 或 Pending 的 Pod，挑一个有代表性的看最近日志，并告诉我下一步该进控制台看哪里。' + REPLY_ZH,
    },
    group: 'combo',
    toolsHint: ['list_resources', 'get_pod_logs'],
  },
  {
    id: 'skill_workload_snap',
    code: 'S3',
    label: { en: 'Workload snapshot', zh: '工作负载快照' },
    blurb: { en: 'Check Deployments vs Services', zh: '核对 Deployment 和 Service' },
    prompt: {
      en:
        'Take a workload snapshot for the current scope: list Deployments and Services (prefer the default namespace).' +
        REPLY_EN,
      zh: '给当前关注范围做工作负载快照：列出 Deployments 和 Services（优先 default 命名空间）。' + REPLY_ZH,
    },
    group: 'combo',
    toolsHint: ['list_resources'],
  },
  {
    id: 'skill_cluster_pulse',
    code: '01',
    label: { en: 'Cluster pulse', zh: '集群脉诊' },
    blurb: { en: 'Nodes · load health', zh: '节点 · 负载健康' },
    prompt: {
      en: 'How is the cluster right now? Are nodes and critical workloads healthy?' + REPLY_EN,
      zh: '集群现在怎么样？节点和关键负载健康吗？' + REPLY_ZH,
    },
    group: 'inspect',
    toolsHint: ['get_cluster_overview'],
  },
  {
    id: 'skill_fault_scan',
    code: '02',
    label: { en: 'Fault scan', zh: '故障扫描' },
    blurb: { en: 'Failed · Pending', zh: 'Failed · Pending' },
    prompt: {
      en: 'Which pods are Failed or Pending?' + REPLY_EN,
      zh: '有哪些 Failed 或 Pending 的 Pod？' + REPLY_ZH,
    },
    group: 'incident',
    toolsHint: ['list_resources'],
  },
  {
    id: 'skill_deploy_list',
    code: '03',
    label: { en: 'Deploy inventory', zh: '部署盘点' },
    blurb: { en: 'default Deployments', zh: 'default Deployments' },
    prompt: {
      en: 'List Deployments in the default namespace.' + REPLY_EN,
      zh: '列出 default 命名空间的 Deployments。' + REPLY_ZH,
    },
    group: 'navigate',
    toolsHint: ['list_resources'],
  },
  {
    id: 'skill_log_sample',
    code: '04',
    label: { en: 'Log sample', zh: '日志取样' },
    blurb: { en: 'Sample recent output', zh: '抽样最近输出' },
    prompt: {
      en: 'Pick any pod and show its recent logs.' + REPLY_EN,
      zh: '随便挑一个 Pod，看看最近日志。' + REPLY_ZH,
    },
    group: 'inspect',
    toolsHint: ['list_resources', 'get_pod_logs'],
  },
  {
    id: 'skill_events',
    code: '05',
    label: { en: 'Event hotline', zh: '事件热线' },
    blurb: { en: 'Warning · Error', zh: 'Warning · Error' },
    prompt: {
      en: 'What Warning or Error events happened recently?' + REPLY_EN,
      zh: '最近有哪些 Warning 或 Error 事件？' + REPLY_ZH,
    },
    group: 'incident',
    toolsHint: ['list_resources'],
  },
  {
    id: 'skill_crashloop',
    code: '06',
    label: { en: 'Crash loop', zh: '崩坏回路' },
    blurb: { en: 'CrashLoop · ImagePull', zh: 'CrashLoop · ImagePull' },
    prompt: {
      en: 'Are there CrashLoopBackOff or ImagePullBackOff pods?' + REPLY_EN,
      zh: '有没有 CrashLoopBackOff 或 ImagePullBackOff 的 Pod？' + REPLY_ZH,
    },
    group: 'incident',
    toolsHint: ['list_resources'],
  },
  {
    id: 'skill_node_pressure',
    code: '07',
    label: { en: 'Node pressure', zh: '节点压力' },
    blurb: { en: 'CPU · memory pressure', zh: 'CPU · 内存紧张度' },
    prompt: {
      en: 'Which node is under the most pressure? Summarize node status.' + REPLY_EN,
      zh: '哪个节点资源最紧张？帮我看看节点状态。' + REPLY_ZH,
    },
    group: 'inspect',
    toolsHint: ['list_resources', 'get_cluster_overview'],
  },
  {
    id: 'skill_svc_map',
    code: '08',
    label: { en: 'Service map', zh: '服务地图' },
    blurb: { en: 'Services list', zh: 'Services 列表' },
    prompt: {
      en: 'List Services in the default namespace.' + REPLY_EN,
      zh: '列出 default 命名空间里的 Service。' + REPLY_ZH,
    },
    group: 'navigate',
    toolsHint: ['list_resources'],
  },
  {
    id: 'skill_restarts',
    code: '09',
    label: { en: 'Restart spikes', zh: '重启异常' },
    blurb: { en: 'High restartCount', zh: '高 restartCount' },
    prompt: {
      en: 'Are there pods with unusually high restart counts?' + REPLY_EN,
      zh: '有没有重启次数特别高的 Pod？' + REPLY_ZH,
    },
    group: 'incident',
    toolsHint: ['list_resources'],
  },
  {
    id: 'skill_namespaces',
    code: '10',
    label: { en: 'Namespaces', zh: '命名空间' },
    blurb: { en: 'Namespace inventory', zh: 'Namespaces 盘点' },
    prompt: {
      en: 'What namespaces exist, and roughly how many workloads in each?' + REPLY_EN,
      zh: '当前集群有哪些命名空间？各自大概有多少工作负载？' + REPLY_ZH,
    },
    group: 'navigate',
    toolsHint: ['list_resources', 'get_cluster_overview'],
  },
]

const GROUP_LABEL: Record<AiSkillGroup, Loc> = {
  combo: { en: 'Featured', zh: '精选' },
  inspect: { en: 'Inspect', zh: '巡检' },
  incident: { en: 'Incidents', zh: '排障' },
  navigate: { en: 'Navigate', zh: '导航' },
  custom: { en: 'Custom', zh: '自定义' },
}

export function skillGroupLabel(group: AiSkillGroup, lang?: string): string {
  return pick(lang, GROUP_LABEL[group])
}

/** @deprecated use skillGroupLabel(group, lang) */
export const AI_SKILL_GROUP_LABEL: Record<AiSkillGroup, string> = {
  combo: GROUP_LABEL.combo.en,
  inspect: GROUP_LABEL.inspect.en,
  incident: GROUP_LABEL.incident.en,
  navigate: GROUP_LABEL.navigate.en,
  custom: GROUP_LABEL.custom.en,
}

function localizeSeed(seed: SkillSeed, lang?: string): AiSkillDef {
  return {
    id: seed.id,
    code: seed.code,
    label: pick(lang, seed.label),
    blurb: pick(lang, seed.blurb),
    prompt: pick(lang, seed.prompt),
    group: seed.group,
    toolsHint: seed.toolsHint,
  }
}

/** Builtin skills localized for the active UI language. */
export const AI_SKILLS: AiSkillDef[] = SKILL_SEEDS.map((s) => localizeSeed(s, 'en'))

function customBlurbFallback(lang?: string): string {
  return isZhLang(lang) ? '自定义 Prompt' : 'Custom prompt'
}

function readCustomSkills(): AiSkillDef[] {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as AiSkillDef[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((s) => s && typeof s.id === 'string' && typeof s.label === 'string' && typeof s.prompt === 'string')
      .map((s, i) => ({
        id: s.id,
        code: s.code || `C${i + 1}`,
        label: String(s.label).slice(0, MAX_LABEL),
        blurb: String(s.blurb || customBlurbFallback('en')).slice(0, MAX_BLURB),
        prompt: String(s.prompt).slice(0, MAX_PROMPT),
        group: 'custom' as const,
        custom: true,
      }))
  } catch {
    return []
  }
}

function writeCustomSkills(skills: AiSkillDef[]) {
  try {
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(skills.slice(0, MAX_CUSTOM_SKILLS)))
  } catch {
    /* quota / private mode */
  }
}

export function listCustomSkills(): AiSkillDef[] {
  return readCustomSkills()
}

export function allAiSkills(lang?: string): AiSkillDef[] {
  return [...SKILL_SEEDS.map((s) => localizeSeed(s, lang)), ...listCustomSkills()]
}

export function sanitizeCustomSkillInput(
  input: CustomSkillInput,
  lang?: string,
): CustomSkillInput | null {
  const label = input.label.trim().replace(/\s+/g, ' ').slice(0, MAX_LABEL)
  const prompt = input.prompt.trim().slice(0, MAX_PROMPT)
  const blurb = (input.blurb || '').trim().replace(/\s+/g, ' ').slice(0, MAX_BLURB)
  if (!label || !prompt) return null
  return { label, prompt, blurb: blurb || customBlurbFallback(lang) }
}

export function upsertCustomSkill(
  input: CustomSkillInput & { id?: string },
  lang?: string,
): AiSkillDef | null {
  const clean = sanitizeCustomSkillInput(input, lang)
  if (!clean) return null
  const existing = readCustomSkills()
  if (input.id) {
    const idx = existing.findIndex((s) => s.id === input.id)
    if (idx >= 0) {
      const next: AiSkillDef = {
        ...existing[idx],
        label: clean.label,
        blurb: clean.blurb || existing[idx].blurb,
        prompt: clean.prompt,
        group: 'custom',
        custom: true,
      }
      const list = [...existing]
      list[idx] = next
      writeCustomSkills(list)
      return next
    }
  }
  const skill: AiSkillDef = {
    id: uid(),
    code: `C${existing.length + 1}`,
    label: clean.label,
    blurb: clean.blurb || customBlurbFallback(lang),
    prompt: clean.prompt,
    group: 'custom',
    custom: true,
  }
  writeCustomSkills([skill, ...existing])
  return skill
}

export function deleteCustomSkill(id: string): boolean {
  const existing = readCustomSkills()
  const next = existing.filter((s) => s.id !== id)
  if (next.length === existing.length) return false
  writeCustomSkills(next.map((s, i) => ({ ...s, code: `C${i + 1}` })))
  return true
}

export function skillsByGroup(
  skills: AiSkillDef[] = AI_SKILLS,
  lang?: string,
): { group: AiSkillGroup; label: string; skills: AiSkillDef[] }[] {
  const order: AiSkillGroup[] = ['combo', 'inspect', 'incident', 'navigate', 'custom']
  return order
    .map((group) => ({
      group,
      label: skillGroupLabel(group, lang),
      skills: skills.filter((s) => s.group === group),
    }))
    .filter((g) => g.group === 'custom' || g.skills.length > 0)
}

/** Slash token just before the caret, e.g. `/inspect` or `/fault`. */
export function parseSlashToken(
  value: string,
  cursor: number,
): { start: number; query: string } | null {
  const before = value.slice(0, Math.max(0, cursor))
  const m = before.match(/(?:^|[\s\n])(\/[^\s]*)$/)
  if (!m) return null
  const token = m[1]
  const start = before.length - token.length
  return { start, query: token.slice(1) }
}

export function filterSkillsByQuery(
  skills: AiSkillDef[],
  query: string,
  lang?: string,
): AiSkillDef[] {
  const q = query.trim().toLowerCase()
  if (!q) return skills
  return skills.filter((s) => {
    const hay = [
      s.label,
      s.blurb,
      s.code,
      s.id,
      s.id.replace(/^skill_/, ''),
      skillGroupLabel(s.group, lang),
      ...(s.toolsHint || []),
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q) || s.label.includes(query.trim())
  })
}
