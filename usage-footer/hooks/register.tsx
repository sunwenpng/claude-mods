import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Limit } from '../types'

const limits = atom({ plugin: 'usage-footer', key: 'limits' } as const, [])

const NAMES: Record<string, string> = { five_hour: '5小时', seven_day: '本周', spend_limit: '额度' }

const countdown = (iso: string | undefined, now: number): string => {
  if (!iso) return ''
  const mins = Math.max(0, Math.round((Date.parse(iso) - now) / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  return d > 0 ? `${d}天${h}时` : h > 0 ? `${h}时${m}分` : `${m}分`
}

const label = (ls: readonly Limit[], now: number): string => {
  if (ls.length === 0) return '用量 读取中…（发一条消息后显示）'
  const parts = ls.map(l => `${l.percentUsed >= 90 ? '⚠ ' : ''}${NAMES[l.kind] ?? l.kind} ${l.percentUsed}%`)
  const five = ls.find(l => l.kind === 'five_hour')
  const reset = five?.resetsAt ? ` · ${countdown(five.resetsAt, now)}后重置` : ''
  return `用量 ${parts.join(' · ')}${reset}`
}

// 把状态行刷新成最新的用量和倒计时
const paint = async ($: EngineInterface) => {
  $.ui.status(label(await read($, limits), await $.clock.now()))
}

const save = async ($: EngineInterface, rs: readonly Limit[]) => {
  await update($, limits, () => rs.map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt })))
  await paint($)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const r = await next(e)
    await save($, (await $.session.usage()).rateLimits)
    $.clock.every(60_000, () => paint($))
    return r
  })

  on('session.measure', async ($, e, next) => {
    await save($, e.rateLimits)
    return next(e)
  })
}
