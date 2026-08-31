import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Save,
  ShieldCheck,
  TrendingDown,
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
  physical_demand_level: string | null
}

type Result = {
  id: string
  test_category: string
  test_name: string
  side: string | null
  measured_value: number | null
  required_value: number | null
  unit: string | null
  result: string | null
  repetitions: number | null
  duration_seconds: number | null
  movement_quality: string | null
  assistance_required: string | null
  symptoms_reported: string | null
  assessor_rating: string | null
  notes: string | null
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
    useState<Result[]>([])

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
    loadOutcome()
  }, [id])

  async function loadOutcome() {
    if (!id) {
      setError('Assessment not found.')
      setLoading(false)
      return
    }

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

    if (assessmentError) {
      setError(assessmentError.message)
      setLoading(false)
      return
    }

    const typedAssessment =
      assessmentData as Assessment

    setAssessment(typedAssessment)

    setFinalOutcome(
      typedAssessment.final_outcome || ''
    )

    setRestrictions(
      typedAssessment.restrictions || ''
    )

    setRecommendations(
      typedAssessment.recommendations || ''
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
        typedAssessment.worker_id
      )
      .single()

    if (workerError) {
      setError(workerError.message)
      setLoading(false)
      return
    }

    const typedWorker =
      workerData as Worker

    setWorker(typedWorker)

    if (typedWorker.job_profile_id) {
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('job_profiles')
        .select(`
          id,
          title,
          physical_demand_level
        `)
        .eq(
          'id',
          typedWorker.job_profile_id
        )
        .maybeSingle()

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      setJobProfile(
        profileData as JobProfile | null
      )
    }

    const {
      data: resultData,
      error: resultError,
    } = await supabase
      .from('fce_results')
      .select(`
        id,
        test_category,
        test_name,
        side,
        measured_value,
        required_value,
        unit,
        result,
        repetitions,
        duration_seconds,
        movement_quality,
        assistance_required,
        symptoms_reported,
        assessor_rating,
        notes
      `)
      .eq(
        'assessment_id',
        typedAssessment.id
      )
      .order('test_category')

    if (resultError) {
      setError(resultError.message)
      setLoading(false)
      return
    }

    setResults(
      (resultData ?? []) as Result[]
    )

    setLoading(false)
  }

  const analysis = useMemo(() => {
    const tested = results.filter(
      (item) =>
        item.result &&
        item.result !== 'not_tested'
    )

    const passed = tested.filter(
      (item) =>
        item.result === 'pass'
    )

    const borderline = tested.filter(
      (item) =>
        item.result === 'borderline'
    )

    const failed = tested.filter(
      (item) =>
        item.result === 'fail'
    )

    const numericGaps =
      results.filter(
        (item) =>
          item.measured_value !== null &&
          item.required_value !== null &&
          Number(
            item.required_value
          ) > 0 &&
          Number(
            item.measured_value
          ) <
            Number(
              item.required_value
            )
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

    return {
      tested,
      passed,
      borderline,
      failed,
      numericGaps,
      functionalConcerns,
    }
  }, [results])

  const suggestedOutcome =
    useMemo(() => {
      if (
        analysis.tested.length === 0
      ) {
        return 'reassessment_required'
      }

      if (
        analysis.failed.length === 0 &&
        analysis.borderline.length === 0
      ) {
        return 'fit'
      }

      if (
        analysis.failed.length === 0 &&
        analysis.borderline.length > 0
      ) {
        return 'fit_with_restrictions'
      }

      if (
        analysis.failed.length <= 2
      ) {
        return 'rehabilitation'
      }

      return 'temporarily_unfit'
    }, [analysis])

  function formatLabel(
    value: string | null | undefined
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

  function resultClass(
    value: string | null
  ) {
    if (value === 'pass') {
      return 'pass'
    }

    if (value === 'fail') {
      return 'fail'
    }

    if (value === 'borderline') {
      return 'borderline'
    }

    return 'not_tested'
  }

  function getPerformance(
    item: Result
  ) {
    if (
      item.measured_value !== null
    ) {
      return `${item.measured_value} ${
        item.unit || ''
      }`
    }

    const parts: string[] = []

    if (
      item.repetitions !== null
    ) {
      parts.push(
        `${item.repetitions} reps`
      )
    }

    if (
      item.duration_seconds !== null
    ) {
      parts.push(
        `${item.duration_seconds} sec`
      )
    }

    if (
      item.movement_quality
    ) {
      parts.push(
        `Movement: ${formatLabel(
          item.movement_quality
        )}`
      )
    }

    if (
      item.assistance_required
    ) {
      parts.push(
        `Assistance: ${formatLabel(
          item.assistance_required
        )}`
      )
    }

    return parts.length > 0
      ? parts.join(' • ')
      : 'No performance details'
  }

  async function completeAssessment() {
    if (
      !assessment ||
      !worker
    ) {
      return
    }

    if (!finalOutcome) {
      setError(
        'Please select the final assessor outcome.'
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
      .eq(
        'id',
        assessment.id
      )

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
      `/assessments/${assessment.id}/record`
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Analysing FCE results...
        </p>
      </div>
    )
  }

  if (
    error &&
    !assessment
  ) {
    return (
      <div className="stack">

        <div className="error-message">
          {error}
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate('/assessments')
          }
        >
          <ArrowLeft size={16} />
          Assessments
        </button>

      </div>
    )
  }

  if (
    !assessment ||
    !worker
  ) {
    return null
  }

  return (
    <div className="stack">

      {/* HEADER */}

      <div className="page-heading">

        <div>
          <span className="eyebrow">
            FCE DECISION SUPPORT
          </span>

          <h1>
            FCE Outcome
          </h1>

          <p>
            Review functional capacity
            findings before recording the
            final professional outcome.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate(
              `/assessments/${assessment.id}`
            )
          }
        >
          <ArrowLeft size={16} />
          Back to Testing
        </button>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* WORKER */}

      <div className="worker-summary-card">

        <div className="worker-avatar-large">
          <ClipboardCheck size={24} />
        </div>

        <div>
          <span>WORKER</span>

          <h3>
            {worker.first_name}{' '}
            {worker.last_name}
          </h3>

          <p>
            Employee number:{' '}
            {worker.employee_number}
          </p>
        </div>

      </div>

      {/* JOB */}

      <div className="panel">

        <span className="eyebrow">
          JOB DEMAND PROFILE
        </span>

        <h3>
          {jobProfile?.title ||
            'No job profile assigned'}
        </h3>

        <p>
          Physical demand level:{' '}
          <strong>
            {formatLabel(
              jobProfile
                ?.physical_demand_level
            )}
          </strong>
        </p>

      </div>

      {/* SUMMARY */}

      <div className="panel">

        <h2>
          Capacity Summary
        </h2>

        <div className="fce-summary-row">

          <div>
            <span>TESTED</span>

            <strong>
              {analysis.tested.length}
            </strong>
          </div>

          <div>
            <span>PASS</span>

            <strong>
              {analysis.passed.length}
            </strong>
          </div>

          <div>
            <span>
              BORDERLINE
            </span>

            <strong>
              {analysis.borderline.length}
            </strong>
          </div>

          <div>
            <span>FAIL</span>

            <strong>
              {analysis.failed.length}
            </strong>
          </div>

          <div>
            <span>
              JOB-DEMAND GAPS
            </span>

            <strong>
              {
                analysis.numericGaps
                  .length
              }
            </strong>
          </div>

        </div>

      </div>

      {/* TEST RESULTS */}

      <div className="panel">

        <h2>
          Functional Test Review
        </h2>

        <p>
          Review both measured capacity
          and assessor-rated functional
          performance.
        </p>

        <div className="fce-report-table-wrap">

          <table className="fce-report-table">

            <thead>
              <tr>
                <th>Test</th>
                <th>Performance</th>
                <th>Job Demand</th>
                <th>Result</th>
              </tr>
            </thead>

            <tbody>

              {results.map(
                (item) => (
                  <tr key={item.id}>

                    <td>
                      <strong>
                        {item.test_name}
                      </strong>

                      {item.side && (
                        <small>
                          {formatLabel(
                            item.side
                          )}
                        </small>
                      )}
                    </td>

                    <td>
                      {getPerformance(
                        item
                      )}

                      {item
                        .symptoms_reported && (
                        <small>
                          Symptoms:{' '}
                          {
                            item
                              .symptoms_reported
                          }
                        </small>
                      )}
                    </td>

                    <td>
                      {item.required_value !==
                      null
                        ? `${
                            item.required_value
                          } ${
                            item.unit ||
                            ''
                          }`
                        : 'Assessor-rated task'}
                    </td>

                    <td>
                      <span
                        className={`badge ${resultClass(
                          item.result
                        )}`}
                      >
                        {formatLabel(
                          item.result ||
                            'not_tested'
                        )}
                      </span>
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* CAPACITY GAPS */}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <TrendingDown
              size={20}
            />
          </div>

          <div>
            <h2>
              Job-Demand Capacity Gaps
            </h2>

            <p>
              Numeric tests where measured
              worker capacity was below the
              recorded job requirement.
            </p>
          </div>

        </div>

        {analysis.numericGaps
          .length === 0 ? (
          <div className="fce-no-gap">

            <CheckCircle2
              size={20}
            />

            <span>
              No numeric job-demand
              deficits identified.
            </span>

          </div>
        ) : (
          <div className="fce-gap-list">

            {analysis.numericGaps.map(
              (item) => {
                const gap =
                  Number(
                    item.required_value
                  ) -
                  Number(
                    item.measured_value
                  )

                return (
                  <div key={item.id}>

                    <strong>
                      {item.test_name}
                    </strong>

                    <span>
                      Worker:{' '}
                      {
                        item.measured_value
                      }{' '}
                      {item.unit || ''}
                    </span>

                    <span>
                      Required:{' '}
                      {
                        item.required_value
                      }{' '}
                      {item.unit || ''}
                    </span>

                    <span>
                      Gap:{' '}
                      {gap.toFixed(1)}{' '}
                      {item.unit || ''}
                    </span>

                  </div>
                )
              }
            )}

          </div>
        )}

      </div>

      {/* FUNCTIONAL CONCERNS */}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <AlertTriangle
              size={20}
            />
          </div>

          <div>
            <h2>
              Functional Concerns
            </h2>

            <p>
              Assessor-rated tasks with
              symptoms, reduced movement
              quality, assistance or an
              adverse rating.
            </p>
          </div>

        </div>

        {analysis.functionalConcerns
          .length === 0 ? (
          <div className="fce-no-gap">

            <CheckCircle2
              size={20}
            />

            <span>
              No functional concerns
              recorded.
            </span>

          </div>
        ) : (
          <div className="stack">

            {analysis.functionalConcerns.map(
              (item) => (
                <div
                  className="fce-full-row"
                  key={item.id}
                >

                  <span>
                    {item.test_name}
                  </span>

                  <strong>
                    {formatLabel(
                      item.assessor_rating ||
                        item.result
                    )}
                  </strong>

                  {item.movement_quality && (
                    <p>
                      Movement quality:{' '}
                      {formatLabel(
                        item.movement_quality
                      )}
                    </p>
                  )}

                  {item
                    .assistance_required && (
                    <p>
                      Assistance:{' '}
                      {formatLabel(
                        item
                          .assistance_required
                      )}
                    </p>
                  )}

                  {item
                    .symptoms_reported && (
                    <p>
                      Symptoms:{' '}
                      {
                        item
                          .symptoms_reported
                      }
                    </p>
                  )}

                  {item.notes && (
                    <p>
                      Notes:{' '}
                      {item.notes}
                    </p>
                  )}

                </div>
              )
            )}

          </div>
        )}

      </div>

      {/* DECISION SUPPORT */}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2>
              Decision Support
            </h2>

            <p>
              SpineSync has summarised the
              recorded test results. The
              assessor remains responsible
              for the final professional
              determination.
            </p>
          </div>

        </div>

        <div className="fce-decision-card">

          <div>
            <span>
              SYSTEM SUGGESTION
            </span>

            <h2>
              {formatLabel(
                suggestedOutcome
              )}
            </h2>
          </div>

          <ShieldCheck size={34} />

        </div>

        <p>
          This suggestion is based on the
          recorded Pass, Borderline and
          Fail results only. It is not an
          automated medical or fitness
          certification.
        </p>

      </div>

      {/* FINAL ASSESSOR DECISION */}

      <div className="panel stack">

        <h2>
          Final Assessor Decision
        </h2>

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
              Select final outcome
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
              Rehabilitation Required
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
            placeholder="Record temporary or permanent work restrictions where applicable"
          />
        </label>

        <label>
          <span>
            Recommendations
          </span>

          <textarea
            rows={4}
            value={recommendations}
            onChange={(event) =>
              setRecommendations(
                event.target.value
              )
            }
            placeholder="Rehabilitation, work modification, reassessment or occupational health recommendations"
          />
        </label>

        <button
          className="primary-button"
          onClick={
            completeAssessment
          }
          disabled={saving}
        >
          <Save size={16} />

          {saving
            ? 'Completing FCE...'
            : 'Complete FCE'}
        </button>

      </div>

    </div>
  )
}
