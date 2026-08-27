import { Search, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { workers } from '../data/mockData'

export default function Workers() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return workers.filter(w =>
      [w.name, w.employeeNo, w.operation, w.department, w.jobTitle].some(v => v.toLowerCase().includes(q))
    )
  }, [query])

  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Workers</h2>
          <p>Manage employee records, roles and assessment status.</p>
        </div>
        <button className="primary-button"><UserPlus size={16}/> Add worker</button>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={17}/>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search workers..." />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Employee no.</th><th>Name</th><th>Operation</th><th>Department</th><th>Job</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(worker => (
                <tr key={worker.id}>
                  <td>{worker.employeeNo}</td>
                  <td><strong>{worker.name}</strong></td>
                  <td>{worker.operation}</td>
                  <td>{worker.department}</td>
                  <td>{worker.jobTitle}</td>
                  <td><span className={`badge ${worker.status.toLowerCase()}`}>{worker.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
