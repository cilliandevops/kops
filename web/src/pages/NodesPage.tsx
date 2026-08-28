import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { listNodes } from '@/api/cluster'
import { useCluster } from '@/store/cluster'
import { AgeCell, CreatedCell } from '@/components/AgeCell'
import { HudTable, HudTablePanel, ListPageFrame } from '@/components/HudTableScroll'
import { Badge, EmptyState, PageHeader } from '@/components/ui'
import { metaCreated } from '@/api/resources'
import { shouldSkipEnterAnim } from '@/lib/motionPrefs'
import { useTranslation } from 'react-i18next'
import { NodeOpsControls } from '@/components/NodeOpsControls'
import { formatNodeTaints, nodeIsCordoned, nodeIsReady } from '@/lib/nodeStatus'
import { useAuth } from '@/store/auth'

export function NodesPage() {
  const { t } = useTranslation()
  const { canMutate } = useAuth()
  const { clusterId } = useCluster()
  const { data = [], isLoading } = useQuery({
    queryKey: ['nodes', clusterId],
    queryFn: listNodes,
    enabled: Boolean(clusterId),
  })

  return (
    <ListPageFrame>
      <PageHeader title={t('nodes.title')} subtitle={t('nodes.subtitle')} />
      <HudTablePanel pinFirst wide>
          <HudTable pinFirst wide>
            <thead>
              <tr>
                <th>{t('common.name')}</th>
                <th>{t('common.status')}</th>
                <th>Roles</th>
                <th>Taints</th>
                <th>Version</th>
                <th>{t('common.age')}</th>
                <th>{t('common.created')}</th>
                {canMutate('nodes') ? <th>{t('common.actions')}</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.map((node: any, index: number) => {
                const name = node.metadata?.name
                const roles = Object.keys(node.metadata?.labels || {})
                  .filter((k) => k.startsWith('node-role.kubernetes.io/'))
                  .map((k) => k.replace('node-role.kubernetes.io/', ''))
                return (
                  <motion.tr
                    key={name}
                    initial={shouldSkipEnterAnim() ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: shouldSkipEnterAnim() ? 0 : index * 0.03 }}
                  >
                    <td>
                      <Link className="font-semibold text-cyan hover:underline" to={`/nodes/${name}`}>
                        {name}
                      </Link>
                    </td>
                    <td>
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge tone={nodeIsReady(node) ? 'ok' : 'danger'}>
                          {nodeIsReady(node) ? 'Ready' : 'NotReady'}
                        </Badge>
                        {nodeIsCordoned(node) ? (
                          <Badge tone="warn">{t('nodeOps.schedulingDisabled')}</Badge>
                        ) : null}
                      </div>
                    </td>
                    <td>{roles.length ? roles.join(', ') : 'worker'}</td>
                    <td>
                      {formatNodeTaints(node).length ? (
                        <span className="font-mono text-xs" title={formatNodeTaints(node).join('\n')}>
                          {formatNodeTaints(node).length}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="font-mono text-xs">
                      {node.status?.nodeInfo?.kubeletVersion || '-'}
                    </td>
                    <td>
                      <AgeCell value={metaCreated(node)} />
                    </td>
                    <td>
                      <CreatedCell value={metaCreated(node)} />
                    </td>
                    {canMutate('nodes') ? (
                      <td>
                        <NodeOpsControls node={node} compact />
                      </td>
                    ) : null}
                  </motion.tr>
                )
              })}
              {!isLoading && !data.length ? (
                <tr>
                  <td colSpan={canMutate('nodes') ? 8 : 7}>
                    <EmptyState>No nodes found for this cluster.</EmptyState>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </HudTable>
      </HudTablePanel>
    </ListPageFrame>
  )
}
