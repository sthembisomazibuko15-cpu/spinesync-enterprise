import {
  Activity,
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
  type FormEvent,
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
  final_outcome: string | null
  restrictions: string | null
  recommendations: string | null
}

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
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
  pain_before: number | null
  pain_after: number | null
  notes: string | null
}

export default function FceOutcome() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [assessment, setAssessment] =
    useState<Assessment | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [results, setResults] =
    useState<Result[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [form, setForm] =
    useState({
      final_outcome: '',
      restrictions: '',
      recommendations: '',
    })

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
        final_outcome,
        restrictions,
        recommendations
      `)
      .eq('id', id)
      .single()

    if (assessmentError) {
      setError(
        assessmentError.message
      )
      setLoading(false)
      return
    }

    const typedAssessment =
      assessmentData as Assessment

    setAssessment(
      typedAssessment
    )

    setForm({
      final_outcome:
        typedAssessment.final_outcome ??
        '',

      restrictions:
        typedAssessment.restrictions ??
        '',

      recommendations:
        typedAssessment.recommendations ??
        '',
    })

    const [
      workerResult,
      resultsResult,
    ] = await Promise.all([
      supabase
        .from('workers')
        .select(`
          id,
          employee_number,
          first_name,
          last_name
        `)
        .eq(
          'id',
          typedAssessment.worker_id
        )
        .single(),

      supabase
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
          pain_before,
          pain_after,
          notes
        `)
        .eq(
          'assessment_id',
          typedAssessment.id
        )
        .order('test_category'),
    ])

    if (workerResult.error) {
      setError(
        workerResult.error.message
      )
      setLoading(false)
      return
    }

    if (resultsResult.error) {
      setError(
        resultsResult.error.message
      )
      setLoading(false)
      return
    }

    setWorker(
      workerResult.data as Worker
    )

    setResults(
      (resultsResult.data ??
        []) as Result[]
    )

    setLoading(false)
  }

  const analysis = useMemo(() => {
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

    const capacityGaps =
      results
        .filter(
          (item) =>
            item.measured_value !==
              null &&
            item.required_value !==
              null &&
            item.required_value > 0 &&
            item.measured_value <
              item.required_value
        )
        .map((item) => {
          const measured =
            Number(
              item.measured_value
            )

          const required =
            Number(
              item.required_value
            )

          const gap =
            required - measured

          const percentage =
            (measured /
              required) *
            100

          return {
            ...item,
            gap,
            percentage,
          }
        })

    const painIncrease =
      results.filter(
        (item) =>
          item.pain_before !==
            null &&
          item.pain_after !==
            null &&
          item.pain_after >
            item.pain_before
      )

    return {
      tested: tested.length,
      passed: passed.length,
      borderline:
        borderline.length,
      failed: failed.length,
      capacityGaps,
      painIncrease,
    }
  }, [results])

  const suggestedOutcome =
    useMemo(() => {
      if (
        analysis.failed === 0 &&
        analysis.borderline === 0 &&
        analysis.tested > 0
      ) {
        return 'fit'
      }

      if (
        analysis.failed === 0 &&
        analysis.borderline > 0
      ) {
        return 'fit_with_restrictions'
      }

      if (
        analysis.failed > 0 &&
        analysis.failed <= 2
      ) {
        return 'rehabilitation'
      }

      if (analysis.failed > 2) {
        return 'temporarily_unfit'
      }

      return 'reassessment_required'
    }, [analysis])

  function formatStatus(
    value: string
  ) {
    return value
      .split('_')
      .join(' ')
      .replace(
        /\b\w/g,
        (letter: string) =>
          letter.toUpperCase()
      )
  }

  async function saveOutcome(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!assessment)
      return

    if (!form.final_outcome) {
      setError(
        'Please select a final outcome.'
      )
      return
    }

    setSaving(true)
    setError(null)

    const {
      error: updateError,
    } = await supabase
      .from('assessments')
      .update({
        final_outcome:
          form.final_outcome,

        restrictions:
          form.restrictions.trim() ||
          null,

        recommendations:
          form.recommendations.trim() ||
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

    if (updateError) {
      setError(
        updateError.message
      )
      setSaving(false)
      return
    }

    await supabase
      .from('workers')
      .update({
        fitness_status:
          form.final_outcome,
      })
      .eq(
        'id',
        assessment.worker_id
      )

    navigate(
      `/workers/${assessment.worker_id}`
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
    (!assessment || !worker)
  ) {
    return (
      <div className="stack">
        <div className="error-message">
          {error}
        </div>
      </div>
    )
  }

  if (!assessment || !worker) {
    return null
  }

  return (
    <div className="stack">

      <div className="section-heading">
        <div>
          <button
            className="back-link button-reset"
            onClick={() =>
              navigate(
                `/assessments/${assessment.id}`
              )
            }
          >
            <ArrowLeft size={16} />
            Physical testing
          </button>

          <span className="eyebrow">
            FUNCTIONAL CAPACITY
            EVALUATION
          </span>

          <h2>
            Capacity Analysis
          </h2>

          <p>
            {worker.first_name}{' '}
            {worker.last_name}
            {' • '}
            {worker.employee_number}
          </p>
        </div>

        <div className="assessment-status">
          <ClipboardCheck
            size={17}
          />
          FCE Outcome
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="assessment-progress">
        <div className="progress-step">
          <span>1</span>
          Setup
        </div>

        <div className="progress-line" />

        <div className="progress-step">
          <span>2</span>
          Screening
        </div>

        <div className="progress-line" />

        <div className="progress-step">
          <span>3</span>
          Testing
        </div>

        <div className="progress-line" />

        <div className="progress-step active">
          <span>4</span>
          Outcome
        </div>
      </div>

      <div className="fce-summary-grid">

        <div className="worker-summary-card">
          <CheckCircle2
            size={20}
          />

          <span>
            Passed
          </span>

          <strong>
            {analysis.passed}
          </strong>
        </div>

        <div className="worker-summary-card">
          <AlertTriangle
            size={20}
          />

          <span>
            Borderline
          </span>

          <strong>
            {analysis.borderline}
          </strong>
        </div>

        <div className="worker-summary-card">
          <TrendingDown
            size={20}
          />

          <span>
            Capacity gaps
          </span>

          <strong>
            {
              analysis.capacityGaps
                .length
            }
          </strong>
        </div>

        <div className="worker-summary-card">
          <Activity size={20} />

          <span>
            Failed
          </span>

          <strong>
            {analysis.failed}
          </strong>
        </div>

      </div>

      <section className="panel assessment-section">
        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <TrendingDown
              size={20}
            />
          </div>

          <div>
            <h3>
              Worker Capacity vs
              Job Demand
            </h3>

            <p>
              Identified capacity gaps
              from the physical
              assessment.
            </p>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  Test
                </th>

                <th>
                  Capacity
                </th>

                <th>
                  Job demand
                </th>

                <th>
                  Capacity %
                </th>

                <th>
                  Gap
                </th>

                <th>
                  Result
                </th>
              </tr>
            </thead>

            <tbody>

              {results.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    No test results
                    recorded.
                  </td>
                </tr>
              )}

              {results.map(
                (item) => {
                  const hasComparison =
                    item.measured_value !==
                      null &&
                    item.required_value !==
                      null &&
                    item.required_value >
                      0

                  const percentage =
                    hasComparison
                      ? (Number(
                          item.measured_value
                        ) /
                          Number(
                            item.required_value
                          )) *
                        100
                      : null

                  const gap =
                    hasComparison
                      ? Number(
                          item.required_value
                        ) -
                        Number(
                          item.measured_value
                        )
                      : null

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {
                            item.test_name
                          }
                        </strong>

                        {item.side && (
                          <div className="test-category">
                            {
                              item.side
                            }
                          </div>
                        )}
                      </td>

                      <td>
                        {item.measured_value ??
                          '—'}{' '}
                        {item.unit ??
                          ''}
                      </td>

                      <td>
                        {item.required_value ??
                          '—'}{' '}
                        {item.unit ??
                          ''}
                      </td>

                      <td>
                        {percentage !==
                        null
                          ? `${percentage.toFixed(
                              0
                            )}%`
                          : '—'}
                      </td>

                      <td>
                        {gap !== null &&
                        gap > 0
                          ? `${gap.toFixed(
                              1
                            )} ${
                              item.unit ??
                              ''
                            }`
                          : '—'}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            item.result ??
                            'not_tested'
                          }`}
                        >
                          {formatStatus(
                            item.result ??
                              'not_tested'
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                }
              )}

            </tbody>
          </table>
        </div>
      </section>

      <section className="panel assessment-section">
        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <ShieldCheck
              size={20}
            />
          </div>

          <div>
            <h3>
              Clinical Outcome
            </h3>

            <p>
              Use the test findings,
              clinical judgement and
              job demands to determine
              the final outcome.
            </p>
          </div>
        </div>

        <div className="suggestion-card">
          <span>
            SpineSync result summary
          </span>

          <strong>
            {formatStatus(
              suggestedOutcome
            )}
          </strong>

          <p>
            This is a decision-support
            suggestion based on the
            recorded test results. The
            assessor determines the
            final clinical outcome.
          </p>
        </div>

        <form
          className="stack"
          onSubmit={saveOutcome}
        >
          <div className="form-grid">

            <label>
              Final outcome

              <select
                value={
                  form.final_outcome
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    final_outcome:
                      event.target.value,
                  })
                }
                required
              >
                <option value="">
                  Select outcome
                </option>

                <option value="fit">
                  Fit
                </option>

                <option value="fit_with_restrictions">
                  Fit with restrictions
                </option>

                <option value="temporarily_unfit">
                  Temporarily unfit
                </option>

                <option value="rehabilitation">
                  Rehabilitation required
                </option>

                <option value="reassessment_required">
                  Reassessment required
                </option>
              </select>
            </label>

            <div>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setForm({
                    ...form,
                    final_outcome:
                      suggestedOutcome,
                  })
                }
              >
                Use SpineSync
                suggestion
              </button>
            </div>

            <label className="form-full">
              Restrictions

              <textarea
                rows={4}
                value={
                  form.restrictions
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    restrictions:
                      event.target.value,
                  })
                }
                placeholder="Example: No repetitive lifting above 15 kg. Avoid sustained overhead work."
              />
            </label>

            <label className="form-full">
              Recommendations

              <textarea
                rows={5}
                value={
                  form.recommendations
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    recommendations:
                      event.target.value,
                  })
                }
                placeholder="Example: Four-week work conditioning programme followed by functional reassessment."
              />
            </label>

          </div>

          <div className="assessment-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(
                  `/assessments/${assessment.id}`
                )
              }
            >
              <ArrowLeft size={16} />
              Back to testing
            </button>

            <button
              className="primary-button"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Save size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2
                    size={16}
                  />
                  Complete FCE
                </>
              )}
            </button>
          </div>
        </form>
      </section>

    </div>
  )
}
