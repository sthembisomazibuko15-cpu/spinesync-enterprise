import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Plus,
  Search,
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

type RehabCase = {
  id: string
  worker_id: string
  assessment_id: string | null
  case_number: string | null
  referral_date: string
  referral_reason: string | null
  primary_condition: string | null
  affected_body_region: string | null
  initial_work_status: string | null
  current_work_status: string | null
  planned_sessions: number | null
  sessions_completed: number
  expected_reassessment_date: string | null
  case_status: string
  created_at: string
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

type RehabRow = RehabCase & {
  worker: Worker | null
  jobProfile: JobProfile | null
}

type StatusFilter =
  | 'all'
  | 'active'
  | 'ready_for_reassessment'
  | 'completed'
  | 'on_hold'

export default function Rehabilitation() {
  const navigate = useNavigate()

  const [cases, setCases] =
    useState<RehabRow[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [search, setSearch] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('all')

  useEffect(() => {
    loadCases()
  }, [])

  async function loadCases() {
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
        referral_date,
        referral_reason,
        primary_condition,
        affected_body_region,
        initial_work_status,
        current_work_status,
        planned_sessions,
        sessions_completed,
        expected_reassessment_date,
        case_status,
        created_at
      `)
      .order('referral_date', {
        ascending: false,
      })
      .order('created_at', {
        ascending: false,
      })

    if (caseError) {
      setError(caseError.message)
      setLoading(false)
      return
    }

    const rehabCases =
      (caseData ?? []) as RehabCase[]

    if (rehabCases.length === 0) {
      setCases([])
      setLoading(false)
      return
    }

    const workerIds = Array.from(
      new Set(
        rehabCases.map(
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

    let jobProfiles: JobProfile[] = []

    if (jobProfileIds.length > 0) {
      const {
        data: jobData,
        error: jobError,
      } = await supabase
        .from('job_profiles')
        .select('id,title')
        .in('id', jobProfileIds)

      if (jobError) {
        setError(jobError.message)
        setLoading(false)
        return
      }

      jobProfiles =
        (jobData ?? []) as JobProfile[]
    }

    const rows =
      rehabCases.map((rehabCase) => {
        const worker =
          workers.find(
            (item) =>
              item.id ===
              rehabCase.worker_id
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
          ...rehabCase,
          worker,
          jobProfile,
        }
      })

    setCases(rows)
    setLoading(false)
  }

  const filteredCases =
    useMemo(() => {
      const query =
        search.trim().toLowerCase()

      return cases.filter(
        (rehabCase) => {
          const statusMatches =
            statusFilter === 'all' ||
            rehabCase.case_status ===
              statusFilter

          if (!statusMatches) {
            return false
          }

          if (!query) {
            return true
          }

          const workerName =
            `${rehabCase.worker?.first_name || ''} ${rehabCase.worker?.last_name || ''}`
              .trim()
              .toLowerCase()

          const employeeNumber =
            rehabCase.worker
              ?.employee_number
              ?.toLowerCase() || ''

          const caseNumber =
            rehabCase.case_number
              ?.toLowerCase() || ''

          const jobTitle =
            rehabCase.jobProfile
              ?.title
              ?.toLowerCase() || ''

          const condition =
            rehabCase.primary_condition
              ?.toLowerCase() || ''

          const bodyRegion =
            rehabCase.affected_body_region
              ?.toLowerCase() || ''

          return (
            workerName.includes(query) ||
            employeeNumber.includes(query) ||
            caseNumber.includes(query) ||
            jobTitle.includes(query) ||
            condition.includes(query) ||
            bodyRegion.includes(query)
          )
        }
      )
    }, [
      cases,
      search,
      statusFilter,
    ])

  const summary =
    useMemo(() => {
      const active =
        cases.filter(
          (item) =>
            item.case_status ===
            'active'
        ).length

      const ready =
        cases.filter(
          (item) =>
            item.case_status ===
            'ready_for_reassessment'
        ).length

      const completed =
        cases.filter(
          (item) =>
            item.case_status ===
            'completed'
        ).length

      const onHold =
        cases.filter(
          (item) =>
            item.case_status ===
            'on_hold'
        ).length

      return {
        total: cases.length,
        active,
        ready,
        completed,
        onHold,
      }
    }, [cases])

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

  function getCaseNumber(
    rehabCase: RehabCase
  ) {
    if (rehabCase.case_number) {
      return rehabCase.case_number
    }

    return `REH-${rehabCase.id
      .slice(0, 8)
      .toUpperCase()}`
  }

  function progressPercent(
    rehabCase: RehabCase
  ) {
    if (
      !rehabCase.planned_sessions ||
      rehabCase.planned_sessions <= 0
    ) {
      return 0
    }

    return Math.min(
      100,
      Math.round(
        (
          rehabCase.sessions_completed /
          rehabCase.planned_sessions
        ) * 100
      )
    )
  }

  function statusClass(
    status: string
  ) {
    if (
      status === 'completed' ||
      status ===
        'ready_for_reassessment'
    ) {
      return 'pass'
    }

    if (
      status === 'on_hold' ||
      status === 'cancelled'
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
          Loading rehabilitation
          cases...
        </p>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>
          <span className="eyebrow">
            RETURN-TO-WORK
          </span>

          <h1>
            Rehabilitation
          </h1>

          <p>
            Manage rehabilitation,
            functional recovery and
            return-to-work progression.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate(
              '/rehabilitation/new'
            )
          }
        >
          <Plus size={16} />
          New Rehab Case
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
            TOTAL CASES
          </span>

          <strong>
            {summary.total}
          </strong>
        </div>

        <div>
          <Activity size={18} />

          <span>
            ACTIVE
          </span>

          <strong>
            {summary.active}
          </strong>
        </div>

        <div>
          <CalendarDays size={18} />

          <span>
            READY FOR REASSESSMENT
          </span>

          <strong>
            {summary.ready}
          </strong>
        </div>

        <div>
          <CheckCircle2 size={18} />

          <span>
            COMPLETED
          </span>

          <strong>
            {summary.completed}
          </strong>
        </div>

        <div>
          <ShieldAlert size={18} />

          <span>
            ON HOLD
          </span>

          <strong>
            {summary.onHold}
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
              flex: '1 1 320px',
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
              placeholder="Search worker, employee number, case, job or condition"
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
              All Cases
            </option>

            <option value="active">
              Active
            </option>

            <option value="ready_for_reassessment">
              Ready for Reassessment
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="on_hold">
              On Hold
            </option>
          </select>

        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Rehabilitation Case
              Register
            </h2>

            <p>
              {filteredCases.length}{' '}
              case
              {filteredCases.length ===
              1
                ? ''
                : 's'}{' '}
              shown
            </p>
          </div>

        </div>

        {filteredCases.length ===
        0 ? (
          <div
            style={{
              padding: '45px 20px',
              textAlign: 'center',
            }}
          >
            <Activity size={34} />

            <h3>
              No rehabilitation cases
              found
            </h3>

            <p>
              Rehabilitation cases will
              appear here once workers
              are referred into the
              return-to-work pathway.
            </p>
          </div>
        ) : (
          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>Case</th>
                  <th>Worker</th>
                  <th>Job Profile</th>
                  <th>
                    Work Status
                  </th>
                  <th>
                    Sessions
                  </th>
                  <th>
                    Reassessment
                  </th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredCases.map(
                  (rehabCase) => {
                    const progress =
                      progressPercent(
                        rehabCase
                      )

                    return (
                      <tr
                        key={
                          rehabCase.id
                        }
                      >

                        <td>
                          <strong>
                            {getCaseNumber(
                              rehabCase
                            )}
                          </strong>

                          <small>
                            Referred{' '}
                            {formatDate(
                              rehabCase.referral_date
                            )}
                          </small>
                        </td>

                        <td>
                          <strong>
                            {rehabCase.worker
                              ? `${rehabCase.worker.first_name} ${rehabCase.worker.last_name}`
                              : 'Worker unavailable'}
                          </strong>

                          <small>
                            {rehabCase
                              .worker
                              ?.employee_number ||
                              'No employee number'}
                          </small>
                        </td>

                        <td>
                          {rehabCase
                            .jobProfile
                            ?.title ||
                            'Not assigned'}
                        </td>

                        <td>
                          {formatLabel(
                            rehabCase.current_work_status ||
                              rehabCase.initial_work_status
                          )}
                        </td>

                        <td>
                          <strong>
                            {
                              rehabCase.sessions_completed
                            }
                            /
                            {rehabCase.planned_sessions ??
                              '—'}
                          </strong>

                          {rehabCase.planned_sessions &&
                          rehabCase.planned_sessions >
                            0 ? (
                            <small>
                              {progress}%
                              completed
                            </small>
                          ) : (
                            <small>
                              Plan not set
                            </small>
                          )}
                        </td>

                        <td>
                          {formatDate(
                            rehabCase.expected_reassessment_date
                          )}
                        </td>

                        <td>
                          <span
                            className={`badge ${statusClass(
                              rehabCase.case_status
                            )}`}
                          >
                            {rehabCase.case_status ===
                            'active' ? (
                              <Clock3
                                size={13}
                              />
                            ) : (
                              <CheckCircle2
                                size={13}
                              />
                            )}

                            {formatLabel(
                              rehabCase.case_status
                            )}
                          </span>
                        </td>

                        <td>
                          <button
                            className="secondary-button"
                            onClick={() =>
                              navigate(
                                `/rehabilitation/${rehabCase.id}`
                              )
                            }
                          >
                            <Eye
                              size={15}
                            />
                            Open Case
                          </button>
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
          Return-to-Work Pathway
        </h2>

        <p>
          Rehabilitation cases track
          workers from referral through
          functional recovery,
          rehabilitation progress and
          reassessment. Final fitness
          decisions remain professional
          clinical and occupational
          determinations rather than
          automated system decisions.
        </p>

      </div>

    </div>
  )
}
