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
  assessor_id: string | null
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
        recommendations,
        assessor_id
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
      (resultsResponse.data ??
        []) as Result[]
    )

    setOperation(
      operationResponse.data
    )

    setSite(
      siteResponse.data
    )

    setDepartment(
      departmentResponse.data
    )

    setJob(
      jobResponse.data
    )

    setLoading(false)
  }

  const analysis = useMemo(() => {
    const tested =
      results.filter(
        (item) =>
          item.result &&
          item.result !== 'not_tested'
      )

    const passed =
      tested.filter(
        (item) =>
          item.result === 'pass'
      ).length

    const borderline =
      tested.filter(
        (item) =>
          item.result === 'borderline'
      ).length

    const failed =
      tested.filter(
        (item) =>
          item.result === 'fail'
      ).length

    const capacityGaps =
      results.filter(
        (item) =>
          item.measured_value !== null &&
          item.required_value !== null &&
          Number(item.required_value) > 0 &&
          Number(item.measured_value) <
            Number(item.required_value)
      )

    return {
      tested: tested.length,
      passed,
      borderline,
      failed,
      capacityGaps,
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

  function getResultClass(
    result: string | null
  ) {
    if (result === 'pass') {
      return 'pass'
    }

    if (result === 'fail') {
      return 'fail'
    }

    if (result === 'borderline') {
      return 'borderline'
    }

    return 'not_tested'
  }

  function getOutcomeClass(
    outcome: string | null
  ) {
    if (outcome === 'fit') {
      return 'pass'
    }

    if (
      outcome ===
      'temporarily_unfit'
    ) {
      return 'fail'
    }

    return 'borderline'
  }

  function reportReference() {
    if (!assessment) return ''

    return `FCE-${assessment.id
      .slice(0, 8)
      .toUpperCase()}`
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Preparing FCE report...
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
            'Assessment record not found.'}
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
    <div className="stack fce-report">

      <div className="section-heading no-print">
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

          <h2>
            FCE Report
          </h2>

          <p>
            Review or print the completed
            assessment.
          </p>
        </div>

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

      <section className="panel assessment-section">

        <div className="report-title-block">

          <div>
            <span className="eyebrow">
              SPINESYNC ENTERPRISE
            </span>

            <h1>
              Functional Capacity
              Evaluation Report
            </h1>

            <p>
              Occupational functional
              capacity and job-demand
              comparison
            </p>
          </div>

          <div className="report-reference">
            <span>
              REPORT REFERENCE
            </span>

            <strong>
              {reportReference()}
            </strong>

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

      </section>

      <section className="panel assessment-section">

        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <User size={20} />
          </div>

          <div>
            <h3>
              Worker Identification
            </h3>

            <p>
              Worker and employment
              information.
            </p>
          </div>
        </div>

        <div className="record-details-grid">

          <div>
            <span>
              Worker name
            </span>

            <strong>
              {worker.first_name}{' '}
              {worker.last_name}
            </strong>
          </div>

          <div>
            <span>
              Employee number
            </span>

            <strong>
              {worker.employee_number}
            </strong>
          </div>

          <div>
            <span>
              Date of birth
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

          <div>
            <span>
              Employment status
            </span>

            <strong>
              {formatStatus(
                worker.employment_status
              )}
            </strong>
          </div>

          <div>
            <span>
              Current fitness status
            </span>

            <strong>
              {formatStatus(
                worker.fitness_status
              )}
            </strong>
          </div>

        </div>

      </section>

      <section className="panel assessment-section">

        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <MapPin size={20} />
          </div>

          <div>
            <h3>
              Mining Placement
            </h3>

            <p>
              Worksite and job
              allocation.
            </p>
          </div>
        </div>

        <div className="record-details-grid">

          <div>
            <span>
              Mining operation
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
              Job profile
            </span>

            <strong>
              <BriefcaseBusiness
                size={15}
              />

              {job?.title ||
                'Not assigned'}
            </strong>
          </div>

        </div>

      </section>

      <section className="panel assessment-section">

        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <CalendarDays
              size={20}
            />
          </div>

          <div>
            <h3>
              Assessment Information
            </h3>

            <p>
              FCE referral and assessment
              status.
            </p>
          </div>
        </div>

        <div className="record-details-grid">

          <div>
            <span>
              Assessment type
            </span>

            <strong>
              {formatStatus(
                assessment.assessment_type
              )}
            </strong>
          </div>

          <div>
            <span>
              Assessment date
            </span>

            <strong>
              {formatDate(
                assessment.assessment_date
              )}
            </strong>
          </div>

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
              Assessment status
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

      <section className="panel assessment-section">

        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <HeartPulse
              size={20}
            />
          </div>

          <div>
            <h3>
              Pre-Test Clinical Screening
            </h3>

            <p>
              Baseline observations
              recorded before functional
              testing.
            </p>
          </div>
        </div>

        <div className="record-vitals-grid">

          <div>
            <span>
              Pain score
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
                '—'}{' '}
              mmHg
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

        <div className="record-text-block">
          <span>
            Pre-test status
          </span>

          <p>
            {formatStatus(
              assessment.pre_test_status
            )}
          </p>
        </div>

      </section>

      <section className="panel assessment-section">

        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <Activity size={20} />
          </div>

          <div>
            <h3>
              Capacity Summary
            </h3>

            <p>
              Summary of recorded
              functional test results.
            </p>
          </div>
        </div>

        <div className="fce-summary-grid">

          <div className="worker-summary-card">
            <ClipboardCheck
              size={20}
            />

            <span>
              Tests assessed
            </span>

            <strong>
              {analysis.tested}
            </strong>
          </div>

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
              {
                analysis
                  .capacityGaps
                  .length
              }
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
              Functional Capacity
              Results
            </h3>

            <p>
              Recorded capacity compared
              with available job-demand
              requirements.
            </p>
          </div>
        </div>

        <div className="table-wrap">

          <table>
            <thead>
              <tr>
                <th>Test</th>
                <th>Capacity</th>
                <th>Job Demand</th>
                <th>Capacity %</th>
                <th>Pain</th>
                <th>Result</th>
                <th>Notes</th>
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
                  const canCompare =
                    item.measured_value !==
                      null &&
                    item.required_value !==
                      null &&
                    Number(
                      item.required_value
                    ) > 0

                  const percentage =
                    canCompare
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
                          {item.test_name}
                        </strong>

                        <div className="test-category">
                          {formatStatus(
                            item.test_category
                          )}

                          {item.side
                            ? ` • ${formatStatus(
                                item.side
                              )}`
                            : ''}
                        </div>
                      </td>

                      <td>
                        {item.measured_value ??
                          '—'}{' '}
                        {item.unit ?? ''}
                      </td>

                      <td>
                        {item.required_value ??
                          '—'}{' '}
                        {item.unit ?? ''}
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
                          className={`badge ${getResultClass(
                            item.result
                          )}`}
                        >
                          {formatStatus(
                            item.result ||
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

      {analysis.capacityGaps.length >
        0 && (
        <section className="panel assessment-section">

          <div className="assessment-section-title">
            <div className="profile-card-icon">
              <TrendingDown
                size={20}
              />
            </div>

            <div>
              <h3>
                Identified Capacity Gaps
              </h3>

              <p>
                Recorded capacities below
                the available job-demand
                requirement.
              </p>
            </div>
          </div>

          <div className="table-wrap">

            <table>
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Worker</th>
                  <th>Required</th>
                  <th>Difference</th>
                </tr>
              </thead>

              <tbody>
                {analysis.capacityGaps.map(
                  (item) => {
                    const difference =
                      Number(
                        item.required_value
                      ) -
                      Number(
                        item.measured_value
                      )

                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>
                            {item.test_name}
                          </strong>
                        </td>

                        <td>
                          {
                            item.measured_value
                          }{' '}
                          {item.unit ?? ''}
                        </td>

                        <td>
                          {
                            item.required_value
                          }{' '}
                          {item.unit ?? ''}
                        </td>

                        <td>
                          {difference.toFixed(
                            1
                          )}{' '}
                          {item.unit ?? ''}
                          {' below demand'}
                        </td>
                      </tr>
                    )
                  }
                )}
              </tbody>
            </table>

          </div>

        </section>
      )}

      <section className="panel assessment-section">

        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <ShieldCheck
              size={20}
            />
          </div>

          <div>
            <h3>
              Final Assessor Outcome
            </h3>

            <p>
              Final recorded clinical
              decision for this
              assessment.
            </p>
          </div>
        </div>

        <div className="record-outcome">

          <span>
            Fitness outcome
          </span>

          <span
            className={`badge ${getOutcomeClass(
              assessment.final_outcome
            )}`}
          >
            {formatStatus(
              assessment.final_outcome ||
                'pending'
            )}
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

      <section className="panel assessment-section">

        <div className="assessment-section-title">
          <div className="profile-card-icon">
            <ClipboardCheck
              size={20}
            />
          </div>

          <div>
            <h3>
              Assessor Declaration
            </h3>
          </div>
        </div>

        <div className="record-text-block">

          <p>
            This report records the
            functional capacity findings
            obtained during the assessment
            and compares recorded worker
            performance with the job-demand
            information available within
            SpineSync.
          </p>

          <p>
            The final outcome documented
            above represents the assessor's
            recorded professional decision.
            Functional test results should
            be interpreted together with
            the worker's clinical
            presentation, occupational
            requirements and other relevant
            medical or occupational-health
            information.
          </p>

        </div>

        <div className="record-details-grid">

          <div>
            <span>
              Assessor
            </span>

            <strong>
              Registered healthcare
              professional
            </strong>
          </div>

          <div>
            <span>
              Assessment date
            </span>

            <strong>
              {formatDate(
                assessment.assessment_date
              )}
            </strong>
          </div>

          <div>
            <span>
              Report reference
            </span>

            <strong>
              {reportReference()}
            </strong>
          </div>

          <div>
            <span>
              Platform
            </span>

            <strong>
              SpineSync Enterprise
            </strong>
          </div>

        </div>

      </section>

      <div className="report-footer">
        <strong>
          SPINESYNC ENTERPRISE
        </strong>

        <span>
          Functional Capacity Evaluation
          Report • {reportReference()}
        </span>
      </div>

    </div>
  )
}
