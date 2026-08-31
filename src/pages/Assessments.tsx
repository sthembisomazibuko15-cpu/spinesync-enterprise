import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  Play,
  Plus,
  Search,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'

type Assessment = {
  id: string
  worker_id: string
  assessment_type: string
  assessment_date: string
  assessment_status: string
  final_outcome: string | null
  created_at: string | null
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

type AssessmentRow = Assessment & {
  worker: Worker | null
  jobProfile: JobProfile | null
}

type StatusFilter =
  | 'all'
  | 'in_progress'
  | 'completed'

export default function Assessments() {
  const navigate = useNavigate()

  const [assessments, setAssessments] =
    useState<AssessmentRow[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [search, setSearch] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all')

  useEffect(() => {
    loadAssessments()
  }, [])

  async function loadAssessments() {
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
        assessment_status,
        final_outcome,
        created_at
      `)
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

    if (assessmentError) {
      setError(
        assessmentError.message
      )
      setLoading(false)
      return
    }

    const typedAssessments =
      (assessmentData ??
        []) as Assessment[]

    if (
      typedAssessments.length === 0
    ) {
      setAssessments([])
      setLoading(false)
      return
    }

    const workerIds = Array.from(
      new Set(
        typedAssessments.map(
          (item) => item.worker_id
        )
      )
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
      .in('id', workerIds)

    if (workerError) {
      setError(workerError.message)
      setLoading(false)
      return
    }

    const workers =
      (workerData ?? []) as Worker[]

    const jobProfileIds =
      Array.from(
        new Set(
          workers
            .map(
              (worker) =>
                worker.job_profile_id
            )
            .filter(
              (
                value
              ): value is string =>
                Boolean(value)
            )
        )
      )

    let jobProfiles:
      JobProfile[] = []

    if (
      jobProfileIds.length > 0
    ) {
      const {
        data: jobData,
        error: jobError,
      } = await supabase
        .from('job_profiles')
        .select('id,title')
        .in(
          'id',
          jobProfileIds
        )

      if (jobError) {
        setError(jobError.message)
        setLoading(false)
        return
      }

      jobProfiles =
        (jobData ??
          []) as JobProfile[]
    }

    const rows =
      typedAssessments.map(
        (assessment) => {
          const worker =
            workers.find(
              (item) =>
                item.id ===
                assessment.worker_id
            ) || null

          const jobProfile =
            worker?.job_profile_id
              ? jobProfiles.find(
                  (item) =>
                    item.id ===
                    worker.job_profile_id
                ) || null
              : null

          return {
            ...assessment,
            worker,
            jobProfile,
          }
        }
      )

    setAssessments(rows)
    setLoading(false)
  }

  const filteredAssessments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase()

      return assessments.filter(
        (assessment) => {
          const statusMatches =
            statusFilter === 'all' ||
            assessment
              .assessment_status ===
              statusFilter

          if (!statusMatches) {
            return false
          }

          if (!query) {
            return true
          }

          const workerName =
            `${assessment.worker?.first_name || ''} ${assessment.worker?.last_name || ''}`
              .trim()
              .toLowerCase()

          const employeeNumber =
            assessment.worker
              ?.employee_number
              ?.toLowerCase() || ''

          const jobTitle =
            assessment.jobProfile
              ?.title
              ?.toLowerCase() || ''

          const outcome =
            assessment.final_outcome
              ?.toLowerCase() || ''

          return (
            workerName.includes(
              query
            ) ||
            employeeNumber.includes(
              query
            ) ||
            jobTitle.includes(
              query
            ) ||
            outcome.includes(query)
          )
        }
      )
    }, [
      assessments,
      search,
      statusFilter,
    ])

  const summary = useMemo(() => {
    const total =
      assessments.length

    const completed =
      assessments.filter(
        (item) =>
          item.assessment_status ===
          'completed'
      ).length

    const inProgress =
      assessments.filter(
        (item) =>
          item.assessment_status !==
          'completed'
      ).length

    const restrictions =
      assessments.filter(
        (item) =>
          item.final_outcome ===
          'fit_with_restrictions'
      ).length

    return {
      total,
      completed,
      inProgress,
      restrictions,
    }
  }, [assessments])

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
    value: string
  ) {
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

  function openAssessment(
    assessment: AssessmentRow
  ) {
    if (
      assessment
        .assessment_status ===
      'completed'
    ) {
      navigate(
        `/assessments/${assessment.id}/record`
      )
      return
    }

    navigate(
      `/assessments/${assessment.id}`
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading assessments...
        </p>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>
          <span className="eyebrow">
            FCE MANAGEMENT
          </span>

          <h1>
            Assessments
          </h1>

          <p>
            Track Functional Capacity
            Evaluations from initial
            testing through final
            occupational outcome.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate('/workers')
          }
        >
          <Plus size={16} />
          New Assessment
        </button>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="fce-summary-row">

        <div>
          <span>
            TOTAL ASSESSMENTS
          </span>

          <strong>
            {summary.total}
          </strong>
        </div>

        <div>
          <span>IN PROGRESS</span>

          <strong>
            {summary.inProgress}
          </strong>
        </div>

        <div>
          <span>COMPLETED</span>

          <strong>
            {summary.completed}
          </strong>
        </div>

        <div>
          <span>
            FIT WITH RESTRICTIONS
          </span>

          <strong>
            {summary.restrictions}
          </strong>
        </div>

      </div>

      <div className="panel">

        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >

          <div
            style={{
              position: 'relative',
              flex: '1 1 300px',
            }}
          >
            <Search
              size={17}
              style={{
                position:
                  'absolute',
                left: 12,
                top: '50%',
                transform:
                  'translateY(-50%)',
                opacity: 0.6,
              }}
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search worker, employee number, job profile or outcome"
              style={{
                width: '100%',
                paddingLeft: 40,
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter
              )
            }
          >
            <option value="all">
              All Assessments
            </option>

            <option value="in_progress">
              In Progress
            </option>

            <option value="completed">
              Completed
            </option>
          </select>

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
              Assessment Register
            </h2>

            <p>
              {
                filteredAssessments
                  .length
              }{' '}
              assessment
              {filteredAssessments.length ===
              1
                ? ''
                : 's'}{' '}
              shown
            </p>
          </div>

        </div>

        {filteredAssessments.length ===
        0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <ClipboardCheck
              size={32}
            />

            <h3>
              No assessments found
            </h3>

            <p>
              Start an FCE from a
              worker profile.
            </p>
          </div>
        ) : (
          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>Worker</th>
                  <th>
                    Employee No.
                  </th>
                  <th>Job Profile</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Outcome</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredAssessments.map(
                  (assessment) => (
                    <tr
                      key={
                        assessment.id
                      }
                    >

                      <td>
                        <strong>
                          {assessment
                            .worker
                            ? `${assessment.worker.first_name} ${assessment.worker.last_name}`
                            : 'Worker unavailable'}
                        </strong>

                        <small>
                          {formatLabel(
                            assessment
                              .assessment_type
                          )}
                        </small>
                      </td>

                      <td>
                        {assessment
                          .worker
                          ?.employee_number ||
                          '—'}
                      </td>

                      <td>
                        {assessment
                          .jobProfile
                          ?.title ||
                          'Not assigned'}
                      </td>

                      <td>
                        {formatDate(
                          assessment
                            .assessment_date
                        )}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            assessment
                              .assessment_status ===
                            'completed'
                              ? 'pass'
                              : 'borderline'
                          }`}
                        >
                          {assessment
                            .assessment_status ===
                          'completed' ? (
                            <CheckCircle2
                              size={13}
                            />
                          ) : (
                            <Clock3
                              size={13}
                            />
                          )}

                          {formatLabel(
                            assessment
                              .assessment_status
                          )}
                        </span>
                      </td>

                      <td>
                        {assessment
                          .final_outcome ? (
                          <span
                            className={`badge ${
                              assessment
                                .final_outcome ===
                              'fit'
                                ? 'pass'
                                : assessment
                                      .final_outcome ===
                                    'temporarily_unfit'
                                  ? 'fail'
                                  : 'borderline'
                            }`}
                          >
                            {formatLabel(
                              assessment
                                .final_outcome
                            )}
                          </span>
                        ) : (
                          'Pending'
                        )}
                      </td>

                      <td>
                        <button
                          className="secondary-button"
                          onClick={() =>
                            openAssessment(
                              assessment
                            )
                          }
                        >
                          {assessment
                            .assessment_status ===
                          'completed' ? (
                            <>
                              <Eye
                                size={
                                  15
                                }
                              />
                              View Report
                            </>
                          ) : (
                            <>
                              <Play
                                size={
                                  15
                                }
                              />
                              Continue
                            </>
                          )}
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

    </div>
  )
}
