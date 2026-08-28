import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createAdminUser,
  deleteAdminUser,
  listAdminRoles,
  listAdminUsers,
  updateAdminUser,
  updateAdminUserStatus,
  type AdminUser,
} from '@/api/admin'
import { listClusters } from '@/api/cluster'
import {
  createAccessGrant,
  deleteAccessGrant,
  listAccessGrants,
} from '@/api/environment'
import { useAuth } from '@/store/auth'
import { Badge, Button, EmptyState, Modal, PageHeader } from '@/components/ui'
import { HudTable, HudTablePanel, ListPageFrame } from '@/components/HudTableScroll'
import { ConfirmDialog } from '@/components/ConfirmDialog'

/** Assignable roles for created/edited users — never includes admin. */
const ROLE_CHOICES = ['viewer', 'editor'] as const

function isProtectedUser(username: string) {
  const u = username.trim().toLowerCase()
  return u === 'admin' || u === 'guest'
}

export function AdminUsersPage() {
  const { t } = useTranslation()
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [grantUser, setGrantUser] = useState<AdminUser | null>(null)
  const [grantCluster, setGrantCluster] = useState('')
  const [grantNs, setGrantNs] = useState('')
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null)
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const [form, setForm] = useState({
    username: '',
    email: '',
    display_name: '',
    password: '',
    confirmPassword: '',
    roles: ['viewer'] as string[],
  })

  const usersQ = useQuery({
    queryKey: ['admin-users'],
    enabled: isAdmin,
    queryFn: () => listAdminUsers(),
  })

  const rolesQ = useQuery({
    queryKey: ['admin-roles'],
    enabled: isAdmin,
    queryFn: listAdminRoles,
  })
  const grantsQ = useQuery({
    queryKey: ['access-grants', grantUser?.id],
    enabled: isAdmin && Boolean(grantUser),
    queryFn: () => listAccessGrants(grantUser?.id),
  })
  const clustersQ = useQuery({
    queryKey: ['clusters'],
    enabled: isAdmin && Boolean(grantUser),
    queryFn: listClusters,
  })

  const roleNames =
    rolesQ.data?.map((r) => r.name).filter(Boolean) || [...ROLE_CHOICES]

  if (!isAdmin) {
    return (
      <div className="rounded border border-warn/40 bg-warn/10 px-5 py-8 text-sm text-warn">
        {t('adminPages.adminRequired')}
      </div>
    )
  }

  const users = usersQ.data || []

  const resetForm = (user?: AdminUser | null) => {
    if (user) {
      setForm({
        username: user.username,
        email: user.email || '',
        display_name: user.display_name || '',
        password: '',
        confirmPassword: '',
        roles: user.roles?.length ? [...user.roles] : ['viewer'],
      })
    } else {
      setForm({
        username: '',
        email: '',
        display_name: '',
        password: '',
        confirmPassword: '',
        roles: ['viewer'],
      })
    }
  }

  const toggleRole = (name: string) => {
    setForm((f) => {
      const has = f.roles.includes(name)
      if (has) return { ...f, roles: f.roles.filter((r) => r !== name) }
      return { ...f, roles: [...f.roles, name] }
    })
  }

  const create = async () => {
    setBusy(true)
    setErr('')
    try {
      if (!form.username || !form.email || !form.password) {
        throw new Error(t('adminPages.userFieldsRequired'))
      }
      if (isProtectedUser(form.username)) {
        throw new Error(t('adminPages.usernameReserved'))
      }
      if (form.password !== form.confirmPassword) {
        throw new Error(t('adminPages.passwordMismatch'))
      }
      const safeRoles = form.roles.filter((r) => r !== 'admin')
      await createAdminUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        display_name: form.display_name.trim(),
        roles: (safeRoles.length ? safeRoles : ['viewer']).join(','),
      })
      setCreating(false)
      resetForm()
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (e: any) {
      setErr(e?.message || t('adminPages.createFailed'))
    } finally {
      setBusy(false)
    }
  }

  const saveEdit = async () => {
    if (!editTarget) return
    if (isProtectedUser(editTarget.username)) {
      setErr(t('adminPages.cannotChangeProtected', { username: editTarget.username }))
      return
    }
    setBusy(true)
    setErr('')
    try {
      const safeRoles = form.roles.filter((r) => r !== 'admin')
      await updateAdminUser(editTarget.id, {
        email: form.email.trim(),
        display_name: form.display_name.trim(),
        roles: safeRoles.length ? safeRoles : ['viewer'],
        is_active: editTarget.is_active,
      })
      setEditTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || t('adminPages.updateFailed'))
    } finally {
      setBusy(false)
    }
  }

  const toggle = async (user: AdminUser) => {
    if (isProtectedUser(user.username)) {
      setErr(t('adminPages.cannotDisableProtected', { username: user.username }))
      return
    }
    setBusy(true)
    setErr('')
    try {
      await updateAdminUserStatus(user.id, !(user.is_active ?? true))
      await usersQ.refetch()
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || t('adminPages.updateFailed'))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    if (isProtectedUser(deleteTarget.username)) {
      setErr(t('adminPages.cannotDeleteProtected', { username: deleteTarget.username }))
      setDeleteTarget(null)
      return
    }
    setBusy(true)
    try {
      await deleteAdminUser(deleteTarget.id)
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || t('adminPages.deleteFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ListPageFrame className="gap-3">
      <PageHeader
        title={t('admin.users')}
        subtitle={t('admin.usersSubtitle')}
        action={
          <Button
            type="button"
            className="px-3 py-1.5 text-xs"
            onClick={() => {
              resetForm()
              setErr('')
              setCreating(true)
            }}
          >
            {t('admin.createUser')}
          </Button>
        }
      />
      {err ? (
        <div className="shrink-0 rounded border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">{err}</div>
      ) : null}
      <HudTablePanel>
          <HudTable>
            <thead>
              <tr>
                <th>ID</th>
                <th>{t('adminPages.username')}</th>
                <th>{t('adminPages.email')}</th>
                <th>{t('adminPages.roles')}</th>
                <th>{t('adminPages.colActive')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td className="font-semibold text-cyan">{u.username}</td>
                  <td>{u.email || '-'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {(u.roles?.length ? u.roles : ['-']).map((r) => (
                        <Badge key={r} tone="accent">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Badge tone={u.is_active !== false ? 'ok' : 'danger'}>
                      {u.is_active !== false ? t('common.yes') : t('common.no')}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-xs"
                        type="button"
                        onClick={() => {
                          setGrantUser(u)
                          setGrantCluster('')
                          setGrantNs('')
                        }}
                      >
                        {t('adminPages.grants')}
                      </Button>
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-xs"
                        type="button"
                        disabled={isProtectedUser(u.username)}
                        title={
                          isProtectedUser(u.username)
                            ? t('adminPages.protectedNoChange')
                            : undefined
                        }
                        onClick={() => {
                          resetForm(u)
                          setErr('')
                          setEditTarget(u)
                        }}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        className="px-2 py-1 text-xs"
                        type="button"
                        disabled={busy || isProtectedUser(u.username)}
                        title={
                          isProtectedUser(u.username)
                            ? t('adminPages.protectedAccount')
                            : undefined
                        }
                        onClick={() => void toggle(u)}
                      >
                        {t('adminPages.toggle')}
                      </Button>
                      <Button
                        variant="danger"
                        className="px-2 py-1 text-xs"
                        type="button"
                        disabled={isProtectedUser(u.username)}
                        title={
                          isProtectedUser(u.username)
                            ? t('adminPages.protectedAccount')
                            : undefined
                        }
                        onClick={() => setDeleteTarget(u)}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!usersQ.isLoading && !users.length ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState>{t('adminPages.noUsers')}</EmptyState>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </HudTable>
      </HudTablePanel>

      <Modal
        open={creating || Boolean(editTarget)}
        title={creating ? t('admin.createUser') : t('adminPages.editUser')}
        subtitle={editTarget?.username}
        onClose={() => {
          setCreating(false)
          setEditTarget(null)
        }}
      >
        <div className="space-y-3 p-5">
          {creating ? (
            <label className="block space-y-1">
              <span className="hud-label">{t('adminPages.username')}</span>
              <input
                className="hud-field"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </label>
          ) : null}
          <label className="block space-y-1">
            <span className="hud-label">{t('adminPages.email')}</span>
            <input
              className="hud-field"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('adminPages.displayName')}</span>
            <input
              className="hud-field"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
            />
          </label>
          {creating ? (
            <>
              <label className="block space-y-1">
                <span className="hud-label">{t('adminPages.password')}</span>
                <input
                  type="password"
                  className="hud-field"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="hud-label">{t('adminPages.confirmPassword')}</span>
                <input
                  type="password"
                  className="hud-field"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                />
              </label>
            </>
          ) : null}
          <div>
            <div className="hud-label mb-2">{t('adminPages.roles')}</div>
            <p className="mb-2 text-[11px] text-text-dim">{t('adminPages.adminRoleReserved')}</p>
            <div className="flex flex-wrap gap-2">
              {roleNames
                .filter((name) => name !== 'admin')
                .map((name) => {
                  const on = form.roles.includes(name)
                  return (
                    <button
                      key={name}
                      type="button"
                      className={
                        on
                          ? 'rounded border border-cyan/40 bg-cyan/15 px-2 py-1 text-xs text-cyan'
                          : 'rounded border border-line px-2 py-1 text-xs text-text-dim hover:border-cyan/40'
                      }
                      onClick={() => toggleRole(name)}
                    >
                      {name}
                    </button>
                  )
                })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setCreating(false)
                setEditTarget(null)
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void (creating ? create() : saveEdit())}
            >
              {busy
                ? t('adminPages.saving')
                : creating
                  ? t('common.create')
                  : t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(grantUser)}
        title={t('adminPages.grantsTitle')}
        subtitle={grantUser?.username}
        onClose={() => setGrantUser(null)}
      >
        <div className="space-y-3 p-5">
          <p className="text-xs text-text-dim">{t('adminPages.grantsHint')}</p>
          <ul className="space-y-1 text-sm">
            {(grantsQ.data || []).map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs">
                  {g.cluster_id}
                  {g.namespace ? ` / ${g.namespace}` : ' / *'}
                </span>
                <Button
                  variant="outline"
                  className="px-2 py-1 text-xs"
                  type="button"
                  onClick={() =>
                    void deleteAccessGrant(g.id).then(() => queryClient.invalidateQueries({ queryKey: ['access-grants'] }))
                  }
                >
                  {t('adminPages.grantRemove')}
                </Button>
              </li>
            ))}
          </ul>
          <label className="block space-y-1">
            <span className="hud-label">{t('adminPages.grantCluster')}</span>
            <select className="hud-field" value={grantCluster} onChange={(e) => setGrantCluster(e.target.value)}>
              <option value="">{t('environments.pickCluster')}</option>
              {(clustersQ.data || []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="hud-label">{t('adminPages.grantNamespace')}</span>
            <input className="hud-field" value={grantNs} onChange={(e) => setGrantNs(e.target.value)} />
          </label>
          <Button
            type="button"
            disabled={!grantUser || !grantCluster}
            onClick={() => {
              if (!grantUser || !grantCluster) return
              void createAccessGrant({
                user_id: grantUser.id,
                cluster_id: grantCluster,
                namespace: grantNs.trim(),
              }).then(() => {
                setGrantNs('')
                void queryClient.invalidateQueries({ queryKey: ['access-grants'] })
              })
            }}
          >
            {t('adminPages.addGrant')}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={t('adminPages.deleteUser')}
        confirmText={deleteTarget?.username}
        confirmLabel={t('adminPages.deleteUser')}
        cancelLabel={t('common.cancel')}
        busy={busy}
        description={t('adminPages.deleteUserDesc')}
        onClose={() => setDeleteTarget(null)}
        onConfirm={remove}
      />
    </ListPageFrame>
  )
}
