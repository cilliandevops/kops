import { useEffect, useId, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Trash2, X } from 'lucide-react'
import type { AiSkillDef, CustomSkillInput } from '@/lib/aiSkills'

type Props = {
  open: boolean
  initial?: AiSkillDef | null
  onClose: () => void
  onSave: (input: CustomSkillInput & { id?: string }) => void
  onDelete?: (id: string) => void
}

export function AiSkillEditor({ open, initial, onClose, onSave, onDelete }: Props) {
  const { t } = useTranslation()
  const titleId = useId()
  const [label, setLabel] = useState('')
  const [blurb, setBlurb] = useState('')
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    if (!open) return
    setLabel(initial?.label || '')
    setBlurb(initial?.custom ? initial.blurb || '' : '')
    setPrompt(initial?.prompt || '')
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave({
      id: initial?.custom ? initial.id : undefined,
      label,
      blurb,
      prompt,
    })
  }

  const canSave = label.trim().length > 0 && prompt.trim().length > 0

  return createPortal(
    <div className="ai-ops-skill-editor-backdrop" role="presentation" onClick={onClose}>
      <form
        className="ai-ops-skill-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="ai-ops-skill-editor-head">
          <div>
            <div className="ai-ops-kicker">Skill</div>
            <h2 id={titleId} className="ai-ops-skill-editor-title">
              {initial?.custom ? t('ai.editCustomSkill') : t('ai.createCustomSkill')}
            </h2>
          </div>
          <button
            type="button"
            className="ai-ops-icon-btn"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="ai-ops-skill-editor-field">
          <span>{t('common.name')}</span>
          <input
            autoFocus
            value={label}
            maxLength={24}
            placeholder={t('ai.skillNamePlaceholder')}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>

        <label className="ai-ops-skill-editor-field">
          <span>{t('ai.skillBlurbOptional')}</span>
          <input
            value={blurb}
            maxLength={48}
            placeholder={t('ai.skillBlurbPlaceholder')}
            onChange={(e) => setBlurb(e.target.value)}
          />
        </label>

        <label className="ai-ops-skill-editor-field">
          <span>Prompt</span>
          <textarea
            value={prompt}
            maxLength={2000}
            rows={6}
            placeholder={t('ai.skillPromptPlaceholder')}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </label>

        <div className="ai-ops-skill-editor-foot">
          <p className="ai-ops-skill-editor-note">{t('ai.skillEditorNote')}</p>
          <div className="ai-ops-skill-editor-actions">
            {initial?.custom && onDelete ? (
              <button
                type="button"
                className="ai-ops-skill-editor-delete"
                onClick={() => onDelete(initial.id)}
                title={t('common.delete')}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('common.delete')}
              </button>
            ) : null}
            <button type="button" className="ai-ops-skill-editor-cancel" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="ai-ops-send" disabled={!canSave}>
              {t('common.save')}
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  )
}
