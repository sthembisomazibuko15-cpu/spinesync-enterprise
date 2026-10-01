import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  HeartPulse,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'

type Profile = {
  organisation_id: string | null
}

type Worker = {
  id: string
  first_name: string
  last_name: string
  employee_number: string | null
}

type Screening = {
  id: string
  worker_id: string
  screening_date: string
  screening_status: string
  overall_risk_level: string | null
  current_msk_complaint: boolean
  intervention_required: boolean
  reassessment_required: boolean
  recommended_rescreen_date: string | null
}

type Intervention = {
  id: string
  worker_id: string
  screening_id: string | null
  intervention_type: string
  intervention_status: string
  start_date: string
  target_completion_date: string | null
}

type ActionRow = {
  screening: Screening
  worker: Worker | undefined
  intervention: Intervention | undefined
}

function formatLabel(value: string | null) {
  if (!value) return 'Not recorded'

  return value
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (letter: string) =>
      letter.toUpperCase()
    )
}

function formatDate(value: string | null) {
  if (!value) return 'Not set'

  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function riskWeight(level: string | null) {
  if (level === 'very_high') return 4
  if (level === 'high') return 3
  if (level === 'moderate') return 2
  if (level === 'low') return 1
  return 0
}

export default function PreventionCentre() {
  const navigate = useNavigate()

  const [organisationId, setOrganisationId] =
    useState<string | null>(null)
  const [workers, setWorkers] = useState<Worker[]>([])
  const [screenings, setScreenings] = useState<Screening[]>([])
  const [interventions, setInterventions] = useState<
    Intervention[]
  >([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!userData.user) {
        throw new Error('No authenticated user found.')
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('organisation_id')
        .eq('id', userData.user.id)
        .single()

      if (profileError) throw profileError

      const profile = profileData as Profile

      if (!profile.organisation_id) {
        throw new Error(
          'No organisation is linked to this user.'
        )
      }

      setOrganisationId(profile.organisation_id)

      const [
        workersResult,
        screeningsResult,
        interventionsResult,
      ] = await Promise.all([
        supabase
          .from('workers')
          .select(`
            id,
            first_name,
            last_name,
            employee_number
          `)
          .eq(
            'organisation_id',
            profile.organisation_id
          ),

        supabase
          .from('msk_screenings')
          .select(`
            id,
            worker_id,
            screening_date,
            screening_status,
            overall_risk_level,
            current_msk_complaint,
            intervention_required,
            reassessment_required,
            recommended_rescreen_date
          `)
          .eq(
            'organisation_id',
            profile.organisation_id
          )
          .in('screening_status', [
            'completed',
            'referred',
          ])
          .order('screening_date', {
            ascending: false,
          }),

        supabase
          .from('msk_interventions')
          .select(`
            id,
            worker_id,
            screening_id,
            intervention_type,
            intervention_status,
            start_date,
            target_completion_date
          `)
          .eq(
            'organisation_id',
            profile.organisation_id
          )
          .order('created_at', {
            ascending: false,
          }),
      ])

      if (workersResult.error) {
        throw workersResult.error
      }

      if (screeningsResult.error) {
        throw screeningsResult.error
      }

      if (interventionsResult.error) {
        throw interventionsResult.error
      }

      setWorkers(
        (workersResult.data ?? []) as Worker[]
      )
      setScreenings(
        (screeningsResult.data ?? []) as Screening[]
      )
      setInterventions(
        (interventionsResult.data ?? []) as Intervention[]
      )
    } catch (loadError) {
      console.error(loadError)

      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load prevention data.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const latestScreenings = useMemo(() => {
    const latest = new Map<string, Screening>()

    screenings.forEach((screening) => {
      if (!latest.has(screening.worker_id)) {
        latest.set(screening.worker_id, screening)
      }
    })

    return Array.from(latest.values())
  }, [screenings])

  const latestInterventionByScreening = useMemo(() => {
    const map = new Map<string, Intervention>()

    interventions.forEach((intervention) => {
      if (
        intervention.screening_id &&
        !map.has(intervention.screening_id)
      ) {
        map.set(
          intervention.screening_id,
          intervention
        )
      }
    })

    return map
  }, [interventions])

  const rows = useMemo<ActionRow[]>(() => {
    return latestScreenings
      .filter(
        (screening) =>
          screening.intervention_required ||
          screening.reassessment_required ||
          screening.overall_risk_level === 'high' ||
          screening.overall_risk_level === 'very_high'
      )
      .map((screening) => ({
        screening,
        worker: workers.find(
          (worker) =>
            worker.id === screening.worker_id
        ),
        intervention:
          latestInterventionByScreening.get(
            screening.id
          ),
      }))
      .sort(
        (a, b) =>
          riskWeight(
            b.screening.overall_risk_level
          ) -
            riskWeight(
              a.screening.overall_risk_level
            ) ||
          new Date(b.screening.screening_date).getTime() -
            new Date(a.screening.screening_date).getTime()
      )
  }, [
    latestScreenings,
    workers,
    latestInterventionByScreening,
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dueForRescreen = latestScreenings.filter(
    (screening) =>
      screening.reassessment_required &&
      screening.recommended_rescreen_date &&
      new Date(
        `${screening.recommended_rescreen_date}T00:00:00`
      ) <= today
  ).length

  const highPriority = latestScreenings.filter(
    (screening) =>
      screening.overall_risk_level === 'high' ||
      screening.overall_risk_level === 'very_high'
  ).length

  const actionRequired = latestScreenings.filter(
    (screening) =>
      screening.intervention_required
  ).length

  const activeInterventions = interventions.filter(
    (intervention) =>
      intervention.intervention_status === 'planned' ||
      intervention.intervention_status === 'active'
  ).length

  const completedInterventions = interventions.filter(
    (intervention) =>
      intervention.intervention_status === 'completed'
  ).length

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return rows.filter((row) => {
      const name = row.worker
        ? `${row.worker.first_name} ${row.worker.last_name}`
        : ''

      const employeeNumber =
        row.worker?.employee_number ?? ''

      const matchesSearch =
        !query ||
        name.toLowerCase().includes(query) ||
        employeeNumber
          .toLowerCase()
          .includes(query)

      const interventionStatus =
        row.intervention?.intervention_status ??
        'not_started'

      const matchesStatus =
        statusFilter === 'all' ||
        statusFilter === interventionStatus

      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          Loading Prevention Action Centre...
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1>Prevention Action Centre</h1>
          <p>
            Prioritise MSK prevention actions, interventions
            and re-screening across the organisation.
          </p>
        </div>

        <button
          className="button button-secondary"
          onClick={loadData}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span>High Priority</span>
            <strong>{highPriority}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span>Action Required</span>
            <strong>{actionRequired}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <HeartPulse size={22} />
          </div>
          <div>
            <span>Active Interventions</span>
            <strong>{activeInterventions}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CalendarClock size={22} />
          </div>
          <div>
            <span>Re-screens Due</span>
            <strong>{dueForRescreen}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span>Completed Actions</span>
            <strong>{completedInterventions}</strong>
          </div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ marginTop: 0 }}>
              Prevention Priority Queue
            </h2>
            <p style={{ marginBottom: 0 }}>
              Latest completed screening per worker requiring
              preventive attention or follow-up.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                position: 'relative',
              }}
            >
              <Search
                size={17}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.55,
                }}
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search workers..."
                style={{
                  paddingLeft: '34px',
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="all">
                All intervention statuses
              </option>
              <option value="not_started">
                Not started
              </option>
              <option value="planned">
                Planned
              </option>
              <option value="active">
                Active
              </option>
              <option value="completed">
                Completed
              </option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '12px',
            marginTop: '20px',
          }}
        >
          {filteredRows.length === 0 ? (
            <div
              style={{
                padding: '28px',
                textAlign: 'center',
                opacity: 0.7,
              }}
            >
              No workers match the current prevention
              filters.
            </div>
          ) : (
            filteredRows.map((row) => {
              const workerName = row.worker
                ? `${row.worker.first_name} ${row.worker.last_name}`
                : 'Unknown worker'

              const interventionStatus =
                row.intervention?.intervention_status ??
                'not_started'

              const rescreenDue =
                row.screening.reassessment_required &&
                row.screening.recommended_rescreen_date &&
                new Date(
                  `${row.screening.recommended_rescreen_date}T00:00:00`
                ) <= today

              return (
                <div
                  key={row.screening.id}
                  style={{
                    border:
                      '1px solid rgba(15, 23, 42, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '18px',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <strong>{workerName}</strong>
                      <div
                        style={{
                          fontSize: '13px',
                          opacity: 0.65,
                          marginTop: '4px',
                        }}
                      >
                        {row.worker?.employee_number ??
                          'No employee number'}{' '}
                        • Screened{' '}
                        {formatDate(
                          row.screening.screening_date
                        )}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          opacity: 0.6,
                        }}
                      >
                        Risk
                      </div>
                      <strong>
                        {formatLabel(
                          row.screening
                            .overall_risk_level
                        )}
                      </strong>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          opacity: 0.6,
                        }}
                      >
                        Intervention
                      </div>
                      <strong>
                        {formatLabel(
                          interventionStatus
                        )}
                      </strong>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          opacity: 0.6,
                        }}
                      >
                        Re-screen
                      </div>
                      <strong>
                        {row.screening
                          .recommended_rescreen_date
                          ? formatDate(
                              row.screening
                                .recommended_rescreen_date
                            )
                          : 'Not set'}
                        {rescreenDue ? ' • Due' : ''}
                      </strong>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        className="button button-secondary"
                        onClick={() =>
                          navigate(
                            `/msk-screenings/${row.screening.id}/risk`
                          )
                        }
                      >
                        View Risk
                      </button>

                      <button
                        className="button button-primary"
                        onClick={() =>
                          navigate(
                            `/msk-screenings/${row.screening.id}/intervention`
                          )
                        }
                      >
                        {row.intervention
                          ? 'Manage Intervention'
                          : 'Create Intervention'}
                      </button>

                      {row.screening
                        .reassessment_required && (
                        <button
                          className="button button-secondary"
                          onClick={() =>
                            navigate(
                              `/msk-screenings/new?worker=${row.screening.worker_id}&type=post_intervention`
                            )
                          }
                        >
                          Re-screen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="card">
        <strong>Prevention interpretation</strong>
        <p style={{ marginBottom: 0 }}>
          This centre prioritises recorded screening indicators
          and follow-up requirements. Risk categories identify
          workers requiring preventive attention; they do not
          predict that an injury will occur or establish that a
          workplace exposure caused a symptom.
        </p>
      </div>

      <div
        style={{
          fontSize: '12px',
          opacity: 0.5,
          marginTop: '10px',
        }}
      >
        Organisation: {organisationId ?? 'Not loaded'}
      </div>
    </div>
  )
}
