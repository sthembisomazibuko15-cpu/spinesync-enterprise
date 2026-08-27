export default function Reports() {
  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Reports</h2>
          <p>Generate workforce, FCE, return-to-work and management reports.</p>
        </div>
      </div>

      <div className="card-grid">
        {['Individual FCE Report', 'Fitness-for-Work Report', 'Return-to-Work Report', 'Enterprise Risk Report'].map(name => (
          <article className="action-card" key={name}>
            <h3>{name}</h3>
            <p>Generate a structured SpineSync Enterprise report.</p>
            <button className="secondary-button">Open report</button>
          </article>
        ))}
      </div>
    </div>
  )
}
