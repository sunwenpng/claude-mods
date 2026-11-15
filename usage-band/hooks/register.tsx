import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Limit, Usage } from '../types'

const usage = atom({ plugin: 'usage-band', key: 'usage' } as const, null)
const isHidden = atom({ plugin: 'usage-band', key: 'isHidden' } as const, false)

const LABELS: Record<string, string> = {
  five_hour: '5小时',
  seven_day: '本周',
  spend_limit: '额度',
}

const toUsage = (rateLimits: Limit[], usd?: number): Usage => ({
  limits: rateLimits.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt })),
  usd,
})

const resetsIn = (iso: string | undefined, now: number): string => {
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.parse(iso) - now) / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d}天${h}小时后重置`
  if (h > 0) return `${h}小时${m}分后重置`
  return `${m}分后重置`
}

const bar = (pct: number): string => {
  const filled = Math.min(10, Math.round(pct / 10))
  return '█'.repeat(filled) + '░'.repeat(10 - filled)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'usage-band', description: '重新显示用量条' })
    const r = await next(e)
    const u = await $.session.usage()
    await update($, usage, () => toUsage(u.rateLimits, u.cost?.usd))
    return r
  })

  on('session.measure', async ($, e, next) => {
    await update($, usage, () => toUsage(e.rateLimits, e.cost?.usd))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const u = await read($, usage)
    if (e.props.hasSurvey || (await read($, isHidden))) return next(e)

    const { Box, Button, Text } = $.ui.resolve(e)
    const now = await $.clock.now()

    if (u === null || u.limits.length === 0) {
      return (
        <Box>
          <Text dimColor>用量：等第一次回复后读取…</Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        {u.limits.map(l => {
          const left = Math.max(0, 100 - l.percentUsed)
          const color = l.percentUsed >= 90 ? 'red' : l.percentUsed >= 70 ? 'yellow' : 'green'
          return (
            <Text key={l.kind}>
              <Text bold>{(LABELS[l.kind] ?? l.kind).padEnd(4, ' ')} </Text>
              <Text color={color}>{bar(l.percentUsed)}</Text>
              <Text> 已用 {l.percentUsed}% · 剩 {Math.round(left * 10) / 10}% </Text>
              <Text dimColor>{resetsIn(l.resetsAt, now)}</Text>
            </Text>
          )
        })}
        <Box>
          {u.usd !== undefined ? <Text dimColor>本会话折合 ${u.usd.toFixed(2)}  </Text> : null}
          <Button key="hide" label="隐藏" onPress={() => update($, isHidden, () => true)} />
        </Box>
      </Box>
    )
  })

  on('command.run', { command: 'usage-band' }, async ($, e) => {
    await update($, isHidden, () => false)
    return { text: '用量条已显示' }
  })
}
