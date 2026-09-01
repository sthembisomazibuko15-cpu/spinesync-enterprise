import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  Save,
  ShieldAlert,
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
  discharge_recommendations: string | null
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

type ResultSummary = {
  pass: number
  borderline: number
  fail: number
  notTested: number
}

export default function RehabDischarge() {
  const { id } = useParams()

  const navigate = useNavigate()

  const [rehabCase, setRehabCase] =
    useState<RehabCase | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [originalAssessment, setOriginalAssessment] =
    useState<Assessment | null>(null)

  const [reassessment, setReassessment] =
    useState<Assessment | null>(null)

  const [results, setResults] =
    useState<FceResult[]>([])

  const [dischargeOutcome, setDischargeOutcome] =
    useState('')

  const [finalWorkStatus, setFinalWorkStatus] =
    useState('')

  const [dischargeSummary, setDischargeSummary] =
    useState('')

  const [finalRestrictions, setFinalRestrictions] =
    useState('')

  const [finalRecommendations, setFinalRecommendations] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [completing, setCompleting] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadPage()
  }, [id])

  async function loadPage() {
    if (!id) {
      setError(
        'Rehabilitation case ID is missing.'
      )
      setLoading(false)
      return
    }

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
        discharge_recommendations,
        actual_reassessment_date
      `)
      .eq('id', id)
      .single()

    if (caseError) {
      setError(caseError.message)
      setLoading(false)
      return
    }

    const loadedCase =
      caseData as RehabCase

    setRehabCase(loadedCase)

    const [
      workerResponse,
      reassessmentResponse,
    ] = await Promise.all([
      supabase
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
        .single(),

      supabase
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
          'rehabilitation_case_id',
          loadedCase.id
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
        ),
    ])

    if (workerResponse.error) {
      setError(
        workerResponse.error.message
      )
      setLoading(false)
      return
    }

    setWorker(
      workerResponse.data as Worker
    )

    if (
      reassessmentResponse.error
    ) {
      setError(
        reassessmentResponse.error.message
      )
      setLoading(false)
      return
    }

    let loadedOriginal:
      | Assessment
      | null = null

    if (
      loadedCase.assessment_id
    ) {
      const {
        data,
        error,
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

      if (!error && data) {
        loadedOriginal =
          data as Assessment
      }
    }

    setOriginalAssessment(
      loadedOriginal
    )

    const reassessments =
      (reassessmentResponse.data ??
        []) as Assessment[]

    const selectedReassessment =
      reassessments.find(
        (item) =>
          item.assessment_status ===
          'completed'
      ) ||
      reassessments[0] ||
      null

    setReassessment(
      selectedReassessment
    )

    let loadedResults:
      FceResult[] = []

    if (selectedReassessment) {
      const {
        data,
        error,
      } = await supabase
        .from('fce_results')
        .select(`
          id,
          result,
          assessor_rating
        `)
        .eq(
          'assessment_id',
          selectedReassessment.id
        )

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      loadedResults =
        (data ?? []) as FceResult[]
    }

    setResults(loadedResults)

    setDischargeOutcome(
      loadedCase.discharge_outcome ||
        ''
    )

    setFinalWorkStatus(
      loadedCase.current_work_status ||
        ''
    )

    setDischargeSummary(
      loadedCase.discharge_summary ||
        ''
    )

    setFinalRestrictions(
      loadedCase.restrictions ||
        selectedReassessment
          ?.restrictions ||
        ''
    )

    setFinalRecommendations(
      loadedCase
        .discharge_recommendations ||
        selectedReassessment
          ?.recommendations ||
        ''
    )

    if (
      !loadedCase.discharge_outcome &&
      selectedReassessment
        ?.final_outcome
    ) {
      applySuggestedDecision(
        selectedReassessment
          .final_outcome
      )
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
    useMemo<ResultSummary>(() => {
      const summary = {
        pass: 0,
        borderline: 0,
        fail: 0,
        notTested: 0,
      }

      results.forEach((item) => {
        const rating =
          item.assessor_rating ||
          item.result

        if (rating === 'pass') {
          summary.pass += 1
        } else if (
          rating === 'borderline'
        ) {
          summary.borderline += 1
        } else if (
          rating === 'fail'
        ) {
          summary.fail += 1
        } else {
          summary.notTested += 1
        }
      })

      return summary
    }, [results])

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
    if (!rehabCase) {
      return
    }

    if (!dischargeOutcome) {
      setError(
        'Select a final return-to-work decision.'
      )
      return
    }

    if (!finalWorkStatus) {
      setError(
        'Select the final work status.'
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
          dischargeSummary.trim() ||
          null,

        discharge_recommendations:
          finalRecommendations.trim() ||
          null,

        current_work_status:
          finalWorkStatus,

        restrictions:
          finalRestrictions.trim() ||
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
        'A post-rehabilitation FCE is required before completing discharge.'
      )
      return
    }

    if (
      reassessment.assessment_status !==
      'completed'
    ) {
      setError(
        'The post-rehabilitation FCE must be completed before final discharge.'
      )
      return
    }

    if (!dischargeOutcome) {
      setError(
        'Select a final return-to-work decision.'
      )
      return
    }

    if (!finalWorkStatus) {
      setError(
        'Select the final work status.'
      )
      return
    }

    if (
      dischargeOutcome ===
      'continue_rehabilitation'
    ) {
      setError(
        'A case marked Continue Rehabilitation should remain open.'
      )
      return
    }

    const confirmed =
      window.confirm(
        'Complete this rehabilitation case and apply the final return-to-work decision?'
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
      error: caseUpdateError,
    } = await supabase
      .from('rehabilitation_cases')
      .update({
        discharge_outcome:
          dischargeOutcome,

        discharge_summary:
          dischargeSummary.trim() ||
          null,

        discharge_recommendations:
          finalRecommendations.trim() ||
          null,

        current_work_status:
          finalWorkStatus,

        restrictions:
          finalRestrictions.trim() ||
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

    if (caseUpdateError) {
      setError(
        caseUpdateError.message
      )
      setCompleting(false)
      return
    }

    const fitnessStatus =
      workerFitnessStatus()

    if (fitnessStatus) {
      const {
        error: workerUpdateError,
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

      if (workerUpdateError) {
        setError(
          `The rehabilitation case was completed, but the worker fitness status could not be updated: ${workerUpdateError.message}`
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

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading final RTW
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
            'Rehabilitation case could not be loaded.'}
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate(
              '/rehabilitation'
            )
          }
        >
          <ArrowLeft size={16} />
          Back to Rehabilitation
        </button>

      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>
          <span className="eyebrow">
            REHABILITATION &
            RETURN-TO-WORK
          </span>

          <h1>
            Final RTW Decision
          </h1>

          <p>
            Record the clinician's
            final rehabilitation,
            functional-capacity and
            return-to-work decision.
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
            onClick={() =>
              navigate(
                `/rehabilitation/${rehabCase.id}`
              )
            }
          >
            <ArrowLeft size={16} />
            Back to Case
          </button>

          <button
            className="secondary-button"
            onClick={loadPage}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
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
              Rehabilitation case and
              worker identification.
            </p>
          </div>

        </div>

        <div className="form-grid">

          <label>
            <span>Worker</span>

            <input
              value={
                `${worker.first_name} ${worker.last_name}`
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
              Condition
            </span>

            <input
              value={
                rehabCase.primary_condition ||
                ''
              }
              disabled
            />
          </label>

          <label>
            <span>
              Body Region
            </span>

            <input
              value={
                rehabCase.affected_body_region ||
                ''
              }
              disabled
            />
          </label>

        </div>

      </div>

      <div className="fce-summary-row">

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
            {
              rehabCase.planned_sessions ||
              '—'
            }
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
          <ShieldAlert size={18} />

          <span>
            BORDERLINE
          </span>

          <strong>
            {
              resultSummary.borderline
            }
          </strong>
        </div>

        <div>
          <ShieldAlert size={18} />

          <span>
            FAILED
          </span>

          <strong>
            {resultSummary.fail}
          </strong>
        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <ClipboardCheck
              size={20}
            />
          </div>

          <div>
            <h2>
              Functional Reassessment
            </h2>

            <p>
              Initial and
              post-rehabilitation FCE
              information.
            </p>
          </div>

        </div>

        <div className="form-grid">

          <label>
            <span>
              Initial FCE Date
            </span>

            <input
              value={formatDate(
                originalAssessment
                  ?.assessment_date
              )}
              disabled
            />
          </label>

          <label>
            <span>
              Initial Outcome
            </span>

            <input
              value={formatLabel(
                originalAssessment
                  ?.final_outcome
              )}
              disabled
            />
          </label>

          <label>
            <span>
              Reassessment Date
            </span>

            <input
              value={formatDate(
                reassessment
                  ?.assessment_date
              )}
              disabled
            />
          </label>

          <label>
            <span>
              Reassessment Status
            </span>

            <input
              value={formatLabel(
                reassessment
                  ?.assessment_status
              )}
              disabled
            />
          </label>

          <label>
            <span>
              Reassessment Outcome
            </span>

            <input
              value={formatLabel(
                reassessment
                  ?.final_outcome
              )}
              disabled
            />
          </label>

          <label>
            <span>
              Reassessment Pain
            </span>

            <input
              value={
                reassessment
                  ?.pain_score ??
                '—'
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
                ? 'View Reassessment'
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
          Record the final professional
          decision after reviewing the
          rehabilitation programme,
          functional reassessment and
          occupational demands.
        </p>

        <div
          className="form-grid"
          style={{
            marginTop: 20,
          }}
        >

          <label>
            <span>
              RTW Decision
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
              Final Work Status
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

        <label
          style={{
            display: 'block',
            marginTop: 20,
          }}
        >
          <span>
            Final Restrictions
          </span>

          <textarea
            value={
              finalRestrictions
            }
            onChange={(event) =>
              setFinalRestrictions(
                event.target.value
              )
            }
            rows={4}
            placeholder="Record any occupational or functional restrictions..."
          />
        </label>

        <label
          style={{
            display: 'block',
            marginTop: 20,
          }}
        >
          <span>
            Recommendations
          </span>

          <textarea
            value={
              finalRecommendations
            }
            onChange={(event) =>
              setFinalRecommendations(
                event.target.value
              )
            }
            rows={4}
            placeholder="Record final rehabilitation, ergonomic, work-conditioning or RTW recommendations..."
          />
        </label>

        <label
          style={{
            display: 'block',
            marginTop: 20,
          }}
        >
          <span>
            Discharge Summary
          </span>

          <textarea
            value={
              dischargeSummary
            }
            onChange={(event) =>
              setDischargeSummary(
                event.target.value
              )
            }
            rows={5}
            placeholder="Summarise rehabilitation progress, reassessment findings and the basis for the final RTW decision..."
          />
        </label>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <ShieldAlert
              size={20}
            />
          </div>

          <div>
            <h2>
              Professional Decision
            </h2>

            <p>
              Clinical and occupational
              interpretation.
            </p>
          </div>

        </div>

        <p>
          SpineSync records functional
          capacity findings,
          rehabilitation progress and
          occupational-demand
          information to support
          professional decision-making.
          The final return-to-work and
          fitness decision remains the
          responsibility of the
          appropriately registered
          professional and should be
          interpreted together with the
          worker's clinical condition,
          job demands and applicable
          occupational-health
          requirements.
        </p>

      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent:
            'flex-end',
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
            completing
          }
        >
          <CheckCircle2
            size={16}
          />

          {completing
            ? 'Completing...'
            : 'Complete & Discharge'}
        </button>

      </div>

    </div>
  )
}
