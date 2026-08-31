import {
  Activity,
  ArrowLeft,
  Save,
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
  case_number: string | null
  sessions_completed: number
  planned_sessions: number | null
  case_status: string
}

export default function NewRehabSession() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [rehabCase, setRehabCase] =
    useState<RehabCase | null>(null)

  const [sessionDate, setSessionDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    )

  const [painScore, setPainScore] =
    useState('')

  const [
    subjectiveReport,
    setSubjectiveReport,
  ] = useState('')

  const [
    objectiveFindings,
    setObjectiveFindings,
  ] = useState('')

  const [
    intervention,
    setIntervention,
  ] = useState('')

  const [
    exerciseProgression,
    setExerciseProgression,
  ] = useState('')

  const [
    functionalProgress,
    setFunctionalProgress,
  ] = useState('')

  const [
    workCapacityProgress,
    setWorkCapacityProgress,
  ] = useState('')

  const [
    restrictionsReview,
    setRestrictionsReview,
  ] = useState('')

  const [
    clinicalNotes,
    setClinicalNotes,
  ] = useState('')

  const [
    nextPlan,
    setNextPlan,
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
      data,
      error: caseError,
    } = await supabase
      .from('rehabilitation_cases')
      .select(`
        id,
        case_number,
        sessions_completed,
        planned_sessions,
        case_status
      `)
      .eq('id', id)
      .single()

    if (caseError || !data) {
      setError(
        caseError?.message ||
          'Rehabilitation case not found.'
      )

      setLoading(false)
      return
    }

    setRehabCase(
      data as RehabCase
    )

    setLoading(false)
  }

  async function saveSession() {
    if (!id || !rehabCase) {
      return
    }

    if (!sessionDate) {
      setError(
        'Please enter the session date.'
      )
      return
    }

    const numericPain =
      painScore === ''
        ? null
        : Number(painScore)

    if (
      numericPain !== null &&
      (
        numericPain < 0 ||
        numericPain > 10
      )
    ) {
      setError(
        'Pain score must be between 0 and 10.'
      )
      return
    }

    setSaving(true)
    setError(null)

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.getUser()

    if (
      authError ||
      !authData.user
    ) {
      setError(
        authError?.message ||
          'Unable to identify the signed-in user.'
      )

      setSaving(false)
      return
    }

    const nextSessionNumber =
      rehabCase.sessions_completed + 1

    const {
      error: insertError,
    } = await supabase
      .from('rehabilitation_sessions')
      .insert({
        rehabilitation_case_id: id,

        therapist_id:
          authData.user.id,

        session_date:
          sessionDate,

        session_number:
          nextSessionNumber,

        pain_score:
          numericPain,

        subjective_report:
          subjectiveReport.trim() ||
          null,

        objective_findings:
          objectiveFindings.trim() ||
          null,

        intervention:
          intervention.trim() ||
          null,

        exercise_progression:
          exerciseProgression.trim() ||
          null,

        functional_progress:
          functionalProgress.trim() ||
          null,

        work_capacity_progress:
          workCapacityProgress.trim() ||
          null,

        restrictions_review:
          restrictionsReview.trim() ||
          null,

        clinical_notes:
          clinicalNotes.trim() ||
          null,

        next_plan:
          nextPlan.trim() ||
          null,
      })

    if (insertError) {
      setError(
        insertError.message
      )

      setSaving(false)
      return
    }

    const {
      error: updateError,
    } = await supabase
      .from('rehabilitation_cases')
      .update({
        sessions_completed:
          nextSessionNumber,

        updated_at:
          new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      setError(
        `Session saved, but the case counter could not be updated: ${updateError.message}`
      )

      setSaving(false)
      return
    }

    navigate(
      `/rehabilitation/${id}`
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading session...
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
                `/rehabilitation/${id}`
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
            REHABILITATION SESSION
          </span>

          <h1>
            Session{' '}
            {rehabCase.sessions_completed +
              1}
          </h1>

          <p>
            {rehabCase.case_number ||
              'Rehabilitation Case'}
          </p>
        </div>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Session Information
            </h2>

            <p>
              Record the worker's
              rehabilitation session and
              functional response.
            </p>
          </div>

        </div>

        <div className="form-grid">

          <label>
            <span>
              Session Number
            </span>

            <input
              value={
                rehabCase.sessions_completed +
                1
              }
              disabled
            />
          </label>

          <label>
            <span>
              Session Date *
            </span>

            <input
              type="date"
              value={sessionDate}
              onChange={(event) =>
                setSessionDate(
                  event.target.value
                )
              }
            />
          </label>

          <label>
            <span>
              Pain Score /10
            </span>

            <input
              type="number"
              min="0"
              max="10"
              value={painScore}
              onChange={(event) =>
                setPainScore(
                  event.target.value
                )
              }
              placeholder="0 - 10"
            />
          </label>

        </div>

      </div>

      <div className="panel">

        <h2>
          Clinical Review
        </h2>

        <label>
          <span>
            Subjective Report
          </span>

          <textarea
            rows={4}
            value={subjectiveReport}
            onChange={(event) =>
              setSubjectiveReport(
                event.target.value
              )
            }
            placeholder="Worker-reported symptoms, pain, function and changes since the previous session"
          />
        </label>

        <label>
          <span>
            Objective Findings
          </span>

          <textarea
            rows={4}
            value={objectiveFindings}
            onChange={(event) =>
              setObjectiveFindings(
                event.target.value
              )
            }
            placeholder="ROM, strength, functional tests, movement quality and relevant clinical findings"
          />
        </label>

      </div>

      <div className="panel">

        <h2>
          Intervention
        </h2>

        <label>
          <span>
            Treatment / Intervention
          </span>

          <textarea
            rows={4}
            value={intervention}
            onChange={(event) =>
              setIntervention(
                event.target.value
              )
            }
            placeholder="Interventions completed during this session"
          />
        </label>

        <label>
          <span>
            Exercise Progression
          </span>

          <textarea
            rows={4}
            value={exerciseProgression}
            onChange={(event) =>
              setExerciseProgression(
                event.target.value
              )
            }
            placeholder="Exercises, sets, repetitions, resistance and progression"
          />
        </label>

      </div>

      <div className="panel">

        <h2>
          Functional Progress
        </h2>

        <label>
          <span>
            Functional Progress
          </span>

          <textarea
            rows={4}
            value={functionalProgress}
            onChange={(event) =>
              setFunctionalProgress(
                event.target.value
              )
            }
            placeholder="Changes in lifting, carrying, squatting, kneeling, walking, endurance or other functional tasks"
          />
        </label>

        <label>
          <span>
            Work-Capacity Progress
          </span>

          <textarea
            rows={4}
            value={workCapacityProgress}
            onChange={(event) =>
              setWorkCapacityProgress(
                event.target.value
              )
            }
            placeholder="Progress toward the physical demands of the worker's job"
          />
        </label>

        <label>
          <span>
            Restrictions Review
          </span>

          <textarea
            rows={3}
            value={restrictionsReview}
            onChange={(event) =>
              setRestrictionsReview(
                event.target.value
              )
            }
            placeholder="Are current restrictions still appropriate? Record any clinical recommendation for review."
          />
        </label>

      </div>

      <div className="panel">

        <h2>
          Clinical Notes & Plan
        </h2>

        <label>
          <span>
            Clinical Notes
          </span>

          <textarea
            rows={4}
            value={clinicalNotes}
            onChange={(event) =>
              setClinicalNotes(
                event.target.value
              )
            }
            placeholder="Additional clinical observations"
          />
        </label>

        <label>
          <span>
            Next Plan
          </span>

          <textarea
            rows={4}
            value={nextPlan}
            onChange={(event) =>
              setNextPlan(
                event.target.value
              )
            }
            placeholder="Plan for the next session, progression or reassessment"
          />
        </label>

      </div>

      <div className="panel">

        <p>
          Session documentation should
          reflect the worker's actual
          clinical and functional
          presentation. SpineSync stores
          the record but does not make
          independent clinical or
          return-to-work decisions.
        </p>

        <button
          className="primary-button"
          onClick={saveSession}
          disabled={saving}
          style={{
            marginTop: 18,
          }}
        >
          <Save size={16} />

          {saving
            ? 'Saving Session...'
            : 'Save Session'}
        </button>

      </div>

    </div>
  )
}
