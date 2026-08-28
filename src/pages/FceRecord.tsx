import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  Printer,
  ShieldCheck,
  TrendingDown,
  User,
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
  assessment_type: string
  assessment_date: string
  referral_reason: string | null
  pain_score: number | null
  systolic_bp: number | null
  diastolic_bp: number | null
  resting_hr: number | null
  height_cm: number | null
  weight_kg: number | null
  bmi: number | null
  pre_test_status: string | null
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

export default function FceRecord() {
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

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadRecord()
  }, [id])

  async function loadRecord() {
    if (!id) {
      setError(
        'Assessment not found.'
      )
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
        assessment_type,
        assessment_date,
        referral_reason,
        pain_score,
        systolic_bp,
        diastolic_bp,
        resting_hr,
        height_cm,
        weight_kg,
        bmi,
        pre_test_status,
        assessment_status,
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
      ).length

    const borderline =
      tested.filter(
        (item) =>
          item.result ===
          'borderline'
      ).length

    const failed =
      tested.filter(
        (item) =>
          item.result === 'fail'
      ).length

    const gaps =
      results.filter(
        (item) =>
          item.measured_value !==
            null &&
          item.required_value !==
            null &&
          item.required_value > 0 &&
          item.measured_value <
            item.required_value
      ).length

    return {
      passed,
      borderline,
      failed,
      gaps,
    }
  }, [results])

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

  function formatDate(
    value: string
  ) {
    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      'en-ZA',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }
    )
  }

  function outcomeBadge(
    value: string | null
  ) {
    if (!value)
      return 'not_tested'

    if (value === 'fit')
      return 'pass'

    if (
      value ===
      'temporarily_unfit'
    ) {
      return 'fail'
    }

    return 'borderline'
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading FCE record...
        </p>
      </div>
    )
  }

  if (
    error ||
    !assessment ||
    !worker
  ) {
    return (
      <div className="stack">
        <div className="error-message">
          {error ||
            'Assessment not found.'}
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate('/workers')
          }
        >
          Back to workers
        </button>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="section-heading">
        <div>
          <button
            className="back-link button-reset"
            onClick={() =>
              navigate(
                `/workers/${worker.id}`
              )
            }
          >
            <ArrowLeft size={16} />
            Worker profile
          </button>

          <span className="eyebrow">
            FCE RECORD
          </span>

          <h2>
            Functional Capacity
            Evaluation
          </h2>

          <p>
            {worker.first_name}{' '}
            {worker.last_name}
            {' • '}
            {worker.employee_number}
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            window.print()
          }
        >
          <Printer size={16} />
          Print
        </button>
      </div>

      <section className="panel assessment-section">
        <div className="record-header-grid">

          <div>
            <span className="small-label">
              WORKER
            </span>

            <strong>
              {worker.first_name}{' '}
              {worker.last_name}
            </strong>

            <p>
              {
                worker.employee_number
              }
            </p>
          </div>

          <div>
            <span className="small-label">
              ASSESSMENT DATE
            </span>

            <strong>
              <CalendarDays
                size={15}
              />

              {formatDate(
                assessment.assessment_date
              )}
            </strong>
          </div>

          <div>
            <span className="small-label">
              ASSESSMENT TYPE
            </span>

            <strong>
              {formatStatus(
                assessment.assessment_type
              )}
            </strong>
          </div>

          <div>
            <span className="small-label">
              STATUS
            </span>

            <span
              className={`badge ${
                assessment.assessment_status ===
                'completed'
                  ? 'pass'
                  : 'borderline'
              }`}
            >
              {formatStatus(
                assessment.assessment_status
              )}
            </span>
          </div>

        </div>
      </section>

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
          <Activity size={20} />

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
            {analysis.gaps}
          </strong>
        </div>

        <div className="worker-summary-card">
          <ShieldCheck
            size={20}
          />

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
            <User size={20} />
          </div>

          <div>
            <h3>
              Assessment Details
            </h3>

            <p>
              Referral and pre-test
              information.
            </p>
          </div>
        </div>

        <div className="record-details-grid">

          <div>
            <span>
              Referral reason
            </span>

            <strong>
              {assessment.referral_reason ||
                'Not recorded'}
            </strong>
          </div>

          <div>
            <span>
              Pre-test status
            </span>

            <strong>
              {assessment.pre_test_status
                ? formatStatus(
                    assessment.pre_test_status
                  )
                : 'Not recorded'}
            </strong>
          </div>

        </div>

      </section>

      <section className="panel assessment-section">

        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <HeartPulse
              size={20}
            />
          </div>

          <div>
            <h3>
              Pre-Test Screening
            </h3>

            <p>
              Baseline clinical
              observations.
            </p>
          </div>
        </div>

        <div className="record-vitals-grid">

          <div>
            <span>
              Pain
            </span>

            <strong>
              {assessment.pain_score ??
                '—'}
              /10
            </strong>
          </div>

          <div>
            <span>
              Blood pressure
            </span>

            <strong>
              {assessment.systolic_bp ??
                '—'}
              /
              {assessment.diastolic_bp ??
                '—'}
            </strong>
          </div>

          <div>
            <span>
              Resting HR
            </span>

            <strong>
              {assessment.resting_hr ??
                '—'}{' '}
              bpm
            </strong>
          </div>

          <div>
            <span>
              Height
            </span>

            <strong>
              {assessment.height_cm ??
                '—'}{' '}
              cm
            </strong>
          </div>

          <div>
            <span>
              Weight
            </span>

            <strong>
              {assessment.weight_kg ??
                '—'}{' '}
              kg
            </strong>
          </div>

          <div>
            <span>
              BMI
            </span>

            <strong>
              {assessment.bmi ??
                '—'}
            </strong>
          </div>

        </div>

      </section>

      <section className="panel assessment-section">

        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <ClipboardCheck
              size={20}
            />
          </div>

          <div>
            <h3>
              Functional Test
              Results
            </h3>

            <p>
              Worker capacity compared
              with recorded job demand.
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
                  Pain
                </th>

                <th>
                  Result
                </th>

                <th>
                  Notes
                </th>
              </tr>
            </thead>

            <tbody>

              {results.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    No functional test
                    results recorded.
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

                  return (
                    <tr key={item.id}>

                      <td>
                        <strong>
                          {
                            item.test_name
                          }
                        </strong>

                        <div className="test-category">
                          {
                            item.test_category
                          }

                          {item.side
                            ? ` • ${item.side}`
                            : ''}
                        </div>
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
                        {item.pain_before ??
                          '—'}
                        {' → '}
                        {item.pain_after ??
                          '—'}
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

                      <td>
                        {item.notes ||
                          '—'}
                      </td>

                    </tr>
                  )
                }
              )}

            </tbody>
          </table>

        </div>

      </section>

      <section className="panel assessment-section outcome-record">

        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <ShieldCheck
              size={20}
            />
          </div>

          <div>
            <h3>
              Final Outcome
            </h3>

            <p>
              Assessor-recorded FCE
              conclusion.
            </p>
          </div>
        </div>

        <div className="record-outcome">

          <span>
            Fitness outcome
          </span>

          <span
            className={`badge ${outcomeBadge(
              assessment.final_outcome
            )}`}
          >
            {assessment.final_outcome
              ? formatStatus(
                  assessment.final_outcome
                )
              : 'Pending'}
          </span>

        </div>

        <div className="record-text-block">

          <span>
            Restrictions
          </span>

          <p>
            {assessment.restrictions ||
              'No restrictions recorded.'}
          </p>

        </div>

        <div className="record-text-block">

          <span>
            Recommendations
          </span>

          <p>
            {assessment.recommendations ||
              'No recommendations recorded.'}
          </p>

        </div>

      </section>

    </div>
  )
}
