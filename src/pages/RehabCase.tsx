import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  RefreshCw,
  Save,
  Target,
  Trash2,
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

type RehabGoal = {
  id: string
  goal_description: string
  baseline_value: number | null
  current_value: number | null
  target_value: number | null
  target_unit: string | null
  target_date: string | null
  goal_status: string
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

  const [goals, setGoals] =
    useState<RehabGoal[]>([])

  const [caseStatus, setCaseStatus] =
    useState('active')

  const [workStatus, setWorkStatus] =
    useState('restricted_duty')

  const [
    expectedReassessmentDate,
    setExpectedReassessmentDate,
  ] = useState('')

  const [showGoalForm, setShowGoalForm] =
    useState(false)

  const [
    goalDescription,
    setGoalDescription,
  ] = useState('')

  const [
    baselineValue,
    setBaselineValue,
  ] = useState('')

  const [
    targetValue,
    setTargetValue,
  ] = useState('')

  const [
    targetUnit,
    setTargetUnit,
  ] = useState('kg')

  const [
    targetDate,
    setTargetDate,
  ] = useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [savingGoal, setSavingGoal] =
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
    setCaseStatus(loadedCase.case_status)

    setWorkStatus(
      loadedCase.current_work_status ||
        loadedCase.initial_work_status ||
        'restricted_duty'
    )

    setExpectedReassessmentDate(
      loadedCase.expected_reassessment_date ||
        ''
    )

    const [
      workerResponse,
      sessionResponse,
      goalResponse,
    ] = await Promise.all([
      supabase
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
        .single(),

      supabase
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
        }),

      supabase
        .from('rehabilitation_goals')
        .select(`
          id,
          goal_description,
          baseline_value,
          current_value,
          target_value,
          target_unit,
          target_date,
          goal_status
        `)
        .eq(
          'rehabilitation_case_id',
          id
        )
        .order('created_at', {
          ascending: true,
        }),
    ])

    if (workerResponse.error) {
      setError(
        workerResponse.error.message
      )
      setLoading(false)
      return
    }

    const loadedWorker =
      workerResponse.data as Worker

    setWorker(loadedWorker)

    if (loadedWorker.job_profile_id) {
      const { data: jobData } =
        await supabase
          .from('job_profiles')
          .select('id,title')
          .eq(
            'id',
            loadedWorker.job_profile_id
          )
          .single()

      if (jobData) {
        setJobProfile(
          jobData as JobProfile
        )
      }
    }

    if (sessionResponse.error) {
      setError(
        sessionResponse.error.message
      )
      setLoading(false)
      return
    }

    if (goalResponse.error) {
      setError(
        goalResponse.error.message
      )
      setLoading(false)
      return
    }

    setSessions(
      (sessionResponse.data ??
        []) as RehabSession[]
    )

    setGoals(
      (goalResponse.data ??
        []) as RehabGoal[]
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

  const achievedGoals =
    useMemo(
      () =>
        goals.filter(
          (goal) =>
            goal.goal_status ===
            'achieved'
        ).length,
      [goals]
    )

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

  async function addGoal() {
    if (!id) return

    if (!goalDescription.trim()) {
      setError(
        'Please enter a goal description.'
      )
      return
    }

    setSavingGoal(true)
    setError(null)

    const {
      error: insertError,
    } = await supabase
      .from('rehabilitation_goals')
      .insert({
        rehabilitation_case_id: id,
        goal_description:
          goalDescription.trim(),

        baseline_value:
          baselineValue
            ? Number(baselineValue)
            : null,

        current_value:
          baselineValue
            ? Number(baselineValue)
            : null,

        target_value:
          targetValue
            ? Number(targetValue)
            : null,

        target_unit:
          targetUnit || null,

        target_date:
          targetDate || null,

        goal_status:
          'in_progress',
      })

    if (insertError) {
      setError(
        insertError.message
      )
      setSavingGoal(false)
      return
    }

    setGoalDescription('')
    setBaselineValue('')
    setTargetValue('')
    setTargetUnit('kg')
    setTargetDate('')
    setShowGoalForm(false)
    setSavingGoal(false)

    await loadCase()
  }

  async function updateGoal(
    goal: RehabGoal,
    current: string,
    status: string
  ) {
    const {
      error: updateError,
    } = await supabase
      .from('rehabilitation_goals')
      .update({
        current_value:
          current === ''
            ? null
            : Number(current),

        goal_status: status,

        updated_at:
          new Date().toISOString(),
      })
      .eq('id', goal.id)

    if (updateError) {
      setError(
        updateError.message
      )
      return
    }

    await loadCase()
  }

  async function deleteGoal(
    goalId: string
  ) {
    const confirmed =
      window.confirm(
        'Delete this rehabilitation goal?'
      )

    if (!confirmed) {
      return
    }

    const {
      error: deleteError,
    } = await supabase
      .from('rehabilitation_goals')
      .delete()
      .eq('id', goalId)

    if (deleteError) {
      setError(
        deleteError.message
      )
      return
    }

    await loadCase()
  }

  function startReassessment() {
    if (!rehabCase) {
      return
    }

    navigate(
      `/rehabilitation/${rehabCase.id}/reassessment`
    )
  }

  function viewComparison() {
    if (!rehabCase) {
      return
    }

    navigate(
      `/rehabilitation/${rehabCase.id}/comparison`
    )
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

  if (!rehabCase) {
    return (
      <div className="stack">
        <div className="error-message">
          {error ||
            'Rehabilitation case not found.'}
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

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <button
            className="secondary-button"
            onClick={viewComparison}
          >
            <BarChart3 size={16} />
            View FCE Comparison
          </button>

          <button
            className="secondary-button"
            onClick={
              startReassessment
            }
          >
            <RefreshCw size={16} />
            Start Reassessment
          </button>

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

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="fce-summary-row">

        <div>
          <Activity size={18} />
          <span>CASE STATUS</span>
          <strong>
            {formatLabel(
              rehabCase.case_status
            )}
          </strong>
        </div>

        <div>
          <ClipboardCheck size={18} />
          <span>SESSIONS</span>
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
          <Target size={18} />
          <span>GOALS</span>
          <strong>
            {achievedGoals}/{goals.length}
          </strong>
        </div>

        <div>
          <CalendarDays size={18} />
          <span>REASSESSMENT</span>
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
            <h2>Worker</h2>
            <p>
              Worker and occupational
              placement.
            </p>
          </div>

        </div>

        <div className="form-grid">

          <label>
            <span>Worker</span>
            <input
              value={
                worker
                  ? `${worker.first_name} ${worker.last_name}`
                  : ''
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
            <span>Job Profile</span>
            <input
              value={
                jobProfile?.title ||
                'Not assigned'
              }
              disabled
            />
          </label>

          <label>
            <span>Referral Date</span>
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
            <span>Body Region</span>
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
          <span>Referral Reason</span>
          <textarea
            rows={4}
            value={
              rehabCase.referral_reason ||
              ''
            }
            disabled
          />
        </label>

        <label>
          <span>Restrictions</span>
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
            General Rehabilitation Goals
          </span>
          <textarea
            rows={4}
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
          Measurable Rehabilitation Goals
        </h2>

        <p>
          Track functional targets and
          progress toward occupational
          demands.
        </p>

        <button
          className="primary-button"
          onClick={() =>
            setShowGoalForm(
              !showGoalForm
            )
          }
          style={{
            marginTop: 15,
            marginBottom: 20,
          }}
        >
          <Plus size={16} />
          Add Goal
        </button>

        {showGoalForm && (
          <div
            style={{
              marginBottom: 25,
            }}
          >
            <label>
              <span>
                Goal Description *
              </span>

              <input
                value={
                  goalDescription
                }
                onChange={(event) =>
                  setGoalDescription(
                    event.target.value
                  )
                }
                placeholder="e.g. Lift 25 kg safely from floor to waist"
              />
            </label>

            <div className="form-grid">

              <label>
                <span>Baseline</span>
                <input
                  type="number"
                  value={
                    baselineValue
                  }
                  onChange={(event) =>
                    setBaselineValue(
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                <span>Target</span>
                <input
                  type="number"
                  value={
                    targetValue
                  }
                  onChange={(event) =>
                    setTargetValue(
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                <span>Unit</span>
                <select
                  value={
                    targetUnit
                  }
                  onChange={(event) =>
                    setTargetUnit(
                      event.target.value
                    )
                  }
                >
                  <option value="kg">
                    kg
                  </option>
                  <option value="repetitions">
                    repetitions
                  </option>
                  <option value="minutes">
                    minutes
                  </option>
                  <option value="seconds">
                    seconds
                  </option>
                  <option value="metres">
                    metres
                  </option>
                  <option value="degrees">
                    degrees
                  </option>
                  <option value="%">
                    %
                  </option>
                </select>
              </label>

              <label>
                <span>
                  Target Date
                </span>
                <input
                  type="date"
                  value={
                    targetDate
                  }
                  onChange={(event) =>
                    setTargetDate(
                      event.target.value
                    )
                  }
                />
              </label>

            </div>

            <button
              className="primary-button"
              onClick={addGoal}
              disabled={savingGoal}
            >
              <Save size={16} />

              {savingGoal
                ? 'Saving...'
                : 'Save Goal'}
            </button>

          </div>
        )}

        {goals.length === 0 ? (
          <p>
            No measurable goals have
            been added yet.
          </p>
        ) : (
          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>Goal</th>
                  <th>Baseline</th>
                  <th>Current</th>
                  <th>Target</th>
                  <th>Target Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {goals.map(
                  (goal) => (
                    <GoalRow
                      key={goal.id}
                      goal={goal}
                      formatDate={
                        formatDate
                      }
                      updateGoal={
                        updateGoal
                      }
                      deleteGoal={
                        deleteGoal
                      }
                    />
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      <div className="panel">

        <h2>Case Management</h2>

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
            <span>Case Status</span>

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

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            marginTop: 20,
          }}
        >
          {caseStatus ===
            'ready_for_reassessment' && (
            <button
              className="primary-button"
              onClick={
                startReassessment
              }
            >
              <RefreshCw size={16} />
              Start Reassessment FCE
            </button>
          )}

          <button
            className="secondary-button"
            onClick={viewComparison}
          >
            <BarChart3 size={16} />
            View FCE Comparison
          </button>
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
                  <th>Session</th>
                  <th>Date</th>
                  <th>Pain</th>
                  <th>
                    Functional Progress
                  </th>
                  <th>Next Plan</th>
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

      <div className="panel">

        <h2>
          Rehabilitation Progress
        </h2>

        <p>
          Session completion:{' '}
          <strong>
            {progressPercent}%
          </strong>
        </p>

        <p>
          Goals achieved:{' '}
          <strong>
            {achievedGoals} of{' '}
            {goals.length}
          </strong>
        </p>

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            marginTop: 20,
          }}
        >
          <button
            className="secondary-button"
            onClick={
              startReassessment
            }
          >
            <RefreshCw size={16} />
            Review for Reassessment
          </button>

          <button
            className="primary-button"
            onClick={viewComparison}
          >
            <BarChart3 size={16} />
            View FCE Comparison
          </button>
        </div>

      </div>

    </div>
  )
}

function GoalRow({
  goal,
  formatDate,
  updateGoal,
  deleteGoal,
}: {
  goal: RehabGoal

  formatDate: (
    value:
      | string
      | null
      | undefined
  ) => string

  updateGoal: (
    goal: RehabGoal,
    current: string,
    status: string
  ) => Promise<void>

  deleteGoal: (
    id: string
  ) => Promise<void>
}) {
  const [current, setCurrent] =
    useState(
      goal.current_value !== null
        ? String(goal.current_value)
        : ''
    )

  const [status, setStatus] =
    useState(goal.goal_status)

  return (
    <tr>

      <td>
        <strong>
          {goal.goal_description}
        </strong>
      </td>

      <td>
        {goal.baseline_value ??
          '—'}{' '}
        {goal.target_unit || ''}
      </td>

      <td>
        <input
          type="number"
          value={current}
          onChange={(event) =>
            setCurrent(
              event.target.value
            )
          }
          style={{
            width: 90,
          }}
        />
      </td>

      <td>
        {goal.target_value ??
          '—'}{' '}
        {goal.target_unit || ''}
      </td>

      <td>
        {formatDate(
          goal.target_date
        )}
      </td>

      <td>
        <select
          value={status}
          onChange={(event) =>
            setStatus(
              event.target.value
            )
          }
        >
          <option value="not_started">
            Not Started
          </option>

          <option value="in_progress">
            In Progress
          </option>

          <option value="achieved">
            Achieved
          </option>

          <option value="partially_achieved">
            Partially Achieved
          </option>

          <option value="not_achieved">
            Not Achieved
          </option>

          <option value="cancelled">
            Cancelled
          </option>
        </select>
      </td>

      <td>
        <div
          style={{
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            className="secondary-button"
            onClick={() =>
              updateGoal(
                goal,
                current,
                status
              )
            }
          >
            <CheckCircle2
              size={15}
            />
            Update
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              deleteGoal(goal.id)
            }
          >
            <Trash2 size={15} />
          </button>
        </div>
      </td>

    </tr>
  )
}
