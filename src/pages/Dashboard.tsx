import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BriefcaseMedical,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  RefreshCw,
  ShieldAlert,
  Users,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  fitness_status: string | null
  operation_id: string | null
  site_id: string | null
  department_id: string | null
  job_profile_id: string | null
  employment_status: string | null
}

type Assessment = {
  id: string
  worker_id: string
  assessment_date: string
  assessment_status: string
  final_outcome: string | null
  assessment_phase: string | null
  created_at: string
}

type RehabCase = {
  id: string
  worker_id: string
  case_number: string | null
  case_status: string
  current_work_status: string | null
  sessions_completed: number
  planned_sessions: number | null
  discharge_outcome: string | null
  referral_date: string
}

type FceResult = {
  id: string
  assessment_id: string
  test_name: string
  result: string | null
  assessor_rating: string | null
}

type RecentAssessment = Assessment & {
  workerName: string
  employeeNumber: string
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [workers, setWorkers] =
    useState<Worker[]>([])

  const [assessments, setAssessments] =
    useState<Assessment[]>([])

  const [rehabCases, setRehabCases] =
    useState<RehabCase[]>([])

  const [fceResults, setFceResults] =
    useState<FceResult[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError(null)

    const [
      workersResponse,
      assessmentsResponse,
      rehabResponse,
      resultsResponse,
    ] = await Promise.all([
      supabase
        .from('workers')
        .select(`
          id,
          employee_number,
          first_name,
          last_name,
          fitness_status,
          operation_id,
          site_id,
          department_id,
          job_profile_id,
          employment_status
        `),

      supabase
        .from('assessments')
        .select(`
          id,
          worker_id,
          assessment_date,
          assessment_status,
          final_outcome,
          assessment_phase,
          created_at
        `)
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('rehabilitation_cases')
        .select(`
          id,
          worker_id,
          case_number,
          case_status,
          current_work_status,
          sessions_completed,
          planned_sessions,
          discharge_outcome,
          referral_date
        `)
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('fce_results')
        .select(`
          id,
          assessment_id,
          test_name,
          result,
          assessor_rating
        `),
    ])

    if (workersResponse.error) {
      setError(
        workersResponse.error.message
      )
      setLoading(false)
      return
    }

    if (assessmentsResponse.error) {
      setError(
        assessmentsResponse.error.message
      )
      setLoading(false)
      return
    }

    if (rehabResponse.error) {
      setError(
        rehabResponse.error.message
      )
      setLoading(false)
      return
    }

    if (resultsResponse.error) {
      setError(
        resultsResponse.error.message
      )
      setLoading(false)
      return
    }

    setWorkers(
      (workersResponse.data ??
        []) as Worker[]
    )

    setAssessments(
      (assessmentsResponse.data ??
        []) as Assessment[]
    )

    setRehabCases(
      (rehabResponse.data ??
        []) as RehabCase[]
    )

    setFceResults(
      (resultsResponse.data ??
        []) as FceResult[]
    )

    setLoading(false)
  }

  const workerMap = useMemo(() => {
    const map =
      new Map<string, Worker>()

    workers.forEach((worker) => {
      map.set(worker.id, worker)
    })

    return map
  }, [workers])

  const activeWorkers =
    useMemo(
      () =>
        workers.filter(
          (worker) =>
            worker.employment_status !==
            'inactive'
        ).length,
      [workers]
    )

  const completedAssessments =
    useMemo(
      () =>
        assessments.filter(
          (assessment) =>
            assessment.assessment_status ===
            'completed'
        ),
      [assessments]
    )

  const assessmentsInProgress =
    useMemo(
      () =>
        assessments.filter(
          (assessment) =>
            assessment.assessment_status !==
            'completed'
        ).length,
      [assessments]
    )

  const restrictedWorkers =
    useMemo(
      () =>
        workers.filter(
          (worker) =>
            worker.fitness_status ===
              'fit_with_restrictions' ||
            worker.fitness_status ===
              'temporarily_unfit'
        ).length,
      [workers]
    )

  const activeRehabCases =
    useMemo(
      () =>
        rehabCases.filter(
          (item) =>
            item.case_status ===
              'active' ||
            item.case_status ===
              'ready_for_reassessment' ||
            item.case_status ===
              'on_hold'
        ),
      [rehabCases]
    )

  const readyForReassessment =
    useMemo(
      () =>
        rehabCases.filter(
          (item) =>
            item.case_status ===
            'ready_for_reassessment'
        ).length,
      [rehabCases]
    )

  const completedRehabCases =
    useMemo(
      () =>
        rehabCases.filter(
          (item) =>
            item.case_status ===
            'completed'
        ),
      [rehabCases]
    )

  const fullDutyReturns =
    useMemo(
      () =>
        completedRehabCases.filter(
          (item) =>
            item.discharge_outcome ===
            'return_to_full_duty'
        ).length,
      [completedRehabCases]
    )

  const modifiedDutyReturns =
    useMemo(
      () =>
        completedRehabCases.filter(
          (item) =>
            item.discharge_outcome ===
            'return_to_modified_duty'
        ).length,
      [completedRehabCases]
    )

  const recentAssessments =
    useMemo(() => {
      return assessments
        .slice(0, 6)
        .map((assessment) => {
          const worker =
            workerMap.get(
              assessment.worker_id
            )

          return {
            ...assessment,

            workerName: worker
              ? `${worker.first_name} ${worker.last_name}`
              : 'Unknown Worker',

            employeeNumber:
              worker?.employee_number ||
              '—',
          }
        }) as RecentAssessment[]
    }, [
      assessments,
      workerMap,
    ])

  const outcomeSummary =
    useMemo(() => {
      const values = {
        fit: 0,
        restricted: 0,
        temporarilyUnfit: 0,
        rehabilitation: 0,
        reassessment: 0,
      }

      completedAssessments.forEach(
        (assessment) => {
          switch (
            assessment.final_outcome
          ) {
            case 'fit':
              values.fit += 1
              break

            case 'fit_with_restrictions':
              values.restricted += 1
              break

            case 'temporarily_unfit':
              values.temporarilyUnfit += 1
              break

            case 'rehabilitation':
              values.rehabilitation += 1
              break

            case 'reassessment_required':
              values.reassessment += 1
              break
          }
        }
      )

      return values
    }, [completedAssessments])

  const functionalConcerns =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            testName: string
            total: number
            borderline: number
            failed: number
          }
        >()

      fceResults.forEach(
        (result) => {
          const rating =
            result.assessor_rating ||
            result.result

          if (
            rating !== 'fail' &&
            rating !== 'borderline'
          ) {
            return
          }

          const current =
            map.get(
              result.test_name
            ) || {
              testName:
                result.test_name,
              total: 0,
              borderline: 0,
              failed: 0,
            }

          current.total += 1

          if (
            rating === 'borderline'
          ) {
            current.borderline += 1
          }

          if (rating === 'fail') {
            current.failed += 1
          }

          map.set(
            result.test_name,
            current
          )
        }
      )

      return Array.from(
        map.values()
      )
        .sort(
          (a, b) =>
            b.total - a.total
        )
        .slice(0, 5)
    }, [fceResults])

  const rehabCompletionRate =
    completedRehabCases.length +
      activeRehabCases.length >
    0
      ? Math.round(
          (completedRehabCases.length /
            (completedRehabCases.length +
              activeRehabCases.length)) *
            100
        )
      : 0

  const assessmentCompletionRate =
    assessments.length > 0
      ? Math.round(
          (completedAssessments.length /
            assessments.length) *
            100
        )
      : 0

  function formatLabel(
    value:
      | string
      | null
      | undefined
  ) {
    if (!value) {
      return 'Not Recorded'
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
          Loading enterprise
          dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>
          <span className="eyebrow">
            SPINESYNC ENTERPRISE
          </span>

          <h1>
            Enterprise Dashboard
          </h1>

          <p>
            Live workforce functional
            capacity, rehabilitation and
            return-to-work overview.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadDashboard}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="fce-summary-row">

        <div>
          <Users size={18} />

          <span>
            ACTIVE WORKERS
          </span>

          <strong>
            {activeWorkers}
          </strong>
        </div>

        <div>
          <ClipboardCheck
            size={18}
          />

          <span>
            FCE IN PROGRESS
          </span>

          <strong>
            {assessmentsInProgress}
          </strong>
        </div>

        <div>
          <ShieldAlert size={18} />

          <span>
            RESTRICTED / UNFIT
          </span>

          <strong>
            {restrictedWorkers}
          </strong>
        </div>

        <div>
          <HeartPulse size={18} />

          <span>
            IN REHABILITATION
          </span>

          <strong>
            {activeRehabCases.length}
          </strong>
        </div>

      </div>

      <div className="panel">

        <h2>
          Workforce Functional
          Status
        </h2>

        <p>
          Current outcomes from completed
          functional capacity
          assessments.
        </p>

        <div
          className="fce-summary-row"
          style={{
            marginTop: 20,
          }}
        >

          <div>
            <CheckCircle2 size={18} />

            <span>FIT</span>

            <strong>
              {outcomeSummary.fit}
            </strong>
          </div>

          <div>
            <AlertTriangle
              size={18}
            />

            <span>
              FIT WITH RESTRICTIONS
            </span>

            <strong>
              {
                outcomeSummary.restricted
              }
            </strong>
          </div>

          <div>
            <ShieldAlert size={18} />

            <span>
              TEMPORARILY UNFIT
            </span>

            <strong>
              {
                outcomeSummary.temporarilyUnfit
              }
            </strong>
          </div>

          <div>
            <HeartPulse size={18} />

            <span>
              REFERRED TO REHAB
            </span>

            <strong>
              {
                outcomeSummary.rehabilitation
              }
            </strong>
          </div>

        </div>

      </div>

      <div className="panel">

        <h2>
          Rehabilitation &
          Return-to-Work
        </h2>

        <div className="form-grid">

          <label>
            <span>
              Active Rehabilitation Cases
            </span>

            <input
              value={
                activeRehabCases.length
              }
              disabled
            />
          </label>

          <label>
            <span>
              Ready for Reassessment
            </span>

            <input
              value={
                readyForReassessment
              }
              disabled
            />
          </label>

          <label>
            <span>
              Completed Cases
            </span>

            <input
              value={
                completedRehabCases.length
              }
              disabled
            />
          </label>

          <label>
            <span>
              Rehab Completion Rate
            </span>

            <input
              value={`${rehabCompletionRate}%`}
              disabled
            />
          </label>

          <label>
            <span>
              Returned to Full Duty
            </span>

            <input
              value={fullDutyReturns}
              disabled
            />
          </label>

          <label>
            <span>
              Returned to Modified Duty
            </span>

            <input
              value={
                modifiedDutyReturns
              }
              disabled
            />
          </label>

        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate(
              '/rehabilitation'
            )
          }
          style={{
            marginTop: 20,
          }}
        >
          Open Rehabilitation
          <ArrowRight size={16} />
        </button>

      </div>

      <div className="panel">

        <h2>
          Assessment Performance
        </h2>

        <div className="form-grid">

          <label>
            <span>
              Total Assessments
            </span>

            <input
              value={
                assessments.length
              }
              disabled
            />
          </label>

          <label>
            <span>
              Completed FCEs
            </span>

            <input
              value={
                completedAssessments.length
              }
              disabled
            />
          </label>

          <label>
            <span>
              Assessment Completion Rate
            </span>

            <input
              value={`${assessmentCompletionRate}%`}
              disabled
            />
          </label>

          <label>
            <span>
              Reassessment Required
            </span>

            <input
              value={
                outcomeSummary.reassessment
              }
              disabled
            />
          </label>

        </div>

      </div>

      <div className="panel">

        <h2>
          Common Functional
          Difficulties
        </h2>

        <p>
          Most frequently recorded
          borderline or failed FCE test
          classifications.
        </p>

        {functionalConcerns.length ===
        0 ? (
          <p
            style={{
              marginTop: 20,
            }}
          >
            No functional concerns have
            been recorded yet.
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
                  <th>Functional Test</th>
                  <th>Borderline</th>
                  <th>Failed</th>
                  <th>
                    Total Concerns
                  </th>
                </tr>
              </thead>

              <tbody>

                {functionalConcerns.map(
                  (item) => (
                    <tr
                      key={
                        item.testName
                      }
                    >
                      <td>
                        <strong>
                          {
                            item.testName
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          item.borderline
                        }
                      </td>

                      <td>
                        {item.failed}
                      </td>

                      <td>
                        {item.total}
                      </td>
                    </tr>
                  )
                )}

              </tbody>

            </table>
          </div>
        )}

      </div>

      <div className="panel">

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            gap: 20,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2>
              Recent Assessments
            </h2>

            <p>
              Latest functional capacity
              assessments recorded in
              SpineSync.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                '/assessments'
              )
            }
          >
            View All
            <ArrowRight size={16} />
          </button>
        </div>

        {recentAssessments.length ===
        0 ? (
          <p
            style={{
              marginTop: 20,
            }}
          >
            No assessments have been
            recorded yet.
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
                  <th>Worker</th>
                  <th>Employee No.</th>
                  <th>Date</th>
                  <th>Phase</th>
                  <th>Status</th>
                  <th>Outcome</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {recentAssessments.map(
                  (assessment) => (
                    <tr
                      key={
                        assessment.id
                      }
                    >
                      <td>
                        <strong>
                          {
                            assessment.workerName
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          assessment.employeeNumber
                        }
                      </td>

                      <td>
                        {formatDate(
                          assessment.assessment_date
                        )}
                      </td>

                      <td>
                        {formatLabel(
                          assessment.assessment_phase
                        )}
                      </td>

                      <td>
                        {formatLabel(
                          assessment.assessment_status
                        )}
                      </td>

                      <td>
                        {formatLabel(
                          assessment.final_outcome
                        )}
                      </td>

                      <td>
                        <button
                          className="secondary-button"
                          onClick={() =>
                            navigate(
                              assessment.assessment_status ===
                                'completed'
                                ? `/assessments/${assessment.id}/record`
                                : `/assessments/${assessment.id}`
                            )
                          }
                        >
                          {assessment.assessment_status ===
                          'completed'
                            ? 'View'
                            : 'Continue'}
                        </button>
                      </td>
                    </tr>
                  )
                )}

              </tbody>

            </table>
          </div>
        )}

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <BriefcaseMedical
              size={20}
            />
          </div>

          <div>
            <h2>
              Management Interpretation
            </h2>

            <p>
              Enterprise MSK and
              functional-capacity
              surveillance.
            </p>
          </div>

        </div>

        <p>
          Dashboard indicators are
          generated from recorded
          workforce, FCE and
          rehabilitation data. They are
          intended to support operational
          planning, rehabilitation
          monitoring and occupational
          health surveillance. Aggregate
          indicators do not independently
          determine an individual
          worker's medical or occupational
          fitness.
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
              navigate('/workers')
            }
          >
            <Users size={16} />
            Workers
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                '/assessments'
              )
            }
          >
            <ClipboardCheck
              size={16}
            />
            Assessments
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                '/rehabilitation'
              )
            }
          >
            <Activity size={16} />
            Rehabilitation
          </button>

          <button
            className="primary-button"
            onClick={() =>
              navigate('/reports')
            }
          >
            Reports
            <ArrowRight size={16} />
          </button>
        </div>

      </div>

    </div>
  )
}
