import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  MapPin,
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
  date_of_birth: string | null
  sex: string | null
  employment_status: string | null
  fitness_status: string | null
  operation_id: string | null
  site_id: string | null
  department_id: string | null
  job_profile_id: string | null
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

type NamedItem = {
  id: string
  name?: string
  title?: string
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

  const [operation, setOperation] =
    useState<NamedItem | null>(null)

  const [site, setSite] =
    useState<NamedItem | null>(null)

  const [department, setDepartment] =
    useState<NamedItem | null>(null)

  const [job, setJob] =
    useState<NamedItem | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadReport()
  }, [id])

  async function loadReport() {
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
      setError(assessmentError.message)
      setLoading(false)
      return
    }

    const typedAssessment =
      assessmentData as Assessment

    setAssessment(typedAssessment)

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
        date_of_birth,
        sex,
        employment_status,
        fitness_status,
        operation_id,
        site_id,
        department_id,
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

    const [
      resultsResponse,
      operationResponse,
      siteResponse,
      departmentResponse,
      jobResponse,
    ] = await Promise.all([
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

      typedWorker.operation_id
        ? supabase
            .from('operations')
            .select('id,name')
            .eq(
              'id',
              typedWorker.operation_id
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      typedWorker.site_id
        ? supabase
            .from('sites')
            .select('id,name')
            .eq(
              'id',
              typedWorker.site_id
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      typedWorker.department_id
        ? supabase
            .from('departments')
            .select('id,name')
            .eq(
              'id',
              typedWorker.department_id
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      typedWorker.job_profile_id
        ? supabase
            .from('job_profiles')
            .select('id,title')
            .eq(
              'id',
              typedWorker.job_profile_id
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),
    ])

    if (resultsResponse.error) {
      setError(
        resultsResponse.error.message
      )
      setLoading(false)
      return
    }

    setResults(
      (resultsResponse.data ?? []) as Result[]
    )

    setOperation(operationResponse.data)
    setSite(siteResponse.data)
    setDepartment(departmentResponse.data)
    setJob(jobResponse.data)

    setLoading(false)
  }

  const analysis = useMemo(() => {
    const tested = results.filter(
      (result) =>
        result.result &&
        result.result !== 'not_tested'
    )

    const passed = tested.filter(
      (result) =>
        result.result === 'pass'
    ).length

    const borderline = tested.filter(
      (result) =>
        result.result === 'borderline'
    ).length

    const failed = tested.filter(
      (result) =>
        result.result === 'fail'
    ).length

    const comparable = results.filter(
      (result) =>
        result.measured_value !== null &&
        result.required_value !== null &&
        Number(result.required_value) > 0
    )

    const gaps = comparable.filter(
      (result) =>
        Number(result.measured_value) <
        Number(result.required_value)
    )

    return {
      tested: tested.length,
      passed,
      borderline,
      failed,
      comparable,
      gaps,
    }
  }, [results])

  function formatStatus(
    value: string | null | undefined
  ) {
    if (!value) return 'Not recorded'

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
    value: string | null
  ) {
    if (!value) return 'Not recorded'

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

  function resultClass(
    value: string | null
  ) {
    if (value === 'pass') return 'pass'

    if (value === 'fail') return 'fail'

    if (value === 'borderline') {
      return 'borderline'
    }

    return 'not_tested'
  }

  function outcomeClass(
    value: string | null
  ) {
    if (value === 'fit') return 'pass'

    if (
      value === 'temporarily_unfit'
    ) {
      return 'fail'
    }

    return 'borderline'
  }

  function reportReference() {
    return `FCE-${assessment?.id
      .slice(0, 8)
      .toUpperCase()}`
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Preparing FCE report...</p>
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
    <div className="fce-report-document">

      {/* SCREEN CONTROLS */}

      <div className="report-screen-controls no-print">

        <button
          className="secondary-button"
          onClick={() =>
            navigate(
              `/workers/${worker.id}`
            )
          }
        >
          <ArrowLeft size={16} />
          Worker Profile
        </button>

        <button
          className="primary-button"
          onClick={() =>
            window.print()
          }
        >
          <Printer size={16} />
          Print / Save PDF
        </button>

      </div>

      {/* =====================================
          PAGE 1
          ===================================== */}

      <section className="fce-print-page">

        <header className="fce-report-header">

          <div className="fce-brand">

            <div className="fce-brand-mark">
              S
            </div>

            <div>
              <strong>
                SpineSync Enterprise
              </strong>

              <span>
                Mining MSK & Functional
                Capacity Platform
              </span>
            </div>

          </div>

          <div className="fce-report-meta">

            <div>
              <span>
                REPORT REFERENCE
              </span>

              <strong>
                {reportReference()}
              </strong>
            </div>

            <div>
              <span>
                ASSESSMENT DATE
              </span>

              <strong>
                {formatDate(
                  assessment.assessment_date
                )}
              </strong>
            </div>

          </div>

        </header>

        <div className="fce-report-title">

          <span>
            OCCUPATIONAL HEALTH
          </span>

          <h1>
            Functional Capacity
            Evaluation Report
          </h1>

          <p>
            Functional capacity findings
            and comparison with recorded
            occupational job demands.
          </p>

        </div>

        {/* WORKER */}

        <div className="fce-report-section">

          <div className="fce-report-section-heading">

            <User size={18} />

            <div>
              <h2>
                Worker Identification
              </h2>

              <p>
                Employee and demographic
                information
              </p>
            </div>

          </div>

          <div className="fce-info-table">

            <div>
              <span>
                Worker
              </span>

              <strong>
                {worker.first_name}{' '}
                {worker.last_name}
              </strong>
            </div>

            <div>
              <span>
                Employee Number
              </span>

              <strong>
                {worker.employee_number}
              </strong>
            </div>

            <div>
              <span>
                Date of Birth
              </span>

              <strong>
                {formatDate(
                  worker.date_of_birth
                )}
              </strong>
            </div>

            <div>
              <span>
                Sex
              </span>

              <strong>
                {formatStatus(
                  worker.sex
                )}
              </strong>
            </div>

          </div>

        </div>

        {/* MINING PLACEMENT */}

        <div className="fce-report-section">

          <div className="fce-report-section-heading">

            <MapPin size={18} />

            <div>
              <h2>
                Occupational Placement
              </h2>

              <p>
                Mining operation and
                assigned job
              </p>
            </div>

          </div>

          <div className="fce-info-table">

            <div>
              <span>
                Operation
              </span>

              <strong>
                {operation?.name ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <span>
                Site / Shaft
              </span>

              <strong>
                {site?.name ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <span>
                Department
              </span>

              <strong>
                {department?.name ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <span>
                Job Profile
              </span>

              <strong>
                {job?.title ||
                  'Not assigned'}
              </strong>
            </div>

          </div>

        </div>

        {/* ASSESSMENT */}

        <div className="fce-report-section">

          <div className="fce-report-section-heading">

            <ClipboardCheck size={18} />

            <div>
              <h2>
                Assessment Information
              </h2>

              <p>
                Referral and assessment
                details
              </p>
            </div>

          </div>

          <div className="fce-info-table">

            <div>
              <span>
                Assessment Type
              </span>

              <strong>
                {formatStatus(
                  assessment.assessment_type
                )}
              </strong>
            </div>

            <div>
              <span>
                Assessment Status
              </span>

              <strong>
                {formatStatus(
                  assessment.assessment_status
                )}
              </strong>
            </div>

          </div>

          <div className="fce-full-row">

            <span>
              Referral Reason
            </span>

            <strong>
              {assessment.referral_reason ||
                'Not recorded'}
            </strong>

          </div>

        </div>

        {/* SCREENING */}

        <div className="fce-report-section">

          <div className="fce-report-section-heading">

            <HeartPulse size={18} />

            <div>
              <h2>
                Pre-Test Clinical
                Screening
              </h2>

              <p>
                Baseline measurements
                before functional testing
              </p>
            </div>

          </div>

          <div className="fce-vital-grid">

            <div>
              <span>
                PAIN
              </span>

              <strong>
                {assessment.pain_score ??
                  '—'}
                /10
              </strong>
            </div>

            <div>
              <span>
                BLOOD PRESSURE
              </span>

              <strong>
                {assessment.systolic_bp ??
                  '—'}
                /
                {assessment.diastolic_bp ??
                  '—'}
              </strong>

              <small>
                mmHg
              </small>
            </div>

            <div>
              <span>
                RESTING HR
              </span>

              <strong>
                {assessment.resting_hr ??
                  '—'}
              </strong>

              <small>
                bpm
              </small>
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

            <div>
              <span>
                HEIGHT
              </span>

              <strong>
                {assessment.height_cm ??
                  '—'}
              </strong>

              <small>
                cm
              </small>
            </div>

            <div>
              <span>
                WEIGHT
              </span>

              <strong>
                {assessment.weight_kg ??
                  '—'}
              </strong>

              <small>
                kg
              </small>
            </div>

          </div>

          <div className="fce-full-row">

            <span>
              Pre-Test Status
            </span>

            <strong>
              {formatStatus(
                assessment.pre_test_status
              )}
            </strong>

          </div>

        </div>

        {/* FINAL OUTCOME */}

        <div className="fce-decision-card">

          <div>

            <span>
              FINAL ASSESSOR OUTCOME
            </span>

            <h2>
              {formatStatus(
                assessment.final_outcome ||
                  'pending'
              )}
            </h2>

          </div>

          <ShieldCheck size={34} />

        </div>

        <div className="fce-page-footer">

          <span>
            SpineSync Enterprise
          </span>

          <span>
            {reportReference()}
          </span>

          <span>
            Page 1
          </span>

        </div>

      </section>

      {/* =====================================
          PAGE 2
          ===================================== */}

      <section className="fce-print-page">

        <header className="fce-report-header compact">

          <div className="fce-brand">

            <div className="fce-brand-mark">
              S
            </div>

            <div>
              <strong>
                SpineSync Enterprise
              </strong>

              <span>
                Functional Capacity
                Evaluation
              </span>
            </div>

          </div>

          <div className="fce-worker-mini">

            <strong>
              {worker.first_name}{' '}
              {worker.last_name}
            </strong>

            <span>
              {worker.employee_number}
            </span>

          </div>

        </header>

        {/* CAPACITY SUMMARY */}

        <div className="fce-report-section">

          <div className="fce-report-section-heading">

            <Activity size={18} />

            <div>
              <h2>
                Functional Capacity
                Summary
              </h2>

              <p>
                Summary of recorded
                functional performance
              </p>
            </div>

          </div>

          <div className="fce-summary-row">

            <div>
              <span>
                TESTED
              </span>

              <strong>
                {analysis.tested}
              </strong>
            </div>

            <div>
              <span>
                PASS
              </span>

              <strong>
                {analysis.passed}
              </strong>
            </div>

            <div>
              <span>
                BORDERLINE
              </span>

              <strong>
                {analysis.borderline}
              </strong>
            </div>

            <div>
              <span>
                FAIL
              </span>

              <strong>
                {analysis.failed}
              </strong>
            </div>

            <div>
              <span>
                CAPACITY GAPS
              </span>

              <strong>
                {analysis.gaps.length}
              </strong>
            </div>

          </div>

        </div>

        {/* RESULTS */}

        <div className="fce-report-section">

          <div className="fce-report-section-heading">

            <BriefcaseBusiness size={18} />

            <div>
              <h2>
                Functional Test Results
              </h2>

              <p>
                Worker capacity compared
                with recorded job demand
              </p>
            </div>

          </div>

          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>
                    Test
                  </th>

                  <th>
                    Worker
                  </th>

                  <th>
                    Demand
                  </th>

                  <th>
                    Comparison
                  </th>

                  <th>
                    Result
                  </th>
                </tr>
              </thead>

              <tbody>

                {results.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      No functional test
                      results recorded.
                    </td>
                  </tr>
                )}

                {results.map(
                  (result) => {
                    const comparable =
                      result.measured_value !==
                        null &&
                      result.required_value !==
                        null &&
                      Number(
                        result.required_value
                      ) > 0

                    const percentage =
                      comparable
                        ? (Number(
                            result.measured_value
                          ) /
                            Number(
                              result.required_value
                            )) *
                          100
                        : null

                    return (
                      <tr key={result.id}>

                        <td>
                          <strong>
                            {result.test_name}
                          </strong>

                          {result.side && (
                            <small>
                              {formatStatus(
                                result.side
                              )}
                            </small>
                          )}
                        </td>

                        <td>
                          {result.measured_value ??
                            '—'}{' '}
                          {result.unit || ''}
                        </td>

                        <td>
                          {result.required_value ??
                            '—'}{' '}
                          {result.unit || ''}
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
                          <span
                            className={`badge ${resultClass(
                              result.result
                            )}`}
                          >
                            {formatStatus(
                              result.result ||
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

        </div>

        {/* CAPACITY GAPS */}

        <div className="fce-report-section">

          <div className="fce-report-section-heading">

            <TrendingDown size={18} />

            <div>
              <h2>
                Identified Capacity Gaps
              </h2>

              <p>
                Tests where recorded
                capacity was below the
                available job demand
              </p>
            </div>

          </div>

          {analysis.gaps.length === 0 ? (

            <div className="fce-no-gap">

              <CheckCircle2 size={20} />

              <span>
                No recorded capacity
                deficits against available
                numeric job demands.
              </span>

            </div>

          ) : (

            <div className="fce-gap-list">

              {analysis.gaps.map(
                (result) => {
                  const difference =
                    Number(
                      result.required_value
                    ) -
                    Number(
                      result.measured_value
                    )

                  return (
                    <div key={result.id}>

                      <strong>
                        {result.test_name}
                      </strong>

                      <span>
                        Worker:{' '}
                        {result.measured_value}{' '}
                        {result.unit || ''}
                      </span>

                      <span>
                        Demand:{' '}
                        {result.required_value}{' '}
                        {result.unit || ''}
                      </span>

                      <span>
                        Gap:{' '}
                        {difference.toFixed(
                          1
                        )}{' '}
                        {result.unit || ''}
                      </span>

                    </div>
                  )
                }
              )}

            </div>

          )}

        </div>

        {/* CLINICAL DECISION */}

        <div className="fce-report-section">

          <div className="fce-report-section-heading">

            <ShieldCheck size={18} />

            <div>
              <h2>
                Clinical Decision
              </h2>

              <p>
                Assessor-recorded outcome,
                restrictions and
                recommendations
              </p>
            </div>

          </div>

          <div className="fce-final-outcome">

            <span>
              FINAL OUTCOME
            </span>

            <strong
              className={`badge ${outcomeClass(
                assessment.final_outcome
              )}`}
            >
              {formatStatus(
                assessment.final_outcome ||
                  'pending'
              )}
            </strong>

          </div>

          <div className="fce-clinical-text">

            <span>
              RESTRICTIONS
            </span>

            <p>
              {assessment.restrictions ||
                'No restrictions recorded.'}
            </p>

          </div>

          <div className="fce-clinical-text">

            <span>
              RECOMMENDATIONS
            </span>

            <p>
              {assessment.recommendations ||
                'No recommendations recorded.'}
            </p>

          </div>

        </div>

        {/* DECLARATION */}

        <div className="fce-declaration">

          <h2>
            Assessor Declaration
          </h2>

          <p>
            This report records functional
            capacity findings obtained
            during this assessment and
            compares recorded worker
            performance with job-demand
            information available within
            SpineSync.
          </p>

          <p>
            The final fitness outcome is
            the assessor's professional
            determination and should be
            interpreted together with the
            worker's clinical presentation,
            occupational requirements and
            other relevant occupational
            health information.
          </p>

          <div className="fce-signature-grid">

            <div>
              <span>
                Assessor
              </span>

              <strong>
                __________________________
              </strong>
            </div>

            <div>
              <span>
                HPCSA Registration
              </span>

              <strong>
                __________________________
              </strong>
            </div>

            <div>
              <span>
                Signature
              </span>

              <strong>
                __________________________
              </strong>
            </div>

            <div>
              <span>
                Date
              </span>

              <strong>
                {formatDate(
                  assessment.assessment_date
                )}
              </strong>
            </div>

          </div>

        </div>

        <div className="fce-page-footer">

          <span>
            SpineSync Enterprise
          </span>

          <span>
            {reportReference()}
          </span>

          <span>
            Page 2
          </span>

        </div>

      </section>

    </div>
  )
}
