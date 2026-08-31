import {
  Activity,
  Plus,
} from 'lucide-react'

export default function Rehabilitation() {
  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            RETURN-TO-WORK
          </span>

          <h1>
            Rehabilitation
          </h1>

          <p>
            Manage rehabilitation cases,
            functional recovery and
            return-to-work progression.
          </p>
        </div>

        <button
          className="primary-button"
          disabled
        >
          <Plus size={16} />
          New Rehab Case
        </button>
      </div>

      <div className="panel">
        <div className="assessment-section-title">
          <div className="assessment-section-icon">
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Rehabilitation Cases
            </h2>

            <p>
              Case management will be
              connected in the next step.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
