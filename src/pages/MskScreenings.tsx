import {
  Activity,
  AlertTriangle,
  CalendarDays,
  ClipboardPlus,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import { supabase } from '../lib/supabase'

type Screening = {
  id: string
  worker_id: string
  screening_date: string
  screening_type: string
  overall_risk_level: string | null
  screening_status: string
  current_msk_complaint: boolean
  intervention_required: boolean
  reassessment_required: boolean
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
  job_code: string | null
  description: string | null
}

type ScreeningRow = Screening & {
  worker: Worker | null
  jobProfile: JobProfile | null
}

export default function MskScreenings() {
  const navigate = useNavigate()

  const [screenings, setScreenings] =
    useState<Screening[]>([])

  const [workers, setWorkers] =
    useState<Worker[]>([])

  const [jobProfiles, setJobProfiles] =
    useState<JobProfile[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [search, setSearch] =
    useState('')

  const [riskFilter, setRiskFilter] =
    useState('all')

  const [statusFilter, setStatusFilter] =
    useState('all')

  useEffect(() => {
    loadScreenings()
  }, [])

  async function loadScreenings() {
    setLoading(true)
    setError(null)

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser()

    if (
      userError ||
      !userData.user
    ) {
      setError(
        'Unable to identify the signed-in user.'
      )
      setLoading(false)
      return
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('organisation_id')
      .eq(
        'id',
        userData.user.id
      )
      .single()

    if (
      profileError ||
      !profileData?.organisation_id
    ) {
      setError(
        profileError?.message ||
          'Organisation could not be identified.'
      )
      setLoading(false)
      return
    }

    const organisationId =
      profileData.organisation_id

    const [
      screeningsResponse,
      workersResponse,
      jobProfilesResponse,
    ] = await Promise.all([
      supabase
        .from('msk_screenings')
        .select(`
          id,
          worker_id,
          screening_date,
          screening_type,
          overall_risk_level,
          screening_status,
          current_msk_complaint,
          intervention_required,
          reassessment_required
        `)
        .eq(
          'organisation_id',
          organisationId
        )
        .order(
          'screening_date',
          {
            ascending: false,
          }
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        ),

      supabase
        .from('workers')
        .select(`
          id,
          employee_number,
          first_name,
          last_name,
          job_profile_id
        `)
        .eq(
          'organisation_id',
          organisationId
        ),

      supabase
        .from('job_profiles')
        .select(`
          id,
          job_code,
          description
        `)
        .eq(
          'organisation_id',
          organisationId
        ),
    ])

    if (screeningsResponse.error) {
      setError(
        screeningsResponse.error.message
      )
      setLoading(false)
      return
    }

    if (workersResponse.error) {
      setError(
        workersResponse.error.message
      )
      setLoading(false)
      return
    }

    if (jobProfilesResponse.error) {
      setError(
        jobProfilesResponse.error.message
      )
      setLoading(false)
      return
    }

    setScreenings(
      (screeningsResponse.data ??
        []) as Screening[]
    )

    setWorkers(
      (workersResponse.data ??
        []) as Worker[]
    )

    setJobProfiles(
      (jobProfilesResponse.data ??
        []) as JobProfile[]
    )

    setLoading(false)
  }

  const screeningRows =
    useMemo<ScreeningRow[]>(() => {
      return screenings.map(
        (screening) => {
          const worker =
            workers.find(
              (item) =>
                item.id ===
                screening.worker_id
            ) || null

          const jobProfile =
            worker?.job_profile_id
              ? jobProfiles.find(
                  (profile) =>
                    profile.id ===
                    worker.job_profile_id
                ) || null
              : null

          return {
            ...screening,
            worker,
            jobProfile,
          }
        }
      )
    }, [
      screenings,
      workers,
      jobProfiles,
    ])

  const filteredRows =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase()

      return screeningRows.filter(
        (row) => {
          if (
            riskFilter !== 'all' &&
            row.overall_risk_level !==
              riskFilter
          ) {
            return false
          }

          if (
            statusFilter !== 'all' &&
            row.screening_status !==
              statusFilter
          ) {
            return false
          }

          if (!term) {
            return true
          }

          const searchable = [
            row.worker?.first_name,
            row.worker?.last_name,
            row.worker
              ?.employee_number,
            row.jobProfile?.job_code,
            row.jobProfile
              ?.description,
            row.screening_type,
            row.overall_risk_level,
            row.screening_status,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchable.includes(
            term
          )
        }
      )
    }, [
      screeningRows,
      search,
      riskFilter,
      statusFilter,
    ])

  const summary =
    useMemo(() => {
      return {
        total: screenings.length,

        highRisk:
          screenings.filter(
            (screening) =>
              screening
                .overall_risk_level ===
                'high' ||
              screening
                .overall_risk_level ===
                'very_high'
          ).length,

        symptomatic:
          screenings.filter(
            (screening) =>
              screening.current_msk_complaint
          ).length,

        intervention:
          screenings.filter(
            (screening) =>
              screening
                .intervention_required
          ).length,
      }
    }, [screenings])

  function formatLabel(
    value:
      | string
      | null
      | undefined
  ) {
    if (!value) {
      return 'Not assessed'
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

  function riskBadgeClass(
    risk:
      | string
      | null
  ) {
    if (
      risk === 'high' ||
      risk === 'very_high'
    ) {
      return 'status-badge status-danger'
    }

    if (risk === 'moderate') {
      return 'status-badge status-warning'
    }

    if (risk === 'low') {
      return 'status-badge status-success'
    }

    return 'status-badge'
  }

  function statusBadgeClass(
    status: string
  ) {
    if (status === 'completed') {
      return 'status-badge status-success'
    }

    if (status === 'referred') {
      return 'status-badge status-warning'
    }

    return 'status-badge'
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading MSK screenings...
        </p>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            MSK PREVENTION
          </span>

          <h1>
            MSK Screenings
          </h1>

          <p>
            Detect early musculoskeletal
            risk, identify affected
            body regions and initiate
            preventive action before
            work capacity deteriorates.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate(
              '/msk-screenings/new'
            )
          }
        >
          <ClipboardPlus size={16} />
          New MSK Screening
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
            SCREENINGS
          </span>

          <strong>
            {summary.total}
          </strong>
        </div>

        <div>
          <AlertTriangle size={18} />

          <span>
            HIGH RISK
          </span>

          <strong>
            {summary.highRisk}
          </strong>
        </div>

        <div>
          <Activity size={18} />

          <span>
            SYMPTOMATIC
          </span>

          <strong>
            {summary.symptomatic}
          </strong>
        </div>

        <div>
          <ShieldCheck size={18} />

          <span>
            INTERVENTION
          </span>

          <strong>
            {summary.intervention}
          </strong>
        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Screening Register
            </h2>

            <p>
              Review baseline,
              periodic and targeted
              MSK screening activity
              across the workforce.
            </p>
          </div>

        </div>

        <div
          className="form-grid"
          style={{
            marginTop: 20,
            marginBottom: 20,
          }}
        >

          <label>
            <span>
              Search
            </span>

            <div
              style={{
                position: 'relative',
              }}
            >
              <Search
                size={16}
                style={{
                  position:
                    'absolute',
                  left: 12,
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  pointerEvents:
                    'none',
                }}
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Worker, employee number or job profile"
                style={{
                  paddingLeft: 38,
                }}
              />
            </div>
          </label>

          <label>
            <span>
              Risk Level
            </span>

            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Risk Levels
              </option>

              <option value="low">
                Low
              </option>

              <option value="moderate">
                Moderate
              </option>

              <option value="high">
                High
              </option>

              <option value="very_high">
                Very High
              </option>
            </select>
          </label>

          <label>
            <span>
              Screening Status
            </span>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Statuses
              </option>

              <option value="in_progress">
                In Progress
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="referred">
                Referred
              </option>
            </select>
          </label>

        </div>

        {filteredRows.length ===
        0 ? (
          <div
            style={{
              padding: '35px 0',
              textAlign: 'center',
            }}
          >
            <Activity
              size={34}
              style={{
                marginBottom: 10,
              }}
            />

            <h3>
              No MSK screenings found
            </h3>

            <p>
              Start the first workforce
              screening to begin
              building your MSK risk
              intelligence.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                navigate(
                  '/msk-screenings/new'
                )
              }
              style={{
                marginTop: 12,
              }}
            >
              <ClipboardPlus
                size={16}
              />
              Start First Screening
            </button>
          </div>
        ) : (
          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>
                    Worker
                  </th>

                  <th>
                    Job Profile
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Screening Type
                  </th>

                  <th>
                    Risk
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Prevention
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map(
                  (row) => (
                    <tr
                      key={row.id}
                    >
                      <td>
                        {row.worker ? (
                          <>
                            <strong>
                              {
                                row.worker
                                  .first_name
                              }{' '}
                              {
                                row.worker
                                  .last_name
                              }
                            </strong>

                            <div
                              style={{
                                fontSize:
                                  12,
                              }}
                            >
                              {
                                row.worker
                                  .employee_number
                              }
                            </div>
                          </>
                        ) : (
                          'Unknown worker'
                        )}
                      </td>

                      <td>
                        {row.jobProfile ? (
                          <>
                            <strong>
                              {
                                row
                                  .jobProfile
                                  .description
                              }
                            </strong>

                            {row
                              .jobProfile
                              .job_code && (
                              <div
                                style={{
                                  fontSize:
                                    12,
                                }}
                              >
                                {
                                  row
                                    .jobProfile
                                    .job_code
                                }
                              </div>
                            )}
                          </>
                        ) : (
                          'Not assigned'
                        )}
                      </td>

                      <td>
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 7,
                            alignItems:
                              'center',
                          }}
                        >
                          <CalendarDays
                            size={15}
                          />

                          {formatDate(
                            row.screening_date
                          )}
                        </div>
                      </td>

                      <td>
                        {formatLabel(
                          row.screening_type
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            riskBadgeClass(
                              row.overall_risk_level
                            )
                          }
                        >
                          {formatLabel(
                            row.overall_risk_level
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            statusBadgeClass(
                              row.screening_status
                            )
                          }
                        >
                          {formatLabel(
                            row.screening_status
                          )}
                        </span>
                      </td>

                      <td>
                        {row.intervention_required
                          ? 'Intervention required'
                          : row.reassessment_required
                          ? 'Re-screen required'
                          : 'Monitor'}
                      </td>

                      <td>
                        <button
                          className="secondary-button"
                          onClick={() =>
                            navigate(
                              `/msk-screenings/${row.id}`
                            )
                          }
                        >
                          Open
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
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2>
              Prevention Principle
            </h2>

            <p>
              Screening results are
              intended to identify
              workers and work demands
              that may require earlier
              preventive attention.
            </p>
          </div>

        </div>

        <p>
          A risk classification should
          not be interpreted as a
          prediction that an injury will
          occur. SpineSync uses
          screening findings to support
          targeted prevention,
          workplace review and
          professional decision-making.
        </p>

      </div>

    </div>
  )
}
