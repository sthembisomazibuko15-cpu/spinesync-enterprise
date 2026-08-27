import { Activity, ClipboardCheck, ShieldAlert, Users } from 'lucide-react'
import StatCard from '../components/StatCard'
import { recentAssessments } from '../data/mockData'

export default function Dashboard() {
  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Enterprise Dashboard</h2>
          <p>Current workforce MSK and functional capacity overview.</p>
        </div>
        <button className="primary-button">New assessment</button>
      </div>

      <div className="stats-grid">
        <StatCard label="Active workers" value="1,284" helper="+34 this month" icon={Users} />
        <StatCard label="Assessments due" value="47" helper="Next 30 days" icon={ClipboardCheck} />
        <StatCard label="Restricted duty" value="26" helper="2.0% of workforce" icon={ShieldAlert} />
        <StatCard label="In rehabilitation" value="39" helper="18 due for review" icon={Activity} />
      </div>

      <div className="panel-grid">
        <section className="panel">
          <div className="panel-header">
            <h3>Recent assessments</h3>
            <span>Latest activity</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Worker</th><th>Assessment</th><th>Score</th><th>Outcome</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recentAssessments.map((item) => (
                  <tr key={item.worker}>
                    <td>{item.worker}</td>
                    <td>{item.type}</td>
                    <td>{item.score}</td>
                    <td><span className={`badge ${item.outcome.toLowerCase()}`}>{item.outcome}</span></td>
                    <td>{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="panel">
          <div className="panel-header">
            <h3>Risk snapshot</h3>
            <span>Current month</span>
          </div>
          <div className="risk-list">
            <div><span>Low back</span><strong>31%</strong></div>
            <div><span>Shoulder</span><strong>22%</strong></div>
            <div><span>Knee</span><strong>19%</strong></div>
            <div><span>Neck</span><strong>14%</strong></div>
          </div>
        </aside>
      </div>
    </div>
  )
}
