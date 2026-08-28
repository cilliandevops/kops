import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { listNavPolicies, setNavPolicy } from '@/api/nav'
import { allNavGroups } from '@/nav/definitions'
import { Button, Card, EmptyState } from './ui'
import { cn } from '@/lib/utils'

/** Nav entries an admin may never hide from the admin role, or they lock themselves out. */
const ADMIN_LOCKED_GROUP = 'nav.admin'
const ADMIN_LOCKED_ITEM = '/admin/roles'

function toggleIn(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((v) => v !== id) : [...list, id]
}

/**
 * Per-role sidebar visibility. This shapes the menu only — routes and APIs stay
 * governed by the role's permissions.
 */
export function NavPolicyEditor({ roleName }: { roleName: string | null }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [hiddenGroups, setHiddenGroups] = useState<string[]>([])
  const [hiddenItems, setHiddenItems] = useState<string[]>([])
  /**
   * Which role the checkboxes were loaded for. Seeding is keyed on this rather
   * than on the query data, so a background refetch cannot discard edits the
   * admin has not saved yet.
   */
  const seededFor = useRef<string | null>(null)

  const policiesQ = useQuery({
    queryKey: ['nav-policies'],
    queryFn: listNavPolicies,
  })

  const stored = policiesQ.data?.find((p) => p.role_name === roleName)

  const save = useMutation({
    mutationFn: () => setNavPolicy(roleName!, hiddenGroups, hiddenItems),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['nav-policies'] })
      // The signed-in user may hold this role; refresh their own sidebar too.
      void queryClient.invalidateQueries({ queryKey: ['nav-policy'] })
    },
  })

  useEffect(() => {
    if (!roleName) {
      seededFor.current = null
      return
    }
    if (!policiesQ.isSuccess || seededFor.current === roleName) return
    seededFor.current = roleName
    setHiddenGroups(stored?.hidden_groups ?? [])
    setHiddenItems(stored?.hidden_items ?? [])
    save.reset()
  }, [roleName, policiesQ.isSuccess, stored, save])

  /** Drop the "saved" confirmation as soon as the selection changes again. */
  const edit = (fn: () => void) => {
    if (save.isSuccess) save.reset()
    fn()
  }

  const isLockedGroup = (titleKey: string) =>
    roleName === 'admin' && titleKey === ADMIN_LOCKED_GROUP
  const isLockedItem = (to: string) => roleName === 'admin' && to === ADMIN_LOCKED_ITEM

  const hiddenCount = hiddenGroups.length + hiddenItems.length

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <div className="font-display text-sm tracking-[0.12em]">
            {t('navPolicy.title').toUpperCase()} {roleName ? `· ${roleName}` : ''}
          </div>
          <p className="mt-0.5 text-xs text-text-dim">{t('navPolicy.subtitle')}</p>
        </div>
        {roleName ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-text-dim">
              {hiddenCount > 0
                ? t('navPolicy.hiddenCount', { count: hiddenCount })
                : t('navPolicy.noneHidden')}
            </span>
            <Button
              variant="ghost"
              type="button"
              className="px-2 py-1 text-xs"
              onClick={() =>
                edit(() => {
                  setHiddenGroups([])
                  setHiddenItems([])
                })
              }
            >
              {t('navPolicy.showAll')}
            </Button>
            <Button
              type="button"
              className="px-3 py-1.5 text-xs"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? t('common.loading') : t('navPolicy.save')}
            </Button>
          </div>
        ) : null}
      </div>

      {!roleName ? (
        <EmptyState>{t('navPolicy.selectRole')}</EmptyState>
      ) : (
        <>
          <div className="flex items-start gap-2 border-b border-line bg-warn/5 px-4 py-2.5 text-xs text-text-dim">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
            <span>{t('navPolicy.notice')}</span>
          </div>
          {save.isError ? (
            <div className="border-b border-line bg-danger/10 px-4 py-2 text-xs text-danger">
              {(save.error as Error)?.message}
            </div>
          ) : null}
          {save.isSuccess ? (
            <div className="border-b border-line bg-ok/10 px-4 py-2 text-xs text-ok">
              {t('navPolicy.saved')}
            </div>
          ) : null}

          <div className="grid max-h-[60vh] gap-3 overflow-auto p-4 sm:grid-cols-2 xl:grid-cols-3">
            {allNavGroups.map((group) => {
              const groupHidden = hiddenGroups.includes(group.titleKey)
              return (
                <div
                  key={group.titleKey}
                  className={cn(
                    'rounded border border-line bg-panel/40',
                    groupHidden && 'opacity-60',
                  )}
                >
                  <div className="flex items-center gap-2 border-b border-line px-3 py-2">
                    <input
                      id={`navpolicy-group-${group.titleKey}`}
                      type="checkbox"
                      checked={!groupHidden}
                      disabled={isLockedGroup(group.titleKey)}
                      onChange={() =>
                        edit(() => setHiddenGroups((prev) => toggleIn(prev, group.titleKey)))
                      }
                    />
                    <group.icon className="h-4 w-4 shrink-0 text-cyan" />
                    <label
                      htmlFor={`navpolicy-group-${group.titleKey}`}
                      className="min-w-0 flex-1 cursor-pointer truncate text-[13px] font-semibold text-text"
                    >
                      {t(group.titleKey)}
                    </label>
                    <button
                      type="button"
                      className="shrink-0 rounded border border-line px-1.5 py-0.5 text-[10px] text-text-dim transition hover:border-cyan hover:text-cyan"
                      onClick={() =>
                        edit(() => {
                          setHiddenGroups(
                            allNavGroups
                              .map((g) => g.titleKey)
                              .filter((key) => key !== group.titleKey && !isLockedGroup(key)),
                          )
                          setHiddenItems([])
                        })
                      }
                    >
                      {t('navPolicy.onlyThis')}
                    </button>
                  </div>
                  <div className="space-y-0.5 p-2">
                    {group.items.map((item) => {
                      const locked = isLockedItem(item.to)
                      const itemHidden = hiddenItems.includes(item.to)
                      return (
                        <label
                          key={item.to}
                          title={locked ? t('navPolicy.adminLocked') : t(item.labelKey)}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-mist',
                            (groupHidden || itemHidden) && 'opacity-60',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={!itemHidden}
                            disabled={locked}
                            onChange={() =>
                              edit(() => setHiddenItems((prev) => toggleIn(prev, item.to)))
                            }
                          />
                          <item.icon className="h-3.5 w-3.5 shrink-0 text-text-dim" />
                          <span className="min-w-0 flex-1 truncate text-[12px] text-text">
                            {t(item.labelKey)}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}
