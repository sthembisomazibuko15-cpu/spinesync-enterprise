import {
  Activity,
  ArrowLeft,
  ClipboardCheck,
  PlayCircle,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import { supabase } from '../lib/supabase'

type RehabCase = {
  id: string
  worker_id: string
  assessment_id: string | null
  case_number: string | null
  primary_condition: string | null
  affected_body_region: string | null
  current_work_status: string | null
  sessions_completed: number
  planned_sessions: number | null
  case_status: string
}

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
}

export default function RehabReassessment() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [rehabCase, setRehabCase] =
    useState<RehabCase | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadCase()
    }
  }, [id])

  async function loadCase() {
    if (!id) return

    setLoading(true)
    setError(null)

    const {
      data: caseData,
      error: caseError,
    } = await supabase
      .from('rehabilitation_cases')
      .select(`
        id,
        worker_id,
        assessment_id,
        case_number,
        primary_condition,
        affected_body_region,
        current_work_status,
        sessions_completed,
        planned_sessions,
        case_status
      `)
      .eq('id', id)
      .single()

    if (caseError || !caseData) {
      setError(
        caseError?.message ||
          'Rehabilitation case not found.'
      )

      setLoading(false)
      return
    }

    const loadedCase =
      caseData as RehabCase

    setRehabCase(loadedCase)

    const {
      data: workerData,
      error: workerError,
    } = await supabase
      .from('workers')
      .select(`
        id,
        employee_number,
        first_name,
        last_name
      `)
      .eq(
        'id',
        loadedCase.worker_id
      )
      .single()

    if (
      workerError ||
      !workerData
    ) {
      setError(
        workerError?.message ||
          'Worker not found.'
      )

      setLoading(false)
      return
    }

    setWorker(
      workerData as Worker
    )

    setLoading(false)
  }

  function startReassessment() {
    if (
      !rehabCase ||
      !worker
    ) {
      return
    }

    navigate(
      `/assessments/new?worker=${worker.id}&rehab=${rehabCase.id}&type=reassessment`
    )
  }

  function formatLabel(
    value:
      | string
      | null
      | undefined
  ) {
    if (!value) {
      return 'Not recorded'
    }

    return value
      .split('_')
      .join(' ')
      .replace(
        /\b\w/g,
        (letter: string) =>
          letter.toUpperCase()
      )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading reassessment...
        </p>
      </div>
    )
  }

  if (
    !rehabCase ||
    !worker
  ) {
    return (
      <div className="stack">

        <div className="error-message">
          {error ||
            'Unable to load rehabilitation case.'}
        </div>

      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>

          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                `/rehabilitation/${rehabCase.id}`
              )
            }
            style={{
              marginBottom: 14,
            }}
          >
            <ArrowLeft size={16} />
            Back to Case
          </button>

          <span className="eyebrow">
            RETURN-TO-WORK
          </span>

          <h1>
            Rehabilitation Reassessment
          </h1>

          <p>
            Review rehabilitation
            progress before starting a
            new Functional Capacity
            Evaluation.
          </p>

        </div>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="panel">

        <h2>
          Worker
        </h2>

        <div className="form-grid">

          <label>
            <span>
              Worker
            </span>

            <input
              value={`${worker.first_name} ${worker.last_name}`}
              disabled
            />
          </label>

          <label>
            <span>
              Employee Number
            </span>

            <input
              value={
                worker.employee_number
              }
              disabled
            />
          </label>

          <label>
            <span>
              Rehabilitation Case
            </span>

            <input
              value={
                rehabCase.case_number ||
                `REH-${rehabCase.id
                  .slice(0, 8)
                  .toUpperCase()}`
              }
              disabled
            />
          </label>

        </div>

      </div>

      <div className="fce-summary-row">

        <div>
          <Activity size={18} />

          <span>
            CASE STATUS
          </span>

          <strong>
            {formatLabel(
              rehabCase.case_status
            )}
          </strong>
        </div>

        <div>
          <ClipboardCheck
            size={18}
          />

          <span>
            SESSIONS
          </span>

          <strong>
            {
              rehabCase.sessions_completed
            }
            /
            {rehabCase.planned_sessions ??
              '—'}
          </strong>
        </div>

        <div>
          <Activity size={18} />

          <span>
            WORK STATUS
          </span>

          <strong>
            {formatLabel(
              rehabCase.current_work_status
            )}
          </strong>
        </div>

      </div>

      <div className="panel">

        <h2>
          Rehabilitation Context
        </h2>

        <div className="form-grid">

          <label>
            <span>
              Primary Condition
            </span>

            <input
              value={
                rehabCase.primary_condition ||
                'Not recorded'
              }
              disabled
            />
          </label>

          <label>
            <span>
              Body Region
            </span>

            <input
              value={formatLabel(
                rehabCase.affected_body_region
              )}
              disabled
            />
          </label>

        </div>

      </div>

      <div className="panel">

        <h2>
          Start Reassessment FCE
        </h2>

        <p>
          This starts a new FCE for the
          same worker. The previous FCE,
          rehabilitation sessions and
          goals remain available as the
          worker's rehabilitation
          history.
        </p>

        <p
          style={{
            marginTop: 12,
          }}
        >
          The reassessment findings
          should be interpreted by the
          assessor together with the
          worker's clinical presentation,
          job demands and rehabilitation
          progress.
        </p>

        <button
          className="primary-button"
          onClick={
            startReassessment
          }
          style={{
            marginTop: 20,
          }}
        >
          <PlayCircle size={17} />
          Start Reassessment FCE
        </button>

      </div>

    </div>
  )
}
