import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Save,
  ShieldAlert,
  Stethoscope,
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

type Assessment = {
  id: string
  worker_id: string
  assessment_date: string
  assessment_status: string
  final_outcome: string | null
  restrictions: string | null
  recommendations: string | null
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

type FceResult = {
  id: string
  test_name: string
  test_category: string
  measured_value: number | null
  required_value: number | null
  unit: string | null
  result: string | null
  movement_quality: string | null
  assistance_required: string | null
  symptoms_reported: string | null
  assessor_rating: string | null
}

export default function FceOutcome() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [assessment, setAssessment] =
    useState<Assessment | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [jobProfile, setJobProfile] =
    useState<JobProfile | null>(null)

  const [results, setResults] =
    useState<FceResult[]>([])

  const [finalOutcome, setFinalOutcome] =
    useState('')

  const [restrictions, setRestrictions] =
    useState('')

  const [
    recommendations,
    setRecommendations,
  ] = useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadOutcome()
    }
  }, [id])

  async function loadOutcome() {
    if (!id) return

    setLoading(true)
    setError(null)

    const {
      data: assessmentData,
      error: assessmentError,
    } = await supabase
      .from('assessments')
      .select(`
        id,
        worker_id,
        assessment_date,
        assessment_status,
        final_outcome,
        restrictions,
        recommendations
      `)
      .eq('id', id)
      .single()

    if (
      assessmentError ||
      !assessmentData
    ) {
      setError(
        assessmentError?.message ||
          'Assessment not found.'
      )
      setLoading(false)
      return
    }

    const loadedAssessment =
      assessmentData as Assessment

    setAssessment(loadedAssessment)

    setFinalOutcome(
      loadedAssessment.final_outcome ||
        ''
    )

    setRestrictions(
      loadedAssessment.restrictions ||
        ''
    )

    setRecommendations(
      loadedAssessment.recommendations ||
        ''
    )

    const [
      workerResponse,
      resultResponse,
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
          loadedAssessment.worker_id
        )
        .single(),

      supabase
        .from('fce_results')
        .select(`
          id,
          test_name,
          test_category,
          measured_value,
          required_value,
          unit,
          result,
          movement_quality,
          assistance_required,
          symptoms_reported,
          assessor_rating
        `)
        .eq(
          'assessment_id',
          id
        ),
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

    if (
      loadedWorker.job_profile_id
    ) {
      const {
        data: jobData,
      } = await supabase
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

    if (resultResponse.error) {
      setError(
        resultResponse.error.message
      )
      setLoading(false)
      return
    }

    setResults(
      (resultResponse.data ??
        []) as FceResult[]
    )

    setLoading(false)
  }

  const analysis =
    useMemo(() => {
      const tested =
        results.filter(
          (item) =>
            item.result &&
            item.result !==
              'not_tested'
        )

      const passed =
        tested.filter(
          (item) =>
            item.result === 'pass'
        )

      const borderline =
        tested.filter(
          (item) =>
            item.result ===
            'borderline'
        )

      const failed =
        tested.filter(
          (item) =>
            item.result === 'fail'
        )

      const numericGaps =
        results.filter(
          (item) =>
            item.measured_value !==
              null &&
            item.required_value !==
              null &&
            item.required_value > 0 &&
            item.measured_value <
              item.required_value
        )

      const functionalConcerns =
        results.filter(
          (item) =>
            item.assessor_rating ===
              'borderline' ||
            item.assessor_rating ===
              'fail' ||
            item.movement_quality ===
              'poor' ||
            item.movement_quality ===
              'unable' ||
            (
              item.assistance_required &&
              item.assistance_required !==
                'none'
            ) ||
            Boolean(
              item.symptoms_reported?.trim()
            )
        )

      let suggestedOutcome =
        'reassessment_required'

      if (tested.length === 0) {
        suggestedOutcome =
          'reassessment_required'
      } else if (
        failed.length === 0 &&
        borderline.length === 0
      ) {
        suggestedOutcome = 'fit'
      } else if (
        failed.length === 0 &&
        borderline.length > 0
      ) {
        suggestedOutcome =
          'fit_with_restrictions'
      } else if (
        failed.length <= 2
      ) {
        suggestedOutcome =
          'rehabilitation'
      } else {
        suggestedOutcome =
          'temporarily_unfit'
      }

      return {
        tested,
        passed,
        borderline,
        failed,
        numericGaps,
        functionalConcerns,
        suggestedOutcome,
      }
    }, [results])

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

  async function completeAssessment() {
    if (
      !id ||
      !assessment ||
      !worker
    ) {
      return
    }

    if (!finalOutcome) {
      setError(
        'Please select a final outcome.'
      )
      return
    }

    setSaving(true)
    setError(null)

    const {
      error: assessmentError,
    } = await supabase
      .from('assessments')
      .update({
        final_outcome:
          finalOutcome,

        restrictions:
          restrictions.trim() ||
          null,

        recommendations:
          recommendations.trim() ||
          null,

        assessment_status:
          'completed',

        updated_at:
          new Date().toISOString(),
      })
      .eq('id', id)

    if (assessmentError) {
      setError(
        assessmentError.message
      )
      setSaving(false)
      return
    }

    const {
      error: workerError,
    } = await supabase
      .from('workers')
      .update({
        fitness_status:
          finalOutcome,
      })
      .eq(
        'id',
        worker.id
      )

    if (workerError) {
      setError(
        workerError.message
      )
      setSaving(false)
      return
    }

    setSaving(false)

    navigate(
      `/assessments/${id}/record`
    )
  }

  function referToRehabilitation() {
    if (
      !assessment?.worker_id ||
      !assessment?.id
    ) {
      return
    }

    navigate(
      `/rehabilitation/new?worker=${assessment.worker_id}&assessment=${assessment.id}`
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading FCE outcome...
        </p>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="stack">
        <div className="error-message">
          {error ||
            'Assessment not found.'}
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
                `/assessments/${id}`
              )
            }
            style={{
              marginBottom: 14,
            }}
          >
            <ArrowLeft size={16} />
            Back to Testing
          </button>

          <span className="eyebrow">
            FCE OUTCOME
          </span>

          <h1>
            Functional Capacity Outcome
          </h1>

          <p>
            Review recorded functional
            findings and make the final
            professional determination.
          </p>
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

          <span>
            TESTED
          </span>

          <strong>
            {analysis.tested.length}
          </strong>
        </div>

        <div>
          <CheckCircle2 size={18} />

          <span>
            PASS
          </span>

          <strong>
            {analysis.passed.length}
          </strong>
        </div>

        <div>
          <ShieldAlert size={18} />

          <span>
            BORDERLINE
          </span>

          <strong>
            {analysis.borderline.length}
          </strong>
        </div>

        <div>
          <ShieldAlert size={18} />

          <span>
            FAILED
          </span>

          <strong>
            {analysis.failed.length}
          </strong>
        </div>

      </div>

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

        </div>

      </div>

      <div className="panel">

        <h2>
          Decision Support
        </h2>

        <p>
          Based on the recorded
          Pass, Borderline and Fail
          findings, the system suggests:
        </p>

        <div
          style={{
            marginTop: 15,
          }}
        >
          <strong>
            {formatLabel(
              analysis.suggestedOutcome
            )}
          </strong>
        </div>

        <p
          style={{
            marginTop: 15,
          }}
        >
          This suggestion is decision
          support only. It is not an
          automated medical or fitness
          certification. The assessor
          remains responsible for the
          final professional decision.
        </p>

      </div>

      {analysis.numericGaps.length >
        0 && (
        <div className="panel">

          <h2>
            Capacity Gaps
          </h2>

          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>Test</th>
                  <th>Measured</th>
                  <th>Required</th>
                </tr>
              </thead>

              <tbody>
                {analysis.numericGaps.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        {item.test_name}
                      </td>

                      <td>
                        {item.measured_value ??
                          '—'}{' '}
                        {item.unit || ''}
                      </td>

                      <td>
                        {item.required_value ??
                          '—'}{' '}
                        {item.unit || ''}
                      </td>
                    </tr>
                  )
                )}
              </tbody>

            </table>

          </div>

        </div>
      )}

      {analysis.functionalConcerns.length >
        0 && (
        <div className="panel">

          <h2>
            Functional Concerns
          </h2>

          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>Task</th>
                  <th>Rating</th>
                  <th>
                    Movement Quality
                  </th>
                  <th>
                    Assistance
                  </th>
                </tr>
              </thead>

              <tbody>
                {analysis.functionalConcerns.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        {item.test_name}
                      </td>

                      <td>
                        {formatLabel(
                          item.assessor_rating ||
                            item.result
                        )}
                      </td>

                      <td>
                        {formatLabel(
                          item.movement_quality
                        )}
                      </td>

                      <td>
                        {formatLabel(
                          item.assistance_required
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>

            </table>

          </div>

        </div>
      )}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Stethoscope size={20} />
          </div>

          <div>
            <h2>
              Final Assessor Decision
            </h2>

            <p>
              Record the final functional
              outcome and recommendations.
            </p>
          </div>

        </div>

        <label>
          <span>
            Final Outcome *
          </span>

          <select
            value={finalOutcome}
            onChange={(event) =>
              setFinalOutcome(
                event.target.value
              )
            }
          >
            <option value="">
              Select outcome
            </option>

            <option value="fit">
              Fit
            </option>

            <option value="fit_with_restrictions">
              Fit With Restrictions
            </option>

            <option value="temporarily_unfit">
              Temporarily Unfit
            </option>

            <option value="rehabilitation">
              Rehabilitation
            </option>

            <option value="reassessment_required">
              Reassessment Required
            </option>
          </select>
        </label>

        <label>
          <span>
            Restrictions
          </span>

          <textarea
            rows={4}
            value={restrictions}
            onChange={(event) =>
              setRestrictions(
                event.target.value
              )
            }
            placeholder="Record any functional or work restrictions"
          />
        </label>

        <label>
          <span>
            Recommendations
          </span>

          <textarea
            rows={5}
            value={recommendations}
            onChange={(event) =>
              setRecommendations(
                event.target.value
              )
            }
            placeholder="Record rehabilitation, reassessment or return-to-work recommendations"
          />
        </label>

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginTop: 20,
          }}
        >

          <button
            className="primary-button"
            onClick={completeAssessment}
            disabled={
              saving ||
              !finalOutcome
            }
          >
            <Save size={16} />

            {saving
              ? 'Saving...'
              : 'Complete Assessment'}
          </button>

          {finalOutcome ===
            'rehabilitation' && (
            <button
              type="button"
              className="secondary-button"
              onClick={
                referToRehabilitation
              }
            >
              <Activity size={16} />
              Refer to Rehabilitation
            </button>
          )}

        </div>

      </div>

    </div>
  )
}
