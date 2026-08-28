import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Eye, EyeOff, RotateCcw } from 'lucide-react'
import { Button, Modal } from './ui'
import { orderNavGroups, resetNavPrefs, setNavPrefs, type NavPrefs } from '@/nav/prefs'
import type { NavGroup } from '@/nav/definitions'
import { cn } from '@/lib/utils'

function toggleIn(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((v) => v !== id) : [...list, id]
}

/** Move `id` one slot up or down within `ids`, returning the new order. */
function moveWithin(ids: string[], id: string, delta: number): string[] {
  const from = ids.indexOf(id)
  const to = from + delta
  if (from < 0 || to < 0 || to >= ids.length) return ids
  const next = [...ids]
  next.splice(to, 0, ...next.splice(from, 1))
  return next
}

function ReorderButtons({
  onUp,
  onDown,
  canUp,
  canDown,
  upLabel,
  downLabel,
}: {
  onUp: () => void
  onDown: () => void
  canUp: boolean
  canDown: boolean
  upLabel: string
  downLabel: string
}) {
  return (
    <>
      <button
        type="button"
        className="nav-customizer-icon"
        aria-label={upLabel}
        title={upLabel}
        disabled={!canUp}
        onClick={onUp}
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="nav-customizer-icon"
        aria-label={downLabel}
        title={downLabel}
        disabled={!canDown}
        onClick={onDown}
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
    </>
  )
}

function VisibilityButton({
  hidden,
  label,
  onClick,
}: {
  hidden: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn('nav-customizer-icon', hidden && 'is-off')}
      aria-label={label}
      aria-pressed={!hidden}
      title={label}
      onClick={onClick}
    >
      {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
    </button>
  )
}

/**
 * Personal sidebar layout editor. It can only reorder and hide menus the user
 * is already allowed to see — it never grants access.
 */
export function NavCustomizer({
  open,
  onClose,
  authorized,
  prefs,
}: {
  open: boolean
  onClose: () => void
  authorized: NavGroup[]
  prefs: NavPrefs
}) {
  const { t } = useTranslation()
  const groups = orderNavGroups(authorized, prefs)
  const groupIds = groups.map((group) => group.titleKey)

  const moveGroup = (titleKey: string, delta: number) => {
    setNavPrefs({ groupOrder: moveWithin(groupIds, titleKey, delta) })
  }

  const moveItem = (group: NavGroup, to: string, delta: number) => {
    const ids = group.items.map((item) => item.to)
    setNavPrefs({
      itemOrder: { ...prefs.itemOrder, [group.titleKey]: moveWithin(ids, to, delta) },
    })
  }

  const onlyThisGroup = (titleKey: string) => {
    setNavPrefs({ hiddenGroups: groupIds.filter((id) => id !== titleKey) })
  }

  const showAll = () => setNavPrefs({ hiddenGroups: [], hiddenItems: [] })

  const hiddenCount = prefs.hiddenGroups.length + prefs.hiddenItems.length

  return (
    <Modal
      open={open}
      title={t('navCustomizer.title')}
      subtitle={t('navCustomizer.subtitle')}
      onClose={onClose}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
          {groups.map((group, groupIndex) => {
            const groupHidden = prefs.hiddenGroups.includes(group.titleKey)
            return (
              <div
                key={group.titleKey}
                className={cn(
                  'rounded border border-line bg-panel/40',
                  groupHidden && 'opacity-55',
                )}
              >
                <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                  <group.icon className="h-4 w-4 shrink-0 text-cyan" />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-text">
                    {t(group.titleKey)}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 rounded border border-line px-2 py-1 text-[11px] text-text-dim transition hover:border-cyan hover:text-cyan"
                    onClick={() => onlyThisGroup(group.titleKey)}
                  >
                    {t('navCustomizer.onlyThis')}
                  </button>
                  <ReorderButtons
                    canUp={groupIndex > 0}
                    canDown={groupIndex < groups.length - 1}
                    onUp={() => moveGroup(group.titleKey, -1)}
                    onDown={() => moveGroup(group.titleKey, 1)}
                    upLabel={t('navCustomizer.moveUp')}
                    downLabel={t('navCustomizer.moveDown')}
                  />
                  <VisibilityButton
                    hidden={groupHidden}
                    label={groupHidden ? t('navCustomizer.show') : t('navCustomizer.hide')}
                    onClick={() =>
                      setNavPrefs({ hiddenGroups: toggleIn(prefs.hiddenGroups, group.titleKey) })
                    }
                  />
                </div>

                <div className="divide-y divide-line/60">
                  {group.items.map((item, itemIndex) => {
                    const itemHidden = prefs.hiddenItems.includes(item.to)
                    return (
                      <div
                        key={item.to}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5',
                          itemHidden && 'opacity-55',
                        )}
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0 text-text-dim" />
                        <span className="min-w-0 flex-1 truncate text-[12px] text-text">
                          {t(item.labelKey)}
                        </span>
                        <ReorderButtons
                          canUp={itemIndex > 0}
                          canDown={itemIndex < group.items.length - 1}
                          onUp={() => moveItem(group, item.to, -1)}
                          onDown={() => moveItem(group, item.to, 1)}
                          upLabel={t('navCustomizer.moveUp')}
                          downLabel={t('navCustomizer.moveDown')}
                        />
                        <VisibilityButton
                          hidden={itemHidden}
                          label={itemHidden ? t('navCustomizer.show') : t('navCustomizer.hide')}
                          onClick={() =>
                            setNavPrefs({ hiddenItems: toggleIn(prefs.hiddenItems, item.to) })
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <span className="text-[11px] text-text-dim">
            {hiddenCount > 0
              ? t('navCustomizer.hiddenCount', { count: hiddenCount })
              : t('navCustomizer.noneHidden')}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={showAll}>
              {t('navCustomizer.showAll')}
            </Button>
            <Button variant="ghost" type="button" onClick={() => resetNavPrefs()}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              {t('navCustomizer.reset')}
            </Button>
            <Button type="button" onClick={onClose}>
              {t('common.done')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
