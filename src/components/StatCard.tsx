import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: string
  helper: string
  icon: LucideIcon
}

export default function StatCard({ label, value, helper, icon: Icon }: Props) {
  return (
    <article className="stat-card">
      <div className="stat-icon"><Icon size={20} /></div>
      <div>
        <div className="small-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-helper">{helper}</div>
      </div>
    </article>
  )
}
