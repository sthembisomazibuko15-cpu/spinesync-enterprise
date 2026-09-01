import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ClipboardCheck,
  Minus,
  ShieldCheck,
  TrendingUp,
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
  case_status: string
  current_work_status: string | null
  sessions_completed: number
  planned_sessions: number | null
}

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
}

type Assessment = {
  id: string
  assessment_date: string
  assessment_phase: string
  assessment_status: string
  final_outcome: string | null
  restrictions: string | null
  recommendations: string | null
  pain_score: number | null
}

type FceResult = {
  id: string
  assessment_id: string
  test_category: string
  test_name: string
  side: string | null
  measured_value: number | null
  required_value: number | null
  unit: string | null
  result: string | null
  movement_quality: string | null
  assistance_required: string | null
  symptoms_reported: string | null
  assessor_rating: string | null
}

type ComparisonRow = {
  key: string
  testName: string
  category: string
  side: string | null
  initial: FceResult | null
  reassessment: FceResult | null
}

type ChangeStatus =
  | 'improved'
  | 'unchanged'
  | 'declined'
  | 'not_comparable'

export default function RehabComparison() {
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
    initialResults,
    setInitialResults,
  ] = useState<FceResult[]>([])

  const [
    reassessmentResults,
    setReassessmentResults,
  ] = useState<FceResult[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadComparison()
    }
  }, [id])

  async function loadComparison() {
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
        case_status,
        current_work_status,
        sessions_completed,
        planned_sessions
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

    if (
      loadedCase.assessment_id
    ) {
      const {
        data: initialData,
        error: initialError,
      } = await supabase
        .from('assessments')
        .select(`
          id,
          assessment_date,
          assessment_phase,
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

      if (initialError) {
        setError(
          initialError.message
        )
        setLoading(false)
        return
      }

      if (initialData) {
        const initial =
          initialData as Assessment

        setInitialAssessment(
          initial
        )

        const {
          data: resultData,
          error: resultError,
        } = await supabase
          .from('fce_results')
          .select(`
            id,
            assessment_id,
            test_category,
            test_name,
            side,
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
            initial.id
          )

        if (resultError) {
          setError(
            resultError.message
          )
          setLoading(false)
          return
        }

        setInitialResults(
          (resultData ??
            []) as FceResult[]
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
        assessment_phase,
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

      const {
        data: resultData,
        error: resultError,
      } = await supabase
        .from('fce_results')
        .select(`
          id,
          assessment_id,
          test_category,
          test_name,
          side,
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
    }

    setLoading(false)
  }

  const comparisonRows =
    useMemo(() => {
      const map =
        new Map<
          string,
          ComparisonRow
        >()

      function makeKey(
        result: FceResult
      ) {
        return [
          result.test_category,
          result.test_name,
          result.side || '',
        ].join('|')
      }

      initialResults.forEach(
        (result) => {
          const key =
            makeKey(result)

          map.set(key, {
            key,
            testName:
              result.test_name,
            category:
              result.test_category,
            side: result.side,
            initial: result,
            reassessment: null,
          })
        }
      )

      reassessmentResults.forEach(
        (result) => {
          const key =
            makeKey(result)

          const existing =
            map.get(key)

          if (existing) {
            existing.reassessment =
              result
          } else {
            map.set(key, {
              key,
              testName:
                result.test_name,
              category:
                result.test_category,
              side: result.side,
              initial: null,
              reassessment:
                result,
            })
          }
        }
      )

      return Array.from(
        map.values()
      ).sort((a, b) =>
        a.testName.localeCompare(
          b.testName
        )
      )
    }, [
      initialResults,
      reassessmentResults,
    ])

  function ratingScore(
    value:
      | string
      | null
      | undefined
  ) {
    switch (value) {
      case 'pass':
        return 3

      case 'borderline':
        return 2

      case 'fail':
        return 1

      default:
        return null
    }
  }

  function getChange(
    row: ComparisonRow
  ): ChangeStatus {
    if (
      !row.initial ||
      !row.reassessment
    ) {
      return 'not_comparable'
    }

    const initialRating =
      ratingScore(
        row.initial.assessor_rating ||
          row.initial.result
      )

    const reassessmentRating =
      ratingScore(
        row.reassessment.assessor_rating ||
          row.reassessment.result
      )

    if (
      initialRating !== null &&
      reassessmentRating !== null
    ) {
      if (
        reassessmentRating >
        initialRating
      ) {
        return 'improved'
      }

      if (
        reassessmentRating <
        initialRating
      ) {
        return 'declined'
      }

      return 'unchanged'
    }

    return 'not_comparable'
  }

  const changeSummary =
    useMemo(() => {
      let improved = 0
      let unchanged = 0
      let declined = 0
      let notComparable = 0

      comparisonRows.forEach(
        (row) => {
          const change =
            getChange(row)

          if (
            change === 'improved'
          ) {
            improved += 1
          } else if (
            change === 'declined'
          ) {
            declined += 1
          } else if (
            change === 'unchanged'
          ) {
            unchanged += 1
          } else {
            notComparable += 1
          }
        }
      )

      return {
        improved,
        unchanged,
        declined,
        notComparable,
      }
    }, [comparisonRows])

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

  function formatResult(
    result:
      | FceResult
      | null
  ) {
    if (!result) {
      return '—'
    }

    if (
      result.measured_value !==
      null
    ) {
      return `${result.measured_value} ${
        result.unit || ''
      }`.trim()
    }

    return formatLabel(
      result.assessor_rating ||
        result.result
    )
  }

  function changeDisplay(
    change: ChangeStatus
  ) {
    if (
      change === 'improved'
    ) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <ArrowUp size={15} />
          Improved
        </span>
      )
    }

    if (
      change === 'declined'
    ) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <ArrowDown size={15} />
          Declined
        </span>
      )
    }

    if (
      change === 'unchanged'
    ) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Minus size={15} />
          Unchanged
        </span>
      )
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <ArrowRight size={15} />
        Not Comparable
      </span>
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Building FCE comparison...
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
            'Unable to load rehabilitation comparison.'}
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
            FCE Progress Comparison
          </h1>

          <p>
            Compare functional capacity
            before and after
            rehabilitation.
          </p>

        </div>

        {reassessment?.assessment_status ===
          'completed' && (
          <button
            className="primary-button"
            onClick={() =>
              navigate(
                `/rehabilitation/${rehabCase.id}/discharge`
              )
            }
          >
            <ShieldCheck size={16} />
            Final RTW Decision
          </button>
        )}

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="panel">

        <h2>
          Worker & Rehabilitation Case
        </h2>

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

      <div className="fce-summary-row">

        <div>
          <TrendingUp size={18} />

          <span>
            IMPROVED
          </span>

          <strong>
            {
              changeSummary.improved
            }
          </strong>
        </div>

        <div>
          <Minus size={18} />

          <span>
            UNCHANGED
          </span>

          <strong>
            {
              changeSummary.unchanged
            }
          </strong>
        </div>

        <div>
          <Activity size={18} />

          <span>
            DECLINED
          </span>

          <strong>
            {
              changeSummary.declined
            }
          </strong>
        </div>

        <div>
          <CheckCircle2 size={18} />

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

      </div>

      <div className="panel">

        <h2>
          Assessment Comparison
        </h2>

        <div className="form-grid">

          <label>
            <span>
              Pre-Rehabilitation FCE
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
              Post-Rehabilitation FCE
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

        </div>

      </div>

      {!initialAssessment ? (
        <div className="panel">

          <h2>
            Initial FCE Not Available
          </h2>

          <p>
            This rehabilitation case does
            not have an original FCE
            linked to it.
          </p>

        </div>
      ) : !reassessment ? (
        <div className="panel">

          <h2>
            Reassessment Required
          </h2>

          <p>
            No linked post-rehabilitation
            reassessment has been created
            yet.
          </p>

          <button
            className="primary-button"
            onClick={() =>
              navigate(
                `/rehabilitation/${rehabCase.id}/reassessment`
              )
            }
            style={{
              marginTop: 18,
            }}
          >
            <ClipboardCheck
              size={16}
            />
            Start Reassessment
          </button>

        </div>
      ) : (
        <>

          <div className="panel">

            <h2>
              Functional Capacity
              Comparison
            </h2>

            <p>
              Results below compare the
              original FCE with the latest
              linked rehabilitation
              reassessment.
            </p>

            {reassessment.assessment_status !==
              'completed' && (
              <div
                className="error-message"
                style={{
                  marginTop: 16,
                }}
              >
                The reassessment is still
                in progress. Comparison
                results are provisional
                until the FCE is completed.
              </div>
            )}

            {comparisonRows.length ===
            0 ? (
              <p
                style={{
                  marginTop: 20,
                }}
              >
                No comparable FCE test
                results are available.
              </p>
            ) : (
              <div
                className="fce-report-table-wrap"
                style={{
                  marginTop: 20,
                }}
              >

                <table className="fce-report-table">

                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>
                        Pre-Rehab
                      </th>
                      <th>
                        Post-Rehab
                      </th>
                      <th>
                        Change
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {comparisonRows.map(
                      (row) => {
                        const change =
                          getChange(row)

                        return (
                          <tr
                            key={
                              row.key
                            }
                          >
                            <td>
                              <strong>
                                {
                                  row.testName
                                }
                              </strong>

                              {row.side && (
                                <div>
                                  {formatLabel(
                                    row.side
                                  )}
                                </div>
                              )}
                            </td>

                            <td>
                              {formatResult(
                                row.initial
                              )}
                            </td>

                            <td>
                              {formatResult(
                                row.reassessment
                              )}
                            </td>

                            <td>
                              {changeDisplay(
                                change
                              )}
                            </td>
                          </tr>
                        )
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

          <div className="panel">

            <h2>
              Clinical Outcome
              Comparison
            </h2>

            <div className="form-grid">

              <label>
                <span>
                  Initial Pain
                </span>

                <input
                  value={
                    initialAssessment.pain_score !==
                    null
                      ? `${initialAssessment.pain_score}/10`
                      : 'Not recorded'
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
                    reassessment.pain_score !==
                    null
                      ? `${reassessment.pain_score}/10`
                      : 'Not recorded'
                  }
                  disabled
                />
              </label>

              <label>
                <span>
                  Initial Outcome
                </span>

                <input
                  value={formatLabel(
                    initialAssessment.final_outcome
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
                    reassessment.final_outcome
                  )}
                  disabled
                />
              </label>

            </div>

          </div>

          <div className="panel">

            <h2>
              Return-to-Work
              Interpretation
            </h2>

            <p>
              This comparison provides
              decision-support information
              based on the recorded FCE
              classifications before and
              after rehabilitation.
              Individual measured values
              are shown for context, while
              the comparison status is
              based on recorded pass,
              borderline and fail
              classifications. The final
              return-to-work decision
              remains the professional
              determination of the
              responsible clinician or
              assessor.
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
                onClick={() =>
                  navigate(
                    `/assessments/${initialAssessment.id}/record`
                  )
                }
              >
                View Initial FCE
              </button>

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

              {reassessment.assessment_status ===
                'completed' && (
                <button
                  className="primary-button"
                  onClick={() =>
                    navigate(
                      `/rehabilitation/${rehabCase.id}/discharge`
                    )
                  }
                >
                  <ShieldCheck
                    size={16}
                  />
                  Final RTW Decision
                </button>
              )}
            </div>

          </div>

        </>
      )}

    </div>
  )
}
