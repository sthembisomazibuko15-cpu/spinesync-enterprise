export default function Settings() {
  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Settings</h2>
          <p>Configure organisation, users, operations and clinical rules.</p>
        </div>
      </div>

      <section className="panel form-panel">
        <label>
          Organisation name
          <input defaultValue="M&M Mining Health" />
        </label>
        <label>
          Default country
          <input defaultValue="South Africa" />
        </label>
        <label>
          Platform version
          <input defaultValue="SpineSync Enterprise v0.1" disabled />
        </label>
        <button className="primary-button">Save settings</button>
      </section>
    </div>
  )
}
