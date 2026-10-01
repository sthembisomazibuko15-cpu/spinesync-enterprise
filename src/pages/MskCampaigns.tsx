import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Plus,
  Search,
  Target,
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
  operation_id: string | null
  site_id: string | null
  department_id: string | null
  job_profile_id: string | null
  campaign_status: string
  target_workers: number | null
  created_at: string
}

type CampaignWorker = {
  id: string
  campaign_id: string
  worker_id: string
  screening_id: string | null
  assignment_status: string
}

type Screening = {
  id: string
  worker_id: string
  screening_status: string
  overall_risk_level: string | null
  current_msk_complaint: boolean
  intervention_required: boolean
  screening_date: string
}

type Symptom = {
  id: string
  screening_id: string
  body_region: string
  symptoms_present: boolean
}

type Profile = {
  organisation_id: string | null
}

type Site = {
  id: string
  name: string
  operation_id: string | null
}

type Department = {
  id: string
  site_id: string
  name: string
}

type JobProfile = {
  id: string
  title: string | null
  job_code: string | null
}

function formatLabel(value: string) {
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

export default function MskCampaigns() {
  const navigate = useNavigate()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignWorkers, setCampaignWorkers] = useState<
    CampaignWorker[]
  >([])
  const [screenings, setScreenings] = useState<Screening[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])

  const [sites, setSites] = useState<Site[]>([])
  const [departments, setDepartments] = useState<
    Department[]
  >([])
  const [jobProfiles, setJobProfiles] = useState<
    JobProfile[]
  >([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    void loadCampaigns()
  }, [])

  async function loadCampaigns() {
    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error('No authenticated user found.')
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('organisation_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw profileError
      }

      const profile = profileData as Profile

      if (!profile.organisation_id) {
        throw new Error(
          'Your account is not linked to an organisation.'
        )
      }

      /*
       * Load organisation-level records first.
       * Departments cannot be filtered by organisation_id
       * because departments belong to sites.
       */
      const [
        campaignsResult,
        workersResult,
        sitesResult,
        jobProfilesResult,
      ] = await Promise.all([
        supabase
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
            operation_id,
            site_id,
            department_id,
            job_profile_id,
            campaign_status,
            target_workers,
            created_at
          `)
          .eq(
            'organisation_id',
            profile.organisation_id
          )
          .order('start_date', {
            ascending: false,
          }),

        supabase
          .from('msk_campaign_workers')
          .select(`
            id,
            campaign_id,
            worker_id,
            screening_id,
            assignment_status
          `),

        supabase
          .from('sites')
          .select('id, name, operation_id'),

        supabase
          .from('job_profiles')
          .select('id, title, job_code')
          .eq(
            'organisation_id',
            profile.organisation_id
          ),
      ])

      if (campaignsResult.error) {
        throw campaignsResult.error
      }

      if (workersResult.error) {
        throw workersResult.error
      }

      if (sitesResult.error) {
        throw sitesResult.error
      }

      if (jobProfilesResult.error) {
        throw jobProfilesResult.error
      }

      const loadedSites =
        (sitesResult.data ?? []) as Site[]

      /*
       * Departments belong to sites.
       * Load only departments attached to the sites
       * available to this organisation.
       */
      const siteIds = loadedSites.map(
        (site) => site.id
      )

      let loadedDepartments: Department[] = []

      if (siteIds.length > 0) {
        const {
          data: departmentData,
          error: departmentError,
        } = await supabase
          .from('departments')
          .select('id, site_id, name')
          .in('site_id', siteIds)

        if (departmentError) {
          throw departmentError
        }

        loadedDepartments =
          (departmentData ?? []) as Department[]
      }

      setCampaigns(
        (campaignsResult.data ?? []) as Campaign[]
      )

      const loadedCampaignWorkers =
        (workersResult.data ?? []) as CampaignWorker[]

      setCampaignWorkers(loadedCampaignWorkers)

      const screeningIds = loadedCampaignWorkers
        .map((item) => item.screening_id)
        .filter((id): id is string => Boolean(id))

      if (screeningIds.length > 0) {
        const {
          data: screeningData,
          error: screeningError,
        } = await supabase
          .from('msk_screenings')
          .select(`
            id,
            worker_id,
            screening_status,
            overall_risk_level,
            current_msk_complaint,
            intervention_required,
            screening_date
          `)
          .in('id', screeningIds)

        if (screeningError) {
          throw screeningError
        }

        const loadedScreenings =
          (screeningData ?? []) as Screening[]

        setScreenings(loadedScreenings)

        const completedIds = loadedScreenings
          .filter(
            (screening) =>
              screening.screening_status === 'completed' ||
              screening.screening_status === 'referred'
          )
          .map((screening) => screening.id)

        if (completedIds.length > 0) {
          const {
            data: symptomData,
            error: symptomError,
          } = await supabase
            .from('msk_symptoms')
            .select(`
              id,
              screening_id,
              body_region,
              symptoms_present
            `)
            .in('screening_id', completedIds)
            .eq('symptoms_present', true)

          if (symptomError) {
            throw symptomError
          }

          setSymptoms((symptomData ?? []) as Symptom[])
        } else {
          setSymptoms([])
        }
      } else {
        setScreenings([])
        setSymptoms([])
      }

      setSites(loadedSites)

      setDepartments(loadedDepartments)

      setJobProfiles(
        (jobProfilesResult.data ?? []) as JobProfile[]
      )
    } catch (err) {
      console.error(
        'MSK campaign load error:',
        err
      )

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load screening campaigns.'

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function getCampaignStats(campaignId: string) {
    const assigned = campaignWorkers.filter(
      (item) => item.campaign_id === campaignId
    )

    const screened = assigned.filter(
      (item) =>
        item.assignment_status === 'screened' ||
        Boolean(item.screening_id)
    ).length

    const inProgress = assigned.filter(
      (item) =>
        item.assignment_status === 'in_progress'
    ).length

    const excluded = assigned.filter(
      (item) =>
        item.assignment_status === 'excluded'
    ).length

    const activeAssigned =
      assigned.length - excluded

    const outstanding = Math.max(
      activeAssigned - screened,
      0
    )

    const completion =
      activeAssigned > 0
        ? Math.round(
            (screened / activeAssigned) * 100
          )
        : 0

    return {
      assigned: activeAssigned,
      screened,
      inProgress,
      outstanding,
      completion,
    }
  }

  function getSiteName(id: string | null) {
    if (!id) return null

    return (
      sites.find((site) => site.id === id)?.name ??
      null
    )
  }

  function getDepartmentName(
    id: string | null
  ) {
    if (!id) return null

    return (
      departments.find(
        (department) => department.id === id
      )?.name ?? null
    )
  }

  function getJobProfileName(
    id: string | null
  ) {
    if (!id) return null

    const profile = jobProfiles.find(
      (item) => item.id === id
    )

    if (!profile) return null

    if (profile.title && profile.job_code) {
      return `${profile.title} (${profile.job_code})`
    }

    return (
      profile.title ??
      profile.job_code ??
      null
    )
  }

  function getTargetLabel(campaign: Campaign) {
    const department = getDepartmentName(
      campaign.department_id
    )

    if (department) {
      return department
    }

    const jobProfile = getJobProfileName(
      campaign.job_profile_id
    )

    if (jobProfile) {
      return jobProfile
    }

    const site = getSiteName(
      campaign.site_id
    )

    if (site) {
      return site
    }

    return 'Organisation-wide'
  }

  const crossCampaignAnalytics = useMemo(() => {
    const screeningById = new Map(
      screenings.map((screening) => [
        screening.id,
        screening,
      ])
    )

    const symptomRegionsByScreening = new Map<
      string,
      Set<string>
    >()

    symptoms.forEach((symptom) => {
      const current =
        symptomRegionsByScreening.get(
          symptom.screening_id
        ) ?? new Set<string>()

      current.add(symptom.body_region)

      symptomRegionsByScreening.set(
        symptom.screening_id,
        current
      )
    })

    const campaignRows = campaigns
      .map((campaign) => {
        const assigned = campaignWorkers.filter(
          (item) => item.campaign_id === campaign.id
        )

        const completed = assigned
          .map((item) =>
            item.screening_id
              ? screeningById.get(item.screening_id)
              : undefined
          )
          .filter(
            (screening): screening is Screening =>
              Boolean(screening) &&
              (screening?.screening_status === 'completed' ||
                screening?.screening_status === 'referred')
          )

        const screened = completed.length
        const symptomatic = completed.filter(
          (screening) =>
            screening.current_msk_complaint
        ).length
        const highRisk = completed.filter(
          (screening) =>
            screening.overall_risk_level === 'high' ||
            screening.overall_risk_level === 'very_high'
        ).length
        const interventionRequired = completed.filter(
          (screening) =>
            screening.intervention_required
        ).length

        return {
          id: campaign.id,
          name: campaign.campaign_name,
          startDate: campaign.start_date,
          status: campaign.campaign_status,
          screened,
          completion: getCampaignStats(campaign.id).completion,
          symptomatic,
          symptomaticRate:
            screened > 0
              ? Math.round((symptomatic / screened) * 100)
              : 0,
          highRisk,
          highRiskRate:
            screened > 0
              ? Math.round((highRisk / screened) * 100)
              : 0,
          interventionRequired,
          interventionRate:
            screened > 0
              ? Math.round(
                  (interventionRequired / screened) * 100
                )
              : 0,
        }
      })
      .filter((row) => row.screened > 0)
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() -
          new Date(b.startDate).getTime()
      )

    const completedScreeningIds = new Set(
      screenings
        .filter(
          (screening) =>
            screening.screening_status === 'completed' ||
            screening.screening_status === 'referred'
        )
        .map((screening) => screening.id)
    )

    const regionCounts = new Map<string, number>()

    symptoms.forEach((symptom) => {
      if (
        !completedScreeningIds.has(symptom.screening_id)
      ) {
        return
      }

      regionCounts.set(
        symptom.body_region,
        (regionCounts.get(symptom.body_region) ?? 0) + 1
      )
    })

    const bodyRegions = Array.from(regionCounts.entries())
      .map(([region, count]) => ({
        region,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    const latest =
      campaignRows.length > 0
        ? campaignRows[campaignRows.length - 1]
        : null

    const previous =
      campaignRows.length > 1
        ? campaignRows[campaignRows.length - 2]
        : null

    return {
      campaignRows,
      bodyRegions,
      latest,
      previous,
    }
  }, [
    campaigns,
    campaignWorkers,
    screenings,
    symptoms,
  ])

  const filteredCampaigns = useMemo(() => {
    const query =
      search.trim().toLowerCase()

    return campaigns.filter((campaign) => {
      const matchesStatus =
        statusFilter === 'all' ||
        campaign.campaign_status ===
          statusFilter

      const target =
        getTargetLabel(campaign)

      const searchableText = [
        campaign.campaign_name,
        campaign.campaign_code ?? '',
        campaign.campaign_type,
        campaign.campaign_status,
        target,
      ]
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !query ||
        searchableText.includes(query)

      return (
        matchesStatus &&
        matchesSearch
      )
    })
  }, [
    campaigns,
    search,
    statusFilter,
    sites,
    departments,
    jobProfiles,
  ])

  const totalCampaigns =
    campaigns.length

  const activeCampaigns =
    campaigns.filter(
      (campaign) =>
        campaign.campaign_status ===
        'active'
    ).length

  const totalAssignedWorkers =
    campaigns.reduce(
      (total, campaign) =>
        total +
        getCampaignStats(
          campaign.id
        ).assigned,
      0
    )

  const totalScreenedWorkers =
    campaigns.reduce(
      (total, campaign) =>
        total +
        getCampaignStats(
          campaign.id
        ).screened,
      0
    )

  const overallCompletion =
    totalAssignedWorkers > 0
      ? Math.round(
          (totalScreenedWorkers /
            totalAssignedWorkers) *
            100
        )
      : 0

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>
              MSK Screening Campaigns
            </h1>

            <p>
              Loading screening
              campaigns...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>
            MSK Screening Campaigns
          </h1>

          <p>
            Plan and monitor workforce
            musculoskeletal screening
            programmes.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={() =>
            navigate(
              '/msk-campaigns/new'
            )
          }
        >
          <Plus size={18} />
          New Campaign
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
            <ClipboardList size={22} />
          </div>

          <div>
            <span>
              Total Campaigns
            </span>
            <strong>
              {totalCampaigns}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Target size={22} />
          </div>

          <div>
            <span>
              Active Campaigns
            </span>
            <strong>
              {activeCampaigns}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Users size={22} />
          </div>

          <div>
            <span>
              Assigned Workers
            </span>
            <strong>
              {totalAssignedWorkers}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle2
              size={22}
            />
          </div>

          <div>
            <span>
              Overall Completion
            </span>
            <strong>
              {overallCompletion}%
            </strong>
          </div>
        </div>
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <h2 style={{ marginTop: 0 }}>
              Cross-Campaign Intelligence
            </h2>
            <p style={{ marginBottom: 0 }}>
              Compare completed campaign screening indicators
              across the workforce over time.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
            }}
          >
            <TrendingUp size={19} />
            {crossCampaignAnalytics.campaignRows.length}{' '}
            campaigns with completed screening data
          </div>
        </div>

        {crossCampaignAnalytics.campaignRows.length === 0 ? (
          <div
            style={{
              padding: '28px 0 10px',
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            Cross-campaign trends will appear after campaign
            screenings are completed.
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginTop: '20px',
              }}
            >
              <div className="stat-card">
                <div className="stat-icon">
                  <HeartPulse size={22} />
                </div>
                <div>
                  <span>Latest Symptomatic</span>
                  <strong>
                    {
                      crossCampaignAnalytics.latest
                        ?.symptomaticRate
                    }
                    %
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <span>Latest High / Very High</span>
                  <strong>
                    {
                      crossCampaignAnalytics.latest
                        ?.highRiskRate
                    }
                    %
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <Target size={22} />
                </div>
                <div>
                  <span>Latest Intervention Need</span>
                  <strong>
                    {
                      crossCampaignAnalytics.latest
                        ?.interventionRate
                    }
                    %
                  </strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <span>Latest Completion</span>
                  <strong>
                    {
                      crossCampaignAnalytics.latest
                        ?.completion
                    }
                    %
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(0, 2fr) minmax(260px, 1fr)',
                gap: '16px',
                marginTop: '20px',
              }}
            >
              <div
                style={{
                  border:
                    '1px solid rgba(15, 23, 42, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  overflowX: 'auto',
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  Campaign Trend
                </h3>

                <div
                  style={{
                    minWidth: '680px',
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'minmax(180px, 1.5fr) repeat(4, minmax(90px, 1fr))',
                      gap: '10px',
                      fontSize: '12px',
                      fontWeight: 700,
                      opacity: 0.65,
                      paddingBottom: '8px',
                      borderBottom:
                        '1px solid rgba(15, 23, 42, 0.08)',
                    }}
                  >
                    <span>Campaign</span>
                    <span>Completion</span>
                    <span>Symptomatic</span>
                    <span>High+</span>
                    <span>Intervention</span>
                  </div>

                  {crossCampaignAnalytics.campaignRows.map(
                    (row) => (
                      <div
                        key={row.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'minmax(180px, 1.5fr) repeat(4, minmax(90px, 1fr))',
                          gap: '10px',
                          alignItems: 'center',
                          padding: '9px 0',
                          borderBottom:
                            '1px solid rgba(15, 23, 42, 0.06)',
                        }}
                      >
                        <div>
                          <strong>{row.name}</strong>
                          <div
                            style={{
                              fontSize: '12px',
                              opacity: 0.6,
                              marginTop: '3px',
                            }}
                          >
                            {formatDate(row.startDate)} •{' '}
                            {row.screened} screened
                          </div>
                        </div>

                        <strong>{row.completion}%</strong>
                        <strong>
                          {row.symptomaticRate}%
                        </strong>
                        <strong>
                          {row.highRiskRate}%
                        </strong>
                        <strong>
                          {row.interventionRate}%
                        </strong>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div
                style={{
                  border:
                    '1px solid rgba(15, 23, 42, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  Recurring Body-Region Signals
                </h3>

                {crossCampaignAnalytics.bodyRegions.length ===
                0 ? (
                  <p>
                    No symptomatic body-region data recorded.
                  </p>
                ) : (
                  crossCampaignAnalytics.bodyRegions.map(
                    (item) => (
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
                        <span>
                          {formatLabel(item.region)}
                        </span>
                        <strong>{item.count}</strong>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            {crossCampaignAnalytics.latest &&
              crossCampaignAnalytics.previous && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '16px',
                    border:
                      '1px solid rgba(15, 23, 42, 0.1)',
                    borderRadius: '12px',
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>
                    Latest vs Previous Campaign
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '24px',
                    }}
                  >
                    <span>
                      Symptomatic:{' '}
                      <strong>
                        {crossCampaignAnalytics.latest
                          .symptomaticRate -
                          crossCampaignAnalytics.previous
                            .symptomaticRate >
                        0
                          ? '+'
                          : ''}
                        {crossCampaignAnalytics.latest
                          .symptomaticRate -
                          crossCampaignAnalytics.previous
                            .symptomaticRate}
                        {' percentage points'}
                      </strong>
                    </span>

                    <span>
                      High / Very High:{' '}
                      <strong>
                        {crossCampaignAnalytics.latest
                          .highRiskRate -
                          crossCampaignAnalytics.previous
                            .highRiskRate >
                        0
                          ? '+'
                          : ''}
                        {crossCampaignAnalytics.latest
                          .highRiskRate -
                          crossCampaignAnalytics.previous
                            .highRiskRate}
                        {' percentage points'}
                      </strong>
                    </span>

                    <span>
                      Intervention need:{' '}
                      <strong>
                        {crossCampaignAnalytics.latest
                          .interventionRate -
                          crossCampaignAnalytics.previous
                            .interventionRate >
                        0
                          ? '+'
                          : ''}
                        {crossCampaignAnalytics.latest
                          .interventionRate -
                          crossCampaignAnalytics.previous
                            .interventionRate}
                        {' percentage points'}
                      </strong>
                    </span>
                  </div>
                </div>
              )}

            <p
              style={{
                marginTop: '16px',
                marginBottom: 0,
                fontSize: '13px',
                opacity: 0.7,
              }}
            >
              Trend percentages describe recorded screening
              indicators in each campaign. Differences between
              campaigns do not by themselves establish that risk
              changed because of an intervention, workplace
              exposure, or any single causal factor.
            </p>
          </>
        )}
      </div>

      <div className="card">
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent:
              'space-between',
          }}
        >
          <div
            style={{
              position: 'relative',
              flex: '1 1 280px',
              maxWidth: '460px',
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
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
              placeholder="Search campaigns..."
              style={{
                width: '100%',
                paddingLeft: '42px',
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

            <option value="draft">
              Draft
            </option>

            <option value="active">
              Active
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>
        </div>
      </div>

      {filteredCampaigns.length === 0 ? (
        <div className="card">
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <ClipboardList
              size={42}
              style={{
                marginBottom: '14px',
                opacity: 0.45,
              }}
            />

            <h3>
              {campaigns.length === 0
                ? 'No screening campaigns yet'
                : 'No campaigns match your filters'}
            </h3>

            <p>
              {campaigns.length === 0
                ? 'Create a campaign to organise workforce MSK screening across sites, departments or job groups.'
                : 'Change your search or status filter to see other campaigns.'}
            </p>

            {campaigns.length === 0 && (
              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  navigate(
                    '/msk-campaigns/new'
                  )
                }
                style={{
                  marginTop: '14px',
                }}
              >
                <Plus size={18} />
                Create First Campaign
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: '16px',
          }}
        >
          {filteredCampaigns.map(
            (campaign) => {
              const stats =
                getCampaignStats(
                  campaign.id
                )

              const targetWorkers =
                campaign.target_workers ??
                0

              return (
                <div
                  className="card"
                  key={campaign.id}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      gap: '20px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{
                        flex: '1 1 420px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'center',
                          gap: '10px',
                          flexWrap:
                            'wrap',
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                          }}
                        >
                          {
                            campaign.campaign_name
                          }
                        </h3>

                        <span
                          style={{
                            padding:
                              '4px 9px',
                            borderRadius:
                              '999px',
                            fontSize:
                              '12px',
                            fontWeight: 700,
                            background:
                              'rgba(15, 23, 42, 0.07)',
                          }}
                        >
                          {formatLabel(
                            campaign.campaign_status
                          )}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: '8px',
                          opacity: 0.7,
                          fontSize: '14px',
                        }}
                      >
                        {campaign.campaign_code &&
                          `${campaign.campaign_code} • `}

                        {formatLabel(
                          campaign.campaign_type
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexWrap:
                            'wrap',
                          gap: '18px',
                          marginTop: '18px',
                          fontSize: '14px',
                        }}
                      >
                        <span>
                          <strong>
                            Target:
                          </strong>{' '}
                          {getTargetLabel(
                            campaign
                          )}
                        </span>

                        <span>
                          <CalendarDays
                            size={15}
                            style={{
                              verticalAlign:
                                'middle',
                              marginRight:
                                '5px',
                            }}
                          />

                          {formatDate(
                            campaign.start_date
                          )}

                          {campaign.end_date &&
                            ` – ${formatDate(
                              campaign.end_date
                            )}`}
                        </span>
                      </div>

                      {campaign.description && (
                        <p
                          style={{
                            marginTop:
                              '14px',
                            marginBottom: 0,
                          }}
                        >
                          {
                            campaign.description
                          }
                        </p>
                      )}
                    </div>

                    <div
                      style={{
                        minWidth: '280px',
                        flex: '0 1 360px',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns:
                            'repeat(3, 1fr)',
                          gap: '10px',
                          marginBottom:
                            '14px',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize:
                                '12px',
                              opacity: 0.65,
                            }}
                          >
                            Assigned
                          </div>

                          <strong>
                            {
                              stats.assigned
                            }
                          </strong>
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize:
                                '12px',
                              opacity: 0.65,
                            }}
                          >
                            Screened
                          </div>

                          <strong>
                            {
                              stats.screened
                            }
                          </strong>
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize:
                                '12px',
                              opacity: 0.65,
                            }}
                          >
                            Outstanding
                          </div>

                          <strong>
                            {
                              stats.outstanding
                            }
                          </strong>
                        </div>
                      </div>

                      <div
                        style={{
                          height: '8px',
                          borderRadius:
                            '999px',
                          overflow: 'hidden',
                          background:
                            'rgba(15, 23, 42, 0.08)',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(
                              stats.completion,
                              100
                            )}%`,
                            height: '100%',
                            background:
                              'currentColor',
                            opacity: 0.75,
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          marginTop: '7px',
                          fontSize: '13px',
                        }}
                      >
                        <span>
                          {
                            stats.completion
                          }
                          % complete
                        </span>

                        {targetWorkers >
                          0 && (
                          <span>
                            Target:{' '}
                            {
                              targetWorkers
                            }
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          navigate(
                            `/msk-campaigns/${campaign.id}`
                          )
                        }
                        style={{
                          width: '100%',
                          marginTop:
                            '16px',
                          justifyContent:
                            'center',
                        }}
                      >
                        Open Campaign

                        <ChevronRight
                          size={17}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
          )}
        </div>
      )}
    </div>
  )
}