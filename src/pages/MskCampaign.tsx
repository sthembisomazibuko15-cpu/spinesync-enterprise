import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

type Campaign = {
  id: string
  organisation_id: string
  campaign_name: string
  campaign_code: string | null
  description: string | null
  campaign_type: string
  start_date: string
  end_date: string | null
  campaign_status: string
  target_workers: number | null
}

type CampaignWorker = {
  id: string
  campaign_id: string
  worker_id: string
  screening_id: string | null
  assignment_status: string
  screened_at: string | null
}

type Worker = {
  id: string
  employee_number: string | null
  first_name: string | null
  last_name: string | null
  job_profile_id: string | null
  employment_status: string | null
}

type JobProfile = {
  id: string
  title: string | null
  job_code: string | null
}

type Screening = {
  id: string
  worker_id: string
  campaign_id: string | null
  screening_status: string
  overall_risk_level: string | null
  current_msk_complaint: boolean
  intervention_required: boolean
  manual_handling_exposure: boolean
  repetitive_work_exposure: boolean
  awkward_posture_exposure: boolean
  prolonged_posture_exposure: boolean
  vibration_exposure: boolean
  overhead_work_exposure: boolean
  kneeling_squatting_exposure: boolean
  confined_space_exposure: boolean
  uneven_ground_exposure: boolean
  prolonged_walking_exposure: boolean
  prolonged_standing_exposure: boolean
  screening_date: string
}

type Symptom = {
  id: string
  screening_id: string
  body_region: string
  symptoms_present: boolean
  work_related: boolean
  aggravated_by_work: boolean
  affects_work_performance: boolean
}

type Intervention = {
  id: string
  screening_id: string | null
  intervention_status: string
  intervention_type: string
}

function formatLabel(value: string | null) {
  if (!value) return '—'

  return value
    .split('_')
    .join(' ')
    .replace(/\b\w/g, (letter: string) =>
      letter.toUpperCase()
    )
}

function formatDate(value: string | null) {
  if (!value) return '—'

  const date = new Date(`${value}T00:00:00`)

  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getWorkerName(worker: Worker | undefined) {
  if (!worker) return 'Unknown worker'

  const name = [
    worker.first_name,
    worker.last_name,
  ]
    .filter(Boolean)
    .join(' ')

  return name || 'Unnamed worker'
}

export default function MskCampaign() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [campaign, setCampaign] =
    useState<Campaign | null>(null)

  const [assignments, setAssignments] = useState<
    CampaignWorker[]
  >([])

  const [workers, setWorkers] = useState<Worker[]>([])
  const [jobProfiles, setJobProfiles] = useState<
    JobProfile[]
  >([])
  const [screenings, setScreenings] = useState<
    Screening[]
  >([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [interventions, setInterventions] = useState<
    Intervention[]
  >([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState('all')

  useEffect(() => {
    if (id) {
      void loadCampaign()
    }
  }, [id])

  async function loadCampaign() {
    if (!id) return

    try {
      setLoading(true)
      setError('')

      const {
        data: campaignData,
        error: campaignError,
      } = await supabase
        .from('msk_screening_campaigns')
        .select(`
          id,
          organisation_id,
          campaign_name,
          campaign_code,
          description,
          campaign_type,
          start_date,
          end_date,
          campaign_status,
          target_workers
        `)
        .eq('id', id)
        .single()

      if (campaignError) {
        throw campaignError
      }

      const loadedCampaign =
        campaignData as Campaign

      setCampaign(loadedCampaign)

      const {
        data: assignmentData,
        error: assignmentError,
      } = await supabase
        .from('msk_campaign_workers')
        .select(`
          id,
          campaign_id,
          worker_id,
          screening_id,
          assignment_status,
          screened_at
        `)
        .eq('campaign_id', id)
        .order('assigned_at', {
          ascending: true,
        })

      if (assignmentError) {
        throw assignmentError
      }

      const loadedAssignments =
        (assignmentData ?? []) as CampaignWorker[]

      setAssignments(loadedAssignments)

      const workerIds = loadedAssignments.map(
        (assignment) => assignment.worker_id
      )

      if (workerIds.length > 0) {
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
            job_profile_id,
            employment_status
          `)
          .in('id', workerIds)

        if (workerError) {
          throw workerError
        }

        setWorkers(
          (workerData ?? []) as Worker[]
        )
      } else {
        setWorkers([])
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('job_profiles')
        .select('id, title, job_code')
        .eq(
          'organisation_id',
          loadedCampaign.organisation_id
        )

      if (profileError) {
        throw profileError
      }

      setJobProfiles(
        (profileData ?? []) as JobProfile[]
      )

      const {
        data: screeningData,
        error: screeningError,
      } = await supabase
        .from('msk_screenings')
        .select(`
          id,
          worker_id,
          campaign_id,
          screening_status,
          overall_risk_level,
          current_msk_complaint,
          intervention_required,
          manual_handling_exposure,
          repetitive_work_exposure,
          awkward_posture_exposure,
          prolonged_posture_exposure,
          vibration_exposure,
          overhead_work_exposure,
          kneeling_squatting_exposure,
          confined_space_exposure,
          uneven_ground_exposure,
          prolonged_walking_exposure,
          prolonged_standing_exposure,
          screening_date
        `)
        .eq('campaign_id', id)

      if (screeningError) {
        throw screeningError
      }

      const loadedScreenings =
        (screeningData ?? []) as Screening[]

      setScreenings(loadedScreenings)

      const screeningIds = loadedScreenings.map(
        (screening) => screening.id
      )

      if (screeningIds.length > 0) {
        const {
          data: symptomData,
          error: symptomError,
        } = await supabase
          .from('msk_symptoms')
          .select(`
            id,
            screening_id,
            body_region,
            symptoms_present,
            work_related,
            aggravated_by_work,
            affects_work_performance
          `)
          .in('screening_id', screeningIds)

        if (symptomError) {
          throw symptomError
        }

        setSymptoms((symptomData ?? []) as Symptom[])

        const {
          data: interventionData,
          error: interventionError,
        } = await supabase
          .from('msk_interventions')
          .select(`
            id,
            screening_id,
            intervention_status,
            intervention_type
          `)
          .in('screening_id', screeningIds)

        if (interventionError) {
          throw interventionError
        }

        setInterventions(
          (interventionData ?? []) as Intervention[]
        )
      } else {
        setSymptoms([])
        setInterventions([])
      }
    } catch (err) {
      console.error(
        'Campaign detail load error:',
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load screening campaign.'
      )
    } finally {
      setLoading(false)
    }
  }

  function getWorker(workerId: string) {
    return workers.find(
      (worker) => worker.id === workerId
    )
  }

  function getJobProfile(worker: Worker | undefined) {
    if (!worker?.job_profile_id) {
      return null
    }

    return jobProfiles.find(
      (profile) =>
        profile.id === worker.job_profile_id
    )
  }

  function getScreening(
    assignment: CampaignWorker
  ) {
    if (assignment.screening_id) {
      const linked = screenings.find(
        (screening) =>
          screening.id === assignment.screening_id
      )

      if (linked) return linked
    }

    return screenings.find(
      (screening) =>
        screening.worker_id ===
        assignment.worker_id
    )
  }

  const stats = useMemo(() => {
    const activeAssignments =
      assignments.filter(
        (assignment) =>
          assignment.assignment_status !==
          'excluded'
      )

    const screened = activeAssignments.filter(
      (assignment) =>
        assignment.assignment_status ===
        'screened'
    ).length

    const inProgress =
      activeAssignments.filter(
        (assignment) =>
          assignment.assignment_status ===
          'in_progress'
      ).length

    const outstanding = activeAssignments.filter(
      (assignment) =>
        assignment.assignment_status ===
          'pending' ||
        assignment.assignment_status ===
          'scheduled'
    ).length

    const highRisk = activeAssignments.filter(
      (assignment) => {
        const screening =
          getScreening(assignment)

        return (
          screening?.overall_risk_level ===
            'high' ||
          screening?.overall_risk_level ===
            'very_high'
        )
      }
    ).length

    const symptomatic = activeAssignments.filter(
      (assignment) =>
        getScreening(assignment)
          ?.current_msk_complaint === true
    ).length

    const completion =
      activeAssignments.length > 0
        ? Math.round(
            (screened /
              activeAssignments.length) *
              100
          )
        : 0

    return {
      total: activeAssignments.length,
      screened,
      inProgress,
      outstanding,
      highRisk,
      symptomatic,
      completion,
    }
  }, [assignments, screenings])

  const analytics = useMemo(() => {
    const completedScreenings = screenings.filter(
      (screening) =>
        screening.screening_status === 'completed' ||
        screening.screening_status === 'referred'
    )

    const completedIds = new Set(
      completedScreenings.map((screening) => screening.id)
    )

    const completedSymptoms = symptoms.filter(
      (symptom) =>
        completedIds.has(symptom.screening_id) &&
        symptom.symptoms_present
    )

    const riskCounts = {
      low: 0,
      moderate: 0,
      high: 0,
      very_high: 0,
    }

    completedScreenings.forEach((screening) => {
      const level = screening.overall_risk_level

      if (
        level === 'low' ||
        level === 'moderate' ||
        level === 'high' ||
        level === 'very_high'
      ) {
        riskCounts[level] += 1
      }
    })

    const denominator = completedScreenings.length

    const symptomaticWorkers =
      completedScreenings.filter(
        (screening) =>
          screening.current_msk_complaint
      ).length

    const interventionRequired =
      completedScreenings.filter(
        (screening) =>
          screening.intervention_required
      ).length

    const workRelatedScreeningIds = new Set(
      completedSymptoms
        .filter(
          (symptom) =>
            symptom.work_related ||
            symptom.aggravated_by_work ||
            symptom.affects_work_performance
        )
        .map((symptom) => symptom.screening_id)
    )

    const bodyRegionMap = new Map<string, Set<string>>()

    completedSymptoms.forEach((symptom) => {
      const existing =
        bodyRegionMap.get(symptom.body_region) ??
        new Set<string>()

      existing.add(symptom.screening_id)
      bodyRegionMap.set(symptom.body_region, existing)
    })

    const bodyRegions = Array.from(
      bodyRegionMap.entries()
    )
      .map(([region, screeningIds]) => ({
        region,
        count: screeningIds.size,
        percentage:
          denominator > 0
            ? Math.round(
                (screeningIds.size / denominator) * 100
              )
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    const jobMap = new Map<
      string,
      {
        title: string
        screened: number
        moderatePlus: number
      }
    >()

    completedScreenings.forEach((screening) => {
      const worker = getWorker(screening.worker_id)
      const profile = getJobProfile(worker)
      const key =
        profile?.id ?? 'unassigned'
      const title =
        profile?.title ?? 'Unassigned job profile'

      const current =
        jobMap.get(key) ?? {
          title,
          screened: 0,
          moderatePlus: 0,
        }

      current.screened += 1

      if (
        screening.overall_risk_level === 'moderate' ||
        screening.overall_risk_level === 'high' ||
        screening.overall_risk_level === 'very_high'
      ) {
        current.moderatePlus += 1
      }

      jobMap.set(key, current)
    })

    const jobProfilesRisk = Array.from(
      jobMap.values()
    )
      .map((item) => ({
        ...item,
        percentage:
          item.screened > 0
            ? Math.round(
                (item.moderatePlus / item.screened) * 100
              )
            : 0,
      }))
      .sort(
        (a, b) =>
          b.percentage - a.percentage ||
          b.screened - a.screened
      )
      .slice(0, 6)

    const exposureDefinitions: Array<{
      key: keyof Screening
      label: string
    }> = [
      {
        key: 'manual_handling_exposure',
        label: 'Manual handling',
      },
      {
        key: 'repetitive_work_exposure',
        label: 'Repetitive work',
      },
      {
        key: 'awkward_posture_exposure',
        label: 'Awkward posture',
      },
      {
        key: 'prolonged_posture_exposure',
        label: 'Prolonged posture',
      },
      {
        key: 'vibration_exposure',
        label: 'Vibration',
      },
      {
        key: 'overhead_work_exposure',
        label: 'Overhead work',
      },
      {
        key: 'kneeling_squatting_exposure',
        label: 'Kneeling / squatting',
      },
      {
        key: 'confined_space_exposure',
        label: 'Confined space',
      },
      {
        key: 'uneven_ground_exposure',
        label: 'Uneven ground',
      },
      {
        key: 'prolonged_walking_exposure',
        label: 'Prolonged walking',
      },
      {
        key: 'prolonged_standing_exposure',
        label: 'Prolonged standing',
      },
    ]

    const exposures = exposureDefinitions
      .map(({ key, label }) => {
        const count = completedScreenings.filter(
          (screening) => screening[key] === true
        ).length

        return {
          label,
          count,
          percentage:
            denominator > 0
              ? Math.round((count / denominator) * 100)
              : 0,
        }
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    const campaignInterventions =
      interventions.filter(
        (intervention) =>
          intervention.screening_id &&
          completedIds.has(intervention.screening_id)
      )

    const activeInterventions =
      campaignInterventions.filter(
        (intervention) =>
          intervention.intervention_status === 'active' ||
          intervention.intervention_status === 'planned'
      ).length

    const completedInterventions =
      campaignInterventions.filter(
        (intervention) =>
          intervention.intervention_status === 'completed'
      ).length

    const highOrVeryHigh =
      riskCounts.high + riskCounts.very_high

    return {
      denominator,
      riskCounts,
      symptomaticWorkers,
      symptomaticRate:
        denominator > 0
          ? Math.round(
              (symptomaticWorkers / denominator) * 100
            )
          : 0,
      highRiskRate:
        denominator > 0
          ? Math.round(
              (highOrVeryHigh / denominator) * 100
            )
          : 0,
      interventionRequired,
      interventionRate:
        denominator > 0
          ? Math.round(
              (interventionRequired / denominator) * 100
            )
          : 0,
      workRelatedWorkers: workRelatedScreeningIds.size,
      workRelatedRate:
        denominator > 0
          ? Math.round(
              (workRelatedScreeningIds.size / denominator) *
                100
            )
          : 0,
      bodyRegions,
      jobProfilesRisk,
      exposures,
      activeInterventions,
      completedInterventions,
      totalInterventions: campaignInterventions.length,
    }
  }, [
    screenings,
    symptoms,
    interventions,
    workers,
    jobProfiles,
  ])

  const filteredAssignments = useMemo(() => {
    const query =
      search.trim().toLowerCase()

    return assignments.filter(
      (assignment) => {
        if (
          statusFilter !== 'all' &&
          assignment.assignment_status !==
            statusFilter
        ) {
          return false
        }

        const worker = getWorker(
          assignment.worker_id
        )

        const profile =
          getJobProfile(worker)

        const searchable = [
          worker?.first_name ?? '',
          worker?.last_name ?? '',
          worker?.employee_number ?? '',
          profile?.title ?? '',
          profile?.job_code ?? '',
          assignment.assignment_status,
        ]
          .join(' ')
          .toLowerCase()

        return (
          !query ||
          searchable.includes(query)
        )
      }
    )
  }, [
    assignments,
    workers,
    jobProfiles,
    search,
    statusFilter,
  ])

  function startScreening(
    assignment: CampaignWorker
  ) {
    if (!campaign) return

    navigate(
      `/msk-screenings/new?worker=${assignment.worker_id}&type=${campaign.campaign_type}&campaign=${campaign.id}`
    )
  }

  function continueScreening(
    assignment: CampaignWorker
  ) {
    const screening =
      getScreening(assignment)

    if (!screening) {
      startScreening(assignment)
      return
    }

    navigate(
      `/msk-screenings/${screening.id}`
    )
  }

  function viewResult(
    assignment: CampaignWorker
  ) {
    const screening =
      getScreening(assignment)

    if (!screening) return

    navigate(
      `/msk-screenings/${screening.id}/risk`
    )
  }

  if (loading) {
    return (
      <div className="page">
        <h1>MSK Screening Campaign</h1>
        <p>Loading campaign...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="page">
        <h1>Campaign not found</h1>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button
          className="secondary-button"
          type="button"
          onClick={() =>
            navigate('/msk-campaigns')
          }
        >
          <ArrowLeft size={17} />
          Campaigns
        </button>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate('/msk-campaigns')
            }
            style={{
              marginBottom: '14px',
            }}
          >
            <ArrowLeft size={17} />
            Campaigns
          </button>

          <h1>
            {campaign.campaign_name}
          </h1>

          <p>
            {campaign.campaign_code &&
              `${campaign.campaign_code} • `}

            {formatLabel(
              campaign.campaign_type
            )}

            {' • '}

            {formatDate(
              campaign.start_date
            )}

            {campaign.end_date &&
              ` – ${formatDate(
                campaign.end_date
              )}`}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            void loadCampaign()
          }
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>Assigned</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle2 size={22} />
          </div>

          <div>
            <span>Screened</span>
            <strong>
              {stats.screened}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock3 size={22} />
          </div>

          <div>
            <span>Outstanding</span>
            <strong>
              {stats.outstanding +
                stats.inProgress}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <AlertTriangle size={22} />
          </div>

          <div>
            <span>High Risk</span>
            <strong>
              {stats.highRisk}
            </strong>
          </div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            gap: '20px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2>
              Campaign Progress
            </h2>

            <p>
              {stats.screened} of{' '}
              {stats.total} workers
              screened.
            </p>
          </div>

          <div
            style={{
              textAlign: 'right',
            }}
          >
            <strong
              style={{
                fontSize: '28px',
              }}
            >
              {stats.completion}%
            </strong>

            <div>
              {formatLabel(
                campaign.campaign_status
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            height: '10px',
            borderRadius: '999px',
            overflow: 'hidden',
            background:
              'rgba(15, 23, 42, 0.08)',
            marginTop: '12px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${stats.completion}%`,
              background: 'currentColor',
              opacity: 0.75,
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '22px',
            flexWrap: 'wrap',
            marginTop: '16px',
            fontSize: '14px',
          }}
        >
          <span>
            <strong>
              {stats.inProgress}
            </strong>{' '}
            in progress
          </span>

          <span>
            <strong>
              {stats.symptomatic}
            </strong>{' '}
            symptomatic
          </span>

          <span>
            <strong>
              {stats.highRisk}
            </strong>{' '}
            high / very high risk
          </span>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2>Worker Screening Queue</h2>

            <p>
              Start, continue and review
              screenings assigned to this
              campaign.
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
                  left: '12px',
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  opacity: 0.55,
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
                placeholder="Search workers..."
                style={{
                  paddingLeft: '38px',
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All statuses
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="scheduled">
                Scheduled
              </option>

              <option value="in_progress">
                In Progress
              </option>

              <option value="screened">
                Screened
              </option>

              <option value="excluded">
                Excluded
              </option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: '10px',
            marginTop: '20px',
          }}
        >
          {filteredAssignments.length ===
          0 ? (
            <div
              style={{
                padding: '30px',
                textAlign: 'center',
              }}
            >
              No workers match the
              selected filters.
            </div>
          ) : (
            filteredAssignments.map(
              (assignment) => {
                const worker =
                  getWorker(
                    assignment.worker_id
                  )

                const profile =
                  getJobProfile(worker)

                const screening =
                  getScreening(assignment)

                return (
                  <div
                    key={assignment.id}
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      flexWrap: 'wrap',
                      padding: '14px',
                      border:
                        '1px solid rgba(15, 23, 42, 0.1)',
                      borderRadius: '10px',
                    }}
                  >
                    <div
                      style={{
                        flex: '1 1 260px',
                      }}
                    >
                      <strong>
                        {getWorkerName(
                          worker
                        )}
                      </strong>

                      <div
                        style={{
                          fontSize: '13px',
                          opacity: 0.7,
                          marginTop: '3px',
                        }}
                      >
                        {worker?.employee_number
                          ? `Employee ${worker.employee_number}`
                          : 'No employee number'}

                        {profile?.title &&
                          ` • ${profile.title}`}

                        {profile?.job_code &&
                          ` (${profile.job_code})`}
                      </div>
                    </div>

                    <div
                      style={{
                        minWidth: '130px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          opacity: 0.6,
                        }}
                      >
                        Status
                      </div>

                      <strong>
                        {formatLabel(
                          assignment.assignment_status
                        )}
                      </strong>
                    </div>

                    <div
                      style={{
                        minWidth: '120px',
                      }}
                    >
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
                          screening?.overall_risk_level ??
                            null
                        )}
                      </strong>
                    </div>

                    <div>
                      {assignment.assignment_status ===
                        'screened' &&
                      screening ? (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            viewResult(
                              assignment
                            )
                          }
                        >
                          <ShieldCheck
                            size={17}
                          />
                          View Risk
                        </button>
                      ) : assignment.assignment_status ===
                          'in_progress' &&
                        screening ? (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() =>
                            continueScreening(
                              assignment
                            )
                          }
                        >
                          <Play size={17} />
                          Continue
                        </button>
                      ) : assignment.assignment_status ===
                        'excluded' ? (
                        <span>Excluded</span>
                      ) : (
                        <button
                          type="button"
                          className="primary-button"
                          onClick={() =>
                            startScreening(
                              assignment
                            )
                          }
                        >
                          <Play size={17} />
                          Start Screening
                        </button>
                      )}
                    </div>
                  </div>
                )
              }
            )
          )}
        </div>
      </div>

      <div className="card">
        <div>
          <h2>Campaign Analytics</h2>
          <p>
            Prevention intelligence from completed screenings
            in this campaign.
          </p>
        </div>

        {analytics.denominator === 0 ? (
          <div
            style={{
              padding: '28px 0 10px',
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            Analytics will populate as workers complete
            their screenings.
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginTop: '18px',
              }}
            >
              <div className="stat-card">
                <div className="stat-icon">
                  <HeartPulse size={22} />
                </div>
                <div>
                  <span>Symptomatic</span>
                  <strong>
                    {analytics.symptomaticRate}%
                  </strong>
                  <div style={{ fontSize: '12px', opacity: 0.65 }}>
                    {analytics.symptomaticWorkers} of{' '}
                    {analytics.denominator}
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <span>High / Very High</span>
                  <strong>{analytics.highRiskRate}%</strong>
                  <div style={{ fontSize: '12px', opacity: 0.65 }}>
                    {analytics.riskCounts.high +
                      analytics.riskCounts.very_high}{' '}
                    workers
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <span>Intervention Required</span>
                  <strong>
                    {analytics.interventionRate}%
                  </strong>
                  <div style={{ fontSize: '12px', opacity: 0.65 }}>
                    {analytics.interventionRequired} workers
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <TrendingUp size={22} />
                </div>
                <div>
                  <span>Work-Related Signals</span>
                  <strong>
                    {analytics.workRelatedRate}%
                  </strong>
                  <div style={{ fontSize: '12px', opacity: 0.65 }}>
                    {analytics.workRelatedWorkers} workers
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  border: '1px solid rgba(15, 23, 42, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  Risk Distribution
                </h3>

                {(
                  [
                    ['Low', analytics.riskCounts.low],
                    ['Moderate', analytics.riskCounts.moderate],
                    ['High', analytics.riskCounts.high],
                    [
                      'Very High',
                      analytics.riskCounts.very_high,
                    ],
                  ] as Array<[string, number]>
                ).map(([label, count]) => {
                  const percentage =
                    analytics.denominator > 0
                      ? Math.round(
                          (count / analytics.denominator) * 100
                        )
                      : 0

                  return (
                    <div
                      key={label}
                      style={{ marginBottom: '14px' }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '5px',
                        }}
                      >
                        <span>{label}</span>
                        <strong>
                          {count} ({percentage}%)
                        </strong>
                      </div>

                      <div
                        style={{
                          height: '8px',
                          background: 'rgba(15, 23, 42, 0.08)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${percentage}%`,
                            height: '100%',
                            background: 'currentColor',
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              <div
                style={{
                  border: '1px solid rgba(15, 23, 42, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  Body-Region Hotspots
                </h3>

                {analytics.bodyRegions.length === 0 ? (
                  <p>No symptomatic body regions recorded.</p>
                ) : (
                  analytics.bodyRegions.map((item) => (
                    <div
                      key={item.region}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '9px 0',
                        borderBottom:
                          '1px solid rgba(15, 23, 42, 0.07)',
                      }}
                    >
                      <span>{formatLabel(item.region)}</span>
                      <strong>
                        {item.count} ({item.percentage}%)
                      </strong>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  border: '1px solid rgba(15, 23, 42, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  Occupational Exposure Signals
                </h3>

                {analytics.exposures.length === 0 ? (
                  <p>No occupational exposures recorded.</p>
                ) : (
                  analytics.exposures.map((item) => (
                    <div
                      key={item.label}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '9px 0',
                        borderBottom:
                          '1px solid rgba(15, 23, 42, 0.07)',
                      }}
                    >
                      <span>{item.label}</span>
                      <strong>
                        {item.count} ({item.percentage}%)
                      </strong>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  border: '1px solid rgba(15, 23, 42, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  Job Profile Risk Signals
                </h3>

                {analytics.jobProfilesRisk.length === 0 ? (
                  <p>No completed job-profile data yet.</p>
                ) : (
                  analytics.jobProfilesRisk.map((item) => (
                    <div
                      key={item.title}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '9px 0',
                        borderBottom:
                          '1px solid rgba(15, 23, 42, 0.07)',
                      }}
                    >
                      <span>{item.title}</span>
                      <strong>
                        {item.moderatePlus}/{item.screened}{' '}
                        moderate+
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: '16px',
                border: '1px solid rgba(15, 23, 42, 0.1)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Preventive Action
              </h3>

              <div
                style={{
                  display: 'flex',
                  gap: '28px',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  <strong>
                    {analytics.interventionRequired}
                  </strong>{' '}
                  workers flagged for intervention
                </span>

                <span>
                  <strong>
                    {analytics.activeInterventions}
                  </strong>{' '}
                  planned / active interventions
                </span>

                <span>
                  <strong>
                    {analytics.completedInterventions}
                  </strong>{' '}
                  completed interventions
                </span>

                <span>
                  <strong>
                    {analytics.totalInterventions}
                  </strong>{' '}
                  intervention records
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card">
        <strong>
          Screening interpretation
        </strong>

        <p
          style={{
            marginBottom: 0,
          }}
        >
          Campaign risk indicators identify
          workers or groups requiring
          preventive attention. They should
          not be interpreted as predictions
          that an injury will occur. Percentages describe
          recorded screening indicators within this campaign
          and do not establish that workplace exposure caused
          a symptom or future injury.
        </p>
      </div>
    </div>
  )
}