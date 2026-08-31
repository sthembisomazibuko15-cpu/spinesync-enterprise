import {
  ArrowLeft,
  BriefcaseBusiness,
  ClipboardCheck,
  Printer,
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
  assessor_id: string | null
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
  repetitions: number | null
  duration_seconds: number | null
  movement_quality: string | null
  assistance_required: string | null
  symptoms_reported: string | null
  assessor_rating: string | null
  notes: string | null
}

type NamedItem = {
  id: string
  name: string
}

type JobProfile = {
  id: string
  title: string
  physical_demand_level: string | null
}

type AssessorProfile = {
  id: string
  full_name: string | null
  profession: string | null
  hpcsa_number: string | null
  practice_name: string | null
  phone: string | null
  email: string | null
  signature_url: string | null
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

  const [jobProfile, setJobProfile] =
    useState<JobProfile | null>(null)

  const [assessor, setAssessor] =
    useState<AssessorProfile | null>(null)

  const [signatureSrc, setSignatureSrc] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadRecord()
  }, [id])

  async function loadRecord() {
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
        assessor_id,
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
        pain_before,
        pain_after,
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

    const linkedQueries: PromiseLike<any>[] = []

    if (typedWorker.operation_id) {
      linkedQueries.push(
        supabase
          .from('operations')
          .select('id,name')
          .eq(
            'id',
            typedWorker.operation_id
          )
          .maybeSingle()
      )
    } else {
      linkedQueries.push(
        Promise.resolve({
          data: null,
          error: null,
        })
      )
    }

    if (typedWorker.site_id) {
      linkedQueries.push(
        supabase
          .from('sites')
          .select('id,name')
          .eq(
            'id',
            typedWorker.site_id
          )
          .maybeSingle()
      )
    } else {
      linkedQueries.push(
        Promise.resolve({
          data: null,
          error: null,
        })
      )
    }

    if (typedWorker.department_id) {
      linkedQueries.push(
        supabase
          .from('departments')
          .select('id,name')
          .eq(
            'id',
            typedWorker.department_id
          )
          .maybeSingle()
      )
    } else {
      linkedQueries.push(
        Promise.resolve({
          data: null,
          error: null,
        })
      )
    }

    if (typedWorker.job_profile_id) {
      linkedQueries.push(
        supabase
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
      )
    } else {
      linkedQueries.push(
        Promise.resolve({
          data: null,
          error: null,
        })
      )
    }

    const [
      operationResponse,
      siteResponse,
      departmentResponse,
      jobResponse,
    ] = await Promise.all(
      linkedQueries
    )

    setOperation(
      operationResponse.data as
        | NamedItem
        | null
    )

    setSite(
      siteResponse.data as
        | NamedItem
        | null
    )

    setDepartment(
      departmentResponse.data as
        | NamedItem
        | null
    )

    setJobProfile(
      jobResponse.data as
        | JobProfile
        | null
    )

    if (typedAssessment.assessor_id) {
      const {
        data: assessorData,
        error: assessorError,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          profession,
          hpcsa_number,
          practice_name,
          phone,
          email,
          signature_url
        `)
        .eq(
          'id',
          typedAssessment.assessor_id
        )
        .maybeSingle()

      if (!assessorError && assessorData) {
        const typedAssessor =
          assessorData as AssessorProfile

        setAssessor(typedAssessor)

        if (typedAssessor.signature_url) {
          const {
            data: signedData,
            error: signedError,
          } = await supabase.storage
            .from('signatures')
            .createSignedUrl(
              typedAssessor.signature_url,
              3600
            )

          if (
            !signedError &&
            signedData?.signedUrl
          ) {
            setSignatureSrc(
              signedData.signedUrl
            )
          }
        }
      }
    }

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

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return 'Not recorded'
    }

    return new Date(value).toLocaleDateString(
      'en-ZA',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  function displayValue(
    value:
      | string
      | number
      | null
      | undefined
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 'Not recorded'
    }

    return String(value)
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
      : 'Not recorded'
  }

  const reportReference =
    assessment
      ? `FCE-${assessment.id
          .slice(0, 8)
          .toUpperCase()}`
      : ''

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Loading FCE report...</p>
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
            'Unable to load FCE report.'}
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

  return (
    <div className="stack">

      <div className="page-heading no-print">

        <div>
          <span className="eyebrow">
            COMPLETED ASSESSMENT
          </span>

          <h1>
            Functional Capacity
            Evaluation Report
          </h1>

          <p>
            Review or print the completed
            assessment record.
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
                `/workers/${worker.id}`
              )
            }
          >
            <ArrowLeft size={16} />
            Worker
          </button>

          <button
            className="primary-button"
            onClick={() =>
              window.print()
            }
          >
            <Printer size={16} />
            Print Report
          </button>
        </div>

      </div>

      <div className="fce-report">

        {/* PAGE 1 */}

        <section className="fce-report-page">

          <header className="fce-report-header">

            <div>
              <span className="eyebrow">
                SPINESYNC ENTERPRISE
              </span>

              <h1>
                Functional Capacity
                Evaluation
              </h1>

              <p>
                Occupational Functional
                Capacity Report
              </p>
            </div>

            <div>
              <strong>
                {reportReference}
              </strong>

              <span>
                {formatDate(
                  assessment.assessment_date
                )}
              </span>
            </div>

          </header>

          <div className="assessment-section-title">

            <div className="assessment-section-icon">
              <ClipboardCheck size={18} />
            </div>

            <div>
              <h2>
                Worker Identification
              </h2>
            </div>

          </div>

          <div className="fce-info-table">

            <div>
              <span>Worker Name</span>
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
              <span>Sex</span>
              <strong>
                {formatLabel(worker.sex)}
              </strong>
            </div>

            <div>
              <span>
                Employment Status
              </span>
              <strong>
                {formatLabel(
                  worker.employment_status
                )}
              </strong>
            </div>

            <div>
              <span>
                Current Fitness Status
              </span>
              <strong>
                {formatLabel(
                  worker.fitness_status
                )}
              </strong>
            </div>

          </div>

          <div className="assessment-section-title">

            <div className="assessment-section-icon">
              <BriefcaseBusiness
                size={18}
              />
            </div>

            <div>
              <h2>
                Occupational Placement
              </h2>
            </div>

          </div>

          <div className="fce-info-table">

            <div>
              <span>
                Mining Operation
              </span>
              <strong>
                {operation?.name ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <span>Site / Shaft</span>
              <strong>
                {site?.name ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <span>Department</span>
              <strong>
                {department?.name ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <span>Job Profile</span>
              <strong>
                {jobProfile?.title ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <span>
                Physical Demand Level
              </span>
              <strong>
                {formatLabel(
                  jobProfile
                    ?.physical_demand_level
                )}
              </strong>
            </div>

          </div>

          <div className="assessment-section-title">
            <div>
              <h2>
                Assessment Information
              </h2>
            </div>
          </div>

          <div className="fce-info-table">

            <div>
              <span>
                Assessment Type
              </span>
              <strong>
                {formatLabel(
                  assessment.assessment_type
                )}
              </strong>
            </div>

            <div>
              <span>
                Assessment Date
              </span>
              <strong>
                {formatDate(
                  assessment.assessment_date
                )}
              </strong>
            </div>

            <div>
              <span>
                Assessment Status
              </span>
              <strong>
                {formatLabel(
                  assessment.assessment_status
                )}
              </strong>
            </div>

            <div>
              <span>
                Referral Reason
              </span>
              <strong>
                {displayValue(
                  assessment.referral_reason
                )}
              </strong>
            </div>

          </div>

          <div className="assessment-section-title">
            <div>
              <h2>
                Pre-Test Clinical
                Screening
              </h2>
            </div>
          </div>

          <div className="fce-info-table">

            <div>
              <span>Pain Score</span>
              <strong>
                {assessment.pain_score !==
                null
                  ? `${assessment.pain_score}/10`
                  : 'Not recorded'}
              </strong>
            </div>

            <div>
              <span>Blood Pressure</span>
              <strong>
                {assessment.systolic_bp !==
                  null &&
                assessment.diastolic_bp !==
                  null
                  ? `${assessment.systolic_bp}/${assessment.diastolic_bp} mmHg`
                  : 'Not recorded'}
              </strong>
            </div>

            <div>
              <span>
                Resting Heart Rate
              </span>
              <strong>
                {assessment.resting_hr !==
                null
                  ? `${assessment.resting_hr} bpm`
                  : 'Not recorded'}
              </strong>
            </div>

            <div>
              <span>Height</span>
              <strong>
                {assessment.height_cm !==
                null
                  ? `${assessment.height_cm} cm`
                  : 'Not recorded'}
              </strong>
            </div>

            <div>
              <span>Weight</span>
              <strong>
                {assessment.weight_kg !==
                null
                  ? `${assessment.weight_kg} kg`
                  : 'Not recorded'}
              </strong>
            </div>

            <div>
              <span>BMI</span>
              <strong>
                {displayValue(
                  assessment.bmi
                )}
              </strong>
            </div>

            <div>
              <span>
                Pre-Test Status
              </span>
              <strong>
                {formatLabel(
                  assessment.pre_test_status
                )}
              </strong>
            </div>

          </div>

          <div className="assessment-section-title">
            <div>
              <h2>
                Final Assessor Outcome
              </h2>
            </div>
          </div>

          <div className="fce-decision-card">

            <div>
              <span>
                FINAL OUTCOME
              </span>

              <h2>
                {formatLabel(
                  assessment.final_outcome
                )}
              </h2>
            </div>

          </div>

          <div className="fce-info-table">

            <div>
              <span>Restrictions</span>
              <strong>
                {displayValue(
                  assessment.restrictions
                )}
              </strong>
            </div>

            <div>
              <span>
                Recommendations
              </span>
              <strong>
                {displayValue(
                  assessment.recommendations
                )}
              </strong>
            </div>

          </div>

          <footer className="fce-report-footer">
            <span>
              {reportReference}
            </span>

            <span>Page 1 of 2</span>
          </footer>

        </section>

        {/* PAGE 2 */}

        <section className="fce-report-page">

          <header className="fce-report-header compact">

            <div>
              <span className="eyebrow">
                SPINESYNC ENTERPRISE
              </span>

              <h2>
                Functional Test Results
              </h2>
            </div>

            <div>
              <strong>
                {worker.first_name}{' '}
                {worker.last_name}
              </strong>

              <span>
                {worker.employee_number}
              </span>
            </div>

          </header>

          <div className="assessment-section-title">
            <div>
              <h2>
                Functional Capacity
                Summary
              </h2>
            </div>
          </div>

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
              <span>BORDERLINE</span>
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

          </div>

          <div className="assessment-section-title">
            <div>
              <h2>
                Functional Test Results
              </h2>
            </div>
          </div>

          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>Test</th>
                  <th>Performance</th>
                  <th>Requirement</th>
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

                        <small>
                          {formatLabel(
                            item.test_category
                          )}
                        </small>
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

                        {item.notes && (
                          <small>
                            Notes:{' '}
                            {item.notes}
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
                          : item.assessor_rating
                            ? 'Assessor-rated'
                            : 'Not specified'}
                      </td>

                      <td>
                        <strong>
                          {formatLabel(
                            item.result
                          )}
                        </strong>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

          <div className="assessment-section-title">
            <div>
              <h2>
                Identified Capacity Gaps
              </h2>
            </div>
          </div>

          {analysis.numericGaps.length ===
          0 ? (
            <p>
              No numeric job-demand
              capacity gaps were identified.
            </p>
          ) : (
            <div className="stack">

              {analysis.numericGaps.map(
                (item) => (
                  <div
                    className="fce-full-row"
                    key={item.id}
                  >
                    <strong>
                      {item.test_name}
                    </strong>

                    <p>
                      Measured capacity:{' '}
                      {item.measured_value}{' '}
                      {item.unit || ''}
                    </p>

                    <p>
                      Job requirement:{' '}
                      {item.required_value}{' '}
                      {item.unit || ''}
                    </p>

                    <p>
                      Capacity gap:{' '}
                      {(
                        Number(
                          item.required_value
                        ) -
                        Number(
                          item.measured_value
                        )
                      ).toFixed(1)}{' '}
                      {item.unit || ''}
                    </p>
                  </div>
                )
              )}

            </div>
          )}

          {analysis.functionalConcerns.length >
            0 && (
            <>
              <div className="assessment-section-title">
                <div>
                  <h2>
                    Functional Concerns
                  </h2>
                </div>
              </div>

              <div className="stack">

                {analysis.functionalConcerns.map(
                  (item) => (
                    <div
                      className="fce-full-row"
                      key={item.id}
                    >
                      <strong>
                        {item.test_name}
                      </strong>

                      <p>
                        Rating:{' '}
                        {formatLabel(
                          item.assessor_rating ||
                            item.result
                        )}
                      </p>

                      {item.repetitions !==
                        null && (
                        <p>
                          Repetitions:{' '}
                          {item.repetitions}
                        </p>
                      )}

                      {item.duration_seconds !==
                        null && (
                        <p>
                          Duration:{' '}
                          {
                            item.duration_seconds
                          }{' '}
                          seconds
                        </p>
                      )}

                      {item
                        .movement_quality && (
                        <p>
                          Movement quality:{' '}
                          {formatLabel(
                            item
                              .movement_quality
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
            </>
          )}

          <div className="assessment-section-title">
            <div>
              <h2>
                Clinical Decision
              </h2>
            </div>
          </div>

          <div className="fce-info-table">

            <div>
              <span>Final Outcome</span>
              <strong>
                {formatLabel(
                  assessment.final_outcome
                )}
              </strong>
            </div>

            <div>
              <span>Restrictions</span>
              <strong>
                {displayValue(
                  assessment.restrictions
                )}
              </strong>
            </div>

            <div>
              <span>
                Recommendations
              </span>
              <strong>
                {displayValue(
                  assessment.recommendations
                )}
              </strong>
            </div>

          </div>

          <div className="assessment-section-title">
            <div>
              <h2>
                Assessor Declaration
              </h2>
            </div>
          </div>

          <p>
            This report records the
            functional capacity findings
            obtained during the assessment
            and compares measured
            performance with available
            job-demand information.
            Functional task ratings reflect
            the assessor's observations of
            performance, movement quality,
            assistance requirements,
            symptoms and other relevant
            clinical findings. The final
            fitness outcome remains the
            professional determination of
            the assessor and should be
            interpreted together with the
            worker's clinical presentation,
            occupational requirements and
            relevant occupational health
            information.
          </p>

          <div
            style={{
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns:
                '1fr 1fr',
              gap: 24,
            }}
          >

            <div>
              <span className="eyebrow">
                ASSESSOR
              </span>

              <p>
                <strong>
                  {assessor?.full_name ||
                    'Not recorded'}
                </strong>
              </p>

              <p>
                {assessor?.profession ||
                  'Registered Healthcare Professional'}
              </p>

              <p>
                HPCSA:{' '}
                {assessor?.hpcsa_number ||
                  'Not recorded'}
              </p>

              <p>
                {assessor?.practice_name ||
                  ''}
              </p>
            </div>

            <div>
              <span className="eyebrow">
                SIGNATURE
              </span>

              {signatureSrc ? (
                <div
                  style={{
                    marginTop: 8,
                    minHeight: 65,
                  }}
                >
                  <img
                    src={signatureSrc}
                    alt="Assessor signature"
                    style={{
                      width: 150,
                      height: 55,
                      objectFit: 'contain',
                      objectPosition:
                        'left center',
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    marginTop: 30,
                    width: 170,
                    borderBottom:
                      '1px solid #222',
                  }}
                />
              )}

              <p>
                Date:{' '}
                {formatDate(
                  assessment.assessment_date
                )}
              </p>
            </div>

          </div>

          <footer className="fce-report-footer">
            <span>
              {reportReference}
            </span>

            <span>Page 2 of 2</span>
          </footer>

        </section>

      </div>

    </div>
  )
}
