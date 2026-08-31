import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  Plus,
  Save,
  UserRound,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
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
  referral_date: string
  referral_reason: string | null
  primary_condition: string | null
  affected_body_region: string | null
  initial_work_status: string | null
  current_work_status: string | null
  restrictions: string | null
  rehabilitation_goals: string | null
  planned_sessions: number | null
  sessions_completed: number
  expected_reassessment_date: string | null
  actual_reassessment_date: string | null
  case_status: string
  discharge_outcome: string | null
  discharge_summary: string | null
}

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  job_profile_id: string | null
}

type JobProfile = {
  id: string
  title: string
}

type RehabSession = {
  id: string
  session_date: string
  session_number: number | null
  pain_score: number | null
  subjective_report: string | null
  functional_progress: string | null
  next_plan: string | null
}

export default function RehabCase() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [rehabCase, setRehabCase] =
    useState<RehabCase | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [jobProfile, setJobProfile] =
    useState<JobProfile | null>(null)

  const [sessions, setSessions] =
    useState<RehabSession[]>([])

  const [caseStatus, setCaseStatus] =
    useState('active')

  const [workStatus, setWorkStatus] =
    useState('restricted_duty')

  const [
    expectedReassessmentDate,
    setExpectedReassessmentDate,
  ] = useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

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
        referral_date,
        referral_reason,
        primary_condition,
        affected_body_region,
        initial_work_status,
        current_work_status,
        restrictions,
        rehabilitation_goals,
        planned_sessions,
        sessions_completed,
        expected_reassessment_date,
        actual_reassessment_date,
        case_status,
        discharge_outcome,
        discharge_summary
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

    setCaseStatus(
      loadedCase.case_status
    )

    setWorkStatus(
      loadedCase.current_work_status ||
        loadedCase.initial_work_status ||
        'restricted_duty'
    )

    setExpectedReassessmentDate(
      loadedCase.expected_reassessment_date ||
        ''
    )

    const {
      data: workerData,
      error: workerError,
    } = await supabase
      .from('workers')
      .select(`
        id,
        employee_number,
        first_name,
        last_name,
        job_profile_id
      `)
      .eq(
        'id',
        loadedCase.worker_id
      )
      .single()

    if (workerError) {
      setError(workerError.message)
      setLoading(false)
      return
    }

    const loadedWorker =
      workerData as Worker

    setWorker(loadedWorker)

    if (
      loadedWorker.job_profile_id
    ) {
      const {
        data: jobData,
        error: jobError,
      } = await supabase
        .from('job_profiles')
        .select('id,title')
        .eq(
          'id',
          loadedWorker.job_profile_id
        )
        .single()

      if (!jobError && jobData) {
        setJobProfile(
          jobData as JobProfile
        )
      }
    }

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase
      .from('rehabilitation_sessions')
      .select(`
        id,
        session_date,
        session_number,
        pain_score,
        subjective_report,
        functional_progress,
        next_plan
      `)
      .eq(
        'rehabilitation_case_id',
        id
      )
      .order('session_date', {
        ascending: false,
      })

    if (sessionError) {
      setError(sessionError.message)
      setLoading(false)
      return
    }

    setSessions(
      (sessionData ??
        []) as RehabSession[]
    )

    setLoading(false)
  }

  const progressPercent =
    useMemo(() => {
      if (
        !rehabCase?.planned_sessions ||
        rehabCase.planned_sessions <= 0
      ) {
        return 0
      }

      return Math.min(
        100,
        Math.round(
          (
            rehabCase.sessions_completed /
            rehabCase.planned_sessions
          ) * 100
        )
      )
    }, [rehabCase])

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

  function formatDate(
    value:
      | string
      | null
      | undefined
  ) {
    if (!value) {
      return '—'
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      'en-ZA',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  async function saveCase() {
    if (!id) return

    setSaving(true)
    setError(null)

    const {
      error: updateError,
    } = await supabase
      .from('rehabilitation_cases')
      .update({
        case_status: caseStatus,
        current_work_status:
          workStatus,
        expected_reassessment_date:
          expectedReassessmentDate ||
          null,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      setError(
        updateError.message
      )
      setSaving(false)
      return
    }

    setSaving(false)
    await loadCase()
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading rehabilitation case...
        </p>
      </div>
    )
  }

  if (
    error &&
    !rehabCase
  ) {
    return (
      <div className="stack">
        <div className="error-message">
          {error}
        </div>
      </div>
    )
  }

  if (!rehabCase) {
    return null
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>
          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                '/rehabilitation'
              )
            }
            style={{
              marginBottom: 14,
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <span className="eyebrow">
            REHABILITATION CASE
          </span>

          <h1>
            {rehabCase.case_number ||
              `REH-${rehabCase.id
                .slice(0, 8)
                .toUpperCase()}`}
          </h1>

          <p>
            Functional rehabilitation
            and return-to-work case
            management.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={saveCase}
          disabled={saving}
        >
          <Save size={16} />

          {saving
            ? 'Saving...'
            : 'Save Case'}
        </button>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

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
            PROGRESS
          </span>

          <strong>
            {progressPercent}%
          </strong>
        </div>

        <div>
          <CalendarDays
            size={18}
          />

          <span>
            REASSESSMENT
          </span>

          <strong>
            {formatDate(
              rehabCase.expected_reassessment_date
            )}
          </strong>
        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <UserRound size={20} />
          </div>

          <div>
            <h2>
              Worker
            </h2>

            <p>
              Worker and occupational
              placement.
            </p>
          </div>

        </div>

        <div className="form-grid">

          <label>
            <span>
              Worker
            </span>

            <input
              value={
                worker
                  ? `${worker.first_name} ${worker.last_name}`
                  : 'Unavailable'
              }
              disabled
            />
          </label>

          <label>
            <span>
              Employee Number
            </span>

            <input
              value={
                worker?.employee_number ||
                ''
              }
              disabled
            />
          </label>

          <label>
            <span>
              Job Profile
            </span>

            <input
              value={
                jobProfile?.title ||
                'Not assigned'
              }
              disabled
            />
          </label>

          <label>
            <span>
              Referral Date
            </span>

            <input
              value={formatDate(
                rehabCase.referral_date
              )}
              disabled
            />
          </label>

        </div>

      </div>

      <div className="panel">

        <h2>
          Clinical Referral
        </h2>

        <div className="form-grid">

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

        </div>

        <label>
          <span>
            Referral Reason
          </span>

          <textarea
            rows={4}
            value={
              rehabCase.referral_reason ||
              ''
            }
            disabled
          />
        </label>

      </div>

      <div className="panel">

        <h2>
          Rehabilitation Plan
        </h2>

        <label>
          <span>
            Restrictions
          </span>

          <textarea
            rows={4}
            value={
              rehabCase.restrictions ||
              ''
            }
            disabled
          />
        </label>

        <label>
          <span>
            Rehabilitation Goals
          </span>

          <textarea
            rows={5}
            value={
              rehabCase.rehabilitation_goals ||
              ''
            }
            disabled
          />
        </label>

      </div>

      <div className="panel">

        <h2>
          Case Management
        </h2>

        <div className="form-grid">

          <label>
            <span>
              Current Work Status
            </span>

            <select
              value={workStatus}
              onChange={(event) =>
                setWorkStatus(
                  event.target.value
                )
              }
            >
              <option value="full_duty">
                Full Duty
              </option>

              <option value="modified_duty">
                Modified Duty
              </option>

              <option value="restricted_duty">
                Restricted Duty
              </option>

              <option value="off_work">
                Off Work
              </option>

              <option value="temporarily_unfit">
                Temporarily Unfit
              </option>
            </select>
          </label>

          <label>
            <span>
              Case Status
            </span>

            <select
              value={caseStatus}
              onChange={(event) =>
                setCaseStatus(
                  event.target.value
                )
              }
            >
              <option value="active">
                Active
              </option>

              <option value="on_hold">
                On Hold
              </option>

              <option value="ready_for_reassessment">
                Ready for Reassessment
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </label>

          <label>
            <span>
              Expected Reassessment
            </span>

            <input
              type="date"
              value={
                expectedReassessmentDate
              }
              onChange={(event) =>
                setExpectedReassessmentDate(
                  event.target.value
                )
              }
            />
          </label>

        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Rehabilitation Sessions
            </h2>

            <p>
              Treatment and functional
              progression history.
            </p>
          </div>

        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate(
              `/rehabilitation/${rehabCase.id}/sessions/new`
            )
          }
          style={{
            marginBottom: 20,
          }}
        >
          <Plus size={16} />
          Add Session
        </button>

        {sessions.length === 0 ? (
          <p>
            No rehabilitation sessions
            have been recorded yet.
          </p>
        ) : (
          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>
                    Session
                  </th>
                  <th>Date</th>
                  <th>Pain</th>
                  <th>
                    Subjective
                  </th>
                  <th>
                    Functional Progress
                  </th>
                  <th>
                    Next Plan
                  </th>
                </tr>
              </thead>

              <tbody>

                {sessions.map(
                  (session) => (
                    <tr
                      key={session.id}
                    >
                      <td>
                        {session.session_number ||
                          '—'}
                      </td>

                      <td>
                        {formatDate(
                          session.session_date
                        )}
                      </td>

                      <td>
                        {session.pain_score !==
                        null
                          ? `${session.pain_score}/10`
                          : '—'}
                      </td>

                      <td>
                        {session.subjective_report ||
                          '—'}
                      </td>

                      <td>
                        {session.functional_progress ||
                          '—'}
                      </td>

                      <td>
                        {session.next_plan ||
                          '—'}
                      </td>
                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  )
}
