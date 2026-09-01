import {
  ArrowLeft,
  BriefcaseMedical,
  CheckCircle2,
  ClipboardCheck,
  Save,
  ShieldCheck,
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
  primary_condition: string | null
  affected_body_region: string | null
  current_work_status: string | null
  restrictions: string | null
  sessions_completed: number
  planned_sessions: number | null
  case_status: string
  discharge_outcome: string | null
  discharge_summary: string | null
  actual_reassessment_date: string | null
}

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  fitness_status: string | null
}

type Assessment = {
  id: string
  assessment_date: string
  assessment_status: string
  final_outcome: string | null
  restrictions: string | null
  recommendations: string | null
  pain_score: number | null
}

type FceResult = {
  id: string
  result: string | null
  assessor_rating: string | null
}

export default function RehabDischarge() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [rehabCase, setRehabCase] =
    useState<RehabCase | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [
    initialAssessment,
    setInitialAssessment,
  ] = useState<Assessment | null>(null)

  const [
    reassessment,
    setReassessment,
  ] = useState<Assessment | null>(null)

  const [
    reassessmentResults,
    setReassessmentResults,
  ] = useState<FceResult[]>([])

  const [
    dischargeOutcome,
    setDischargeOutcome,
  ] = useState('')

  const [
    finalWorkStatus,
    setFinalWorkStatus,
  ] = useState('')

  const [
    dischargeSummary,
    setDischargeSummary,
  ] = useState('')

  const [
    finalRestrictions,
    setFinalRestrictions,
  ] = useState('')

  const [
    finalRecommendations,
    setFinalRecommendations,
  ] = useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [completing, setCompleting] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadPage()
    }
  }, [id])

  async function loadPage() {
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
        restrictions,
        sessions_completed,
        planned_sessions,
        case_status,
        discharge_outcome,
        discharge_summary,
        actual_reassessment_date
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

    setDischargeOutcome(
      loadedCase.discharge_outcome || ''
    )

    setFinalWorkStatus(
      loadedCase.current_work_status || ''
    )

    setDischargeSummary(
      loadedCase.discharge_summary || ''
    )

    setFinalRestrictions(
      loadedCase.restrictions || ''
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
        fitness_status
      `)
      .eq(
        'id',
        loadedCase.worker_id
      )
      .single()

    if (workerError || !workerData) {
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

    if (loadedCase.assessment_id) {
      const {
        data: initialData,
      } = await supabase
        .from('assessments')
        .select(`
          id,
          assessment_date,
          assessment_status,
          final_outcome,
          restrictions,
          recommendations,
          pain_score
        `)
        .eq(
          'id',
          loadedCase.assessment_id
        )
        .single()

      if (initialData) {
        setInitialAssessment(
          initialData as Assessment
        )
      }
    }

    const {
      data: reassessmentData,
      error: reassessmentError,
    } = await supabase
      .from('assessments')
      .select(`
        id,
        assessment_date,
        assessment_status,
        final_outcome,
        restrictions,
        recommendations,
        pain_score,
        created_at
      `)
      .eq(
        'rehabilitation_case_id',
        id
      )
      .eq(
        'assessment_phase',
        'reassessment'
      )
      .order(
        'assessment_date',
        {
          ascending: false,
        }
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )

    if (reassessmentError) {
      setError(
        reassessmentError.message
      )
      setLoading(false)
      return
    }

    if (
      reassessmentData &&
      reassessmentData.length > 0
    ) {
      const completed =
        reassessmentData.find(
          (item) =>
            item.assessment_status ===
            'completed'
        )

      const latest =
        (completed ||
          reassessmentData[0]) as Assessment

      setReassessment(latest)

      setFinalRestrictions(
        latest.restrictions ||
          loadedCase.restrictions ||
          ''
      )

      setFinalRecommendations(
        latest.recommendations || ''
      )

      const {
        data: resultData,
        error: resultError,
      } = await supabase
        .from('fce_results')
        .select(`
          id,
          result,
          assessor_rating
        `)
        .eq(
          'assessment_id',
          latest.id
        )

      if (resultError) {
        setError(
          resultError.message
        )
        setLoading(false)
        return
      }

      setReassessmentResults(
        (resultData ??
          []) as FceResult[]
      )

      if (
        !loadedCase.discharge_outcome &&
        latest.final_outcome
      ) {
        applySuggestedDecision(
          latest.final_outcome
        )
      }
    }

    setLoading(false)
  }

  function applySuggestedDecision(
    outcome: string
  ) {
    switch (outcome) {
      case 'fit':
        setDischargeOutcome(
          'return_to_full_duty'
        )
        setFinalWorkStatus(
          'full_duty'
        )
        break

      case 'fit_with_restrictions':
        setDischargeOutcome(
          'return_to_modified_duty'
        )
        setFinalWorkStatus(
          'modified_duty'
        )
        break

      case 'temporarily_unfit':
        setDischargeOutcome(
          'temporarily_unfit'
        )
        setFinalWorkStatus(
          'temporarily_unfit'
        )
        break

      case 'rehabilitation':
        setDischargeOutcome(
          'continue_rehabilitation'
        )
        setFinalWorkStatus(
          'restricted_duty'
        )
        break

      case 'reassessment_required':
        setDischargeOutcome(
          'further_review_required'
        )
        break
    }
  }

  const resultSummary =
    useMemo(() => {
      let pass = 0
      let borderline = 0
      let fail = 0
      let notTested = 0

      reassessmentResults.forEach(
        (item) => {
          const value =
            item.assessor_rating ||
            item.result

          if (value === 'pass') {
            pass += 1
          } else if (
            value === 'borderline'
          ) {
            borderline += 1
          } else if (
            value === 'fail'
          ) {
            fail += 1
          } else {
            notTested += 1
          }
        }
      )

      return {
        pass,
        borderline,
        fail,
        notTested,
      }
    }, [reassessmentResults])

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

  function workerFitnessStatus() {
    switch (dischargeOutcome) {
      case 'return_to_full_duty':
        return 'fit'

      case 'return_to_modified_duty':
        return 'fit_with_restrictions'

      case 'temporarily_unfit':
        return 'temporarily_unfit'

      case 'continue_rehabilitation':
        return 'rehabilitation'

      case 'further_review_required':
        return 'reassessment_required'

      default:
        return null
    }
  }

  async function saveDecision() {
    if (!rehabCase) return

    if (!dischargeOutcome) {
      setError(
        'Please select a return-to-work decision.'
      )
      return
    }

    if (!finalWorkStatus) {
      setError(
        'Please select the final work status.'
      )
      return
    }

    setSaving(true)
    setError(null)

    const {
      error: updateError,
    } = await supabase
      .from('rehabilitation_cases')
      .update({
        discharge_outcome:
          dischargeOutcome,

        discharge_summary:
          dischargeSummary ||
          null,

        current_work_status:
          finalWorkStatus,

        restrictions:
          finalRestrictions ||
          null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        rehabCase.id
      )

    if (updateError) {
      setError(
        updateError.message
      )
      setSaving(false)
      return
    }

    setSaving(false)

    await loadPage()
  }

  async function completeAndDischarge() {
    if (
      !rehabCase ||
      !worker
    ) {
      return
    }

    if (!reassessment) {
      setError(
        'A linked post-rehabilitation reassessment is required before discharge.'
      )
      return
    }

    if (
      reassessment.assessment_status !==
      'completed'
    ) {
      setError(
        'The post-rehabilitation FCE must be completed before the rehabilitation case can be discharged.'
      )
      return
    }

    if (!dischargeOutcome) {
      setError(
        'Please select the final return-to-work decision.'
      )
      return
    }

    if (!finalWorkStatus) {
      setError(
        'Please select the final work status.'
      )
      return
    }

    if (
      dischargeOutcome ===
      'continue_rehabilitation'
    ) {
      setError(
        'A case marked Continue Rehabilitation should remain active and should not be discharged.'
      )
      return
    }

    const confirmed =
      window.confirm(
        'Complete this rehabilitation case and record the final return-to-work decision?'
      )

    if (!confirmed) {
      return
    }

    setCompleting(true)
    setError(null)

    const today =
      new Date()
        .toISOString()
        .slice(0, 10)

    const {
      error: caseError,
    } = await supabase
      .from('rehabilitation_cases')
      .update({
        discharge_outcome:
          dischargeOutcome,

        discharge_summary:
          dischargeSummary ||
          null,

        current_work_status:
          finalWorkStatus,

        restrictions:
          finalRestrictions ||
          null,

        actual_reassessment_date:
          reassessment.assessment_date ||
          today,

        case_status:
          'completed',

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        rehabCase.id
      )

    if (caseError) {
      setError(
        caseError.message
      )
      setCompleting(false)
      return
    }

    const fitnessStatus =
      workerFitnessStatus()

    if (fitnessStatus) {
      const {
        error: workerError,
      } = await supabase
        .from('workers')
        .update({
          fitness_status:
            fitnessStatus,
        })
        .eq(
          'id',
          worker.id
        )

      if (workerError) {
        setError(
          `The rehabilitation case was completed, but the worker fitness status could not be updated: ${workerError.message}`
        )
        setCompleting(false)
        return
      }
    }

    setCompleting(false)

    navigate(
      `/rehabilitation/${rehabCase.id}`
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading return-to-work
          decision...
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
            Final RTW Decision
          </h1>

          <p>
            Record the clinician's final
            return-to-work decision and
            rehabilitation discharge
            outcome.
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
            <UserRound size={20} />
          </div>

          <div>
            <h2>
              Worker & Case
            </h2>

            <p>
              Rehabilitation case
              identification.
            </p>
          </div>

        </div>

        <div className="form-grid">

          <label>
            <span>Worker</span>

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
              Case Number
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

          <label>
            <span>
              Case Status
            </span>

            <input
              value={formatLabel(
                rehabCase.case_status
              )}
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

          <label>
            <span>
              Condition
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

      </div>

      <div className="fce-summary-row">

        <div>
          <ClipboardCheck size={18} />

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
          <CheckCircle2 size={18} />

          <span>
            POST-FCE PASS
          </span>

          <strong>
            {resultSummary.pass}
          </strong>
        </div>

        <div>
          <BriefcaseMedical size={18} />

          <span>
            BORDERLINE
          </span>

          <strong>
            {resultSummary.borderline}
          </strong>
        </div>

        <div>
          <ShieldCheck size={18} />

          <span>
            FAILED
          </span>

          <strong>
            {resultSummary.fail}
          </strong>
        </div>

      </div>

      <div className="panel">

        <h2>
          Functional Reassessment
        </h2>

        <div className="form-grid">

          <label>
            <span>
              Initial FCE Date
            </span>

            <input
              value={
                initialAssessment
                  ? formatDate(
                      initialAssessment.assessment_date
                    )
                  : 'Not available'
              }
              disabled
            />
          </label>

          <label>
            <span>
              Initial Outcome
            </span>

            <input
              value={
                initialAssessment
                  ? formatLabel(
                      initialAssessment.final_outcome
                    )
                  : 'Not available'
              }
              disabled
            />
          </label>

          <label>
            <span>
              Reassessment Date
            </span>

            <input
              value={
                reassessment
                  ? formatDate(
                      reassessment.assessment_date
                    )
                  : 'Not available'
              }
              disabled
            />
          </label>

          <label>
            <span>
              Reassessment Status
            </span>

            <input
              value={
                reassessment
                  ? formatLabel(
                      reassessment.assessment_status
                    )
                  : 'Not available'
              }
              disabled
            />
          </label>

          <label>
            <span>
              Reassessment Outcome
            </span>

            <input
              value={
                reassessment
                  ? formatLabel(
                      reassessment.final_outcome
                    )
                  : 'Not available'
              }
              disabled
            />
          </label>

          <label>
            <span>
              Reassessment Pain
            </span>

            <input
              value={
                reassessment?.pain_score !==
                null &&
                reassessment?.pain_score !==
                undefined
                  ? `${reassessment.pain_score}/10`
                  : 'Not recorded'
              }
              disabled
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
          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                `/rehabilitation/${rehabCase.id}/comparison`
              )
            }
          >
            View FCE Comparison
          </button>

          {reassessment && (
            <button
              className="secondary-button"
              onClick={() =>
                navigate(
                  reassessment.assessment_status ===
                    'completed'
                    ? `/assessments/${reassessment.id}/record`
                    : `/assessments/${reassessment.id}`
                )
              }
            >
              {reassessment.assessment_status ===
              'completed'
                ? 'View Reassessment Report'
                : 'Continue Reassessment'}
            </button>
          )}
        </div>

      </div>

      <div className="panel">

        <h2>
          Final Return-to-Work Decision
        </h2>

        <p>
          Select the clinician-determined
          occupational outcome after
          considering the reassessment,
          rehabilitation progress,
          restrictions and documented job
          demands.
        </p>

        <div className="form-grid">

          <label>
            <span>
              RTW Decision *
            </span>

            <select
              value={
                dischargeOutcome
              }
              onChange={(event) =>
                setDischargeOutcome(
                  event.target.value
                )
              }
            >
              <option value="">
                Select decision
              </option>

              <option value="return_to_full_duty">
                Return to Full Duty
              </option>

              <option value="return_to_modified_duty">
                Return to Modified Duty
              </option>

              <option value="temporarily_unfit">
                Temporarily Unfit
              </option>

              <option value="continue_rehabilitation">
                Continue Rehabilitation
              </option>

              <option value="further_review_required">
                Further Review Required
              </option>
            </select>
          </label>

          <label>
            <span>
              Final Work Status *
            </span>

            <select
              value={
                finalWorkStatus
              }
              onChange={(event) =>
                setFinalWorkStatus(
                  event.target.value
                )
              }
            >
              <option value="">
                Select work status
              </option>

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

        </div>

        <label>
          <span>
            Final Restrictions
          </span>

          <textarea
            rows={4}
            value={
              finalRestrictions
            }
            onChange={(event) =>
              setFinalRestrictions(
                event.target.value
              )
            }
            placeholder="Record any final occupational restrictions or limitations."
          />
        </label>

        <label>
          <span>
            Recommendations
          </span>

          <textarea
            rows={4}
            value={
              finalRecommendations
            }
            onChange={(event) =>
              setFinalRecommendations(
                event.target.value
              )
            }
            placeholder="Follow-up, ergonomic controls, work modification or surveillance recommendations."
          />
        </label>

        <label>
          <span>
            Discharge Summary
          </span>

          <textarea
            rows={6}
            value={
              dischargeSummary
            }
            onChange={(event) =>
              setDischargeSummary(
                event.target.value
              )
            }
            placeholder="Summarise rehabilitation progress, functional response, residual limitations and rationale for the final RTW decision."
          />
        </label>

      </div>

      <div className="panel">

        <h2>
          Professional Decision
        </h2>

        <p>
          SpineSync records and organises
          rehabilitation and functional
          capacity information. The final
          return-to-work decision remains
          the professional determination
          of the responsible clinician or
          assessor and should be made
          within their professional scope
          and the mine's occupational
          health process.
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
            onClick={saveDecision}
            disabled={
              saving ||
              completing
            }
          >
            <Save size={16} />

            {saving
              ? 'Saving...'
              : 'Save Decision'}
          </button>

          <button
            className="primary-button"
            onClick={
              completeAndDischarge
            }
            disabled={
              saving ||
              completing ||
              rehabCase.case_status ===
                'completed'
            }
          >
            <CheckCircle2
              size={16}
            />

            {completing
              ? 'Completing...'
              : rehabCase.case_status ===
                  'completed'
                ? 'Case Completed'
                : 'Complete & Discharge'}
          </button>
        </div>

      </div>

    </div>
  )
}
