const jobs = [
  { title: 'Rock Drill Operator', exposure: 'Very High', lifting: '35 kg', posture: 'Frequent flexion' },
  { title: 'Underground Fitter', exposure: 'High', lifting: '30 kg', posture: 'Kneeling / overhead' },
  { title: 'Haul Truck Operator', exposure: 'Moderate', lifting: '10 kg', posture: 'Prolonged sitting' },
  { title: 'Plant Operator', exposure: 'Moderate', lifting: '20 kg', posture: 'Standing / walking' }
]

export default function JobProfiles() {
  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Job Profiles</h2>
          <p>Define physical demands for each mining occupation.</p>
        </div>
        <button className="primary-button">Create job profile</button>
      </div>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Job</th><th>MSK exposure</th><th>Required lifting</th><th>Primary posture</th></tr></thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.title}>
                  <td><strong>{job.title}</strong></td>
                  <td>{job.exposure}</td>
                  <td>{job.lifting}</td>
                  <td>{job.posture}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
