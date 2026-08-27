const assessmentTypes = [
  ['Functional Capacity Evaluation', 'Full physical capacity test against job demands'],
  ['MSK Screening', 'Musculoskeletal risk and symptom screening'],
  ['Return-to-Work Review', 'Progress review for injured or recovering workers'],
  ['Work Hardening Review', 'Track functional progression during rehabilitation']
]

export default function Assessments() {
  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Assessments</h2>
          <p>Start, continue and review worker assessments.</p>
        </div>
      </div>

      <div className="card-grid">
        {assessmentTypes.map(([title, desc]) => (
          <article className="action-card" key={title}>
            <h3>{title}</h3>
            <p>{desc}</p>
            <button className="secondary-button">Start assessment</button>
          </article>
        ))}
      </div>
    </div>
  )
}
