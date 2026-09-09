import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ClipboardPlus,
  HeartPulse,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  operation_id: string | null
  site_id: string | null
  department_id: string | null
  job_profile_id: string | null
  employment_status: string | null
}

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
  recommended_rescreen_date: string | null
}

type Symptom = {
  screening_id: string
  body_region: string
  symptoms_present: boolean
  pain_score: number | null
  work_related: boolean
  aggravated_by_work: boolean
  affects_work_performance: boolean
}

type Intervention = {
  id: string
  worker_id: string
  screening_id: string | null
  intervention_status: string
}

type JobProfile = {
  id: string
  job_code: string | null
  description: string | null
}

type NamedItem = {
  id: string
  name: string
}

type RecentRow = Screening & {
  workerName: string
  employeeNumber: string
  jobProfile: string
}

type RankedItem = {
  id: string
  label: string
  screened: number
  elevated: number
  high: number
  rate: number
}

export default function Dashboard() {
  const navigate = useNavigate()

  const [workers, setWorkers] = useState<Worker[]>([])
  const [screenings, setScreenings] = useState<Screening[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([])
  const [departments, setDepartments] = useState<NamedItem[]>([])
  const [sites, setSites] = useState<NamedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError(null)

    const { data: userData, error: userError } =
      await supabase.auth.getUser()

    if (userError || !userData.user) {
      setError(userError?.message || 'Unable to identify the signed-in user.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('organisation_id')
        .eq('id', userData.user.id)
        .single()

    if (profileError || !profile?.organisation_id) {
      setError(profileError?.message || 'No organisation is linked to this profile.')
      setLoading(false)
      return
    }

    const organisationId = profile.organisation_id

    const [
      workersResponse,
      screeningsResponse,
      interventionsResponse,
      jobProfilesResponse,
      departmentsResponse,
      sitesResponse,
    ] = await Promise.all([
      supabase
        .from('workers')
        .select(`
          id, employee_number, first_name, last_name,
          operation_id, site_id, department_id, job_profile_id,
          employment_status
        `)
        .eq('organisation_id', organisationId),

      supabase
        .from('msk_screenings')
        .select(`
          id, worker_id, screening_date, screening_type,
          overall_risk_level, screening_status, current_msk_complaint,
          intervention_required, reassessment_required,
          recommended_rescreen_date
        `)
        .eq('organisation_id', organisationId)
        .order('screening_date', { ascending: false }),

      supabase
        .from('msk_interventions')
        .select('id, worker_id, screening_id, intervention_status')
        .eq('organisation_id', organisationId),

      supabase
        .from('job_profiles')
        .select('id, job_code, description')
        .eq('organisation_id', organisationId),

      supabase.from('departments').select('id, name'),
      supabase.from('sites').select('id, name'),
    ])

    const firstError = [
      workersResponse.error,
      screeningsResponse.error,
      interventionsResponse.error,
      jobProfilesResponse.error,
      departmentsResponse.error,
      sitesResponse.error,
    ].find(Boolean)

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    const loadedScreenings = (screeningsResponse.data ?? []) as Screening[]
    const screeningIds = loadedScreenings.map((item) => item.id)

    let loadedSymptoms: Symptom[] = []

    if (screeningIds.length > 0) {
      const symptomsResponse = await supabase
        .from('msk_symptoms')
        .select(`
          screening_id, body_region, symptoms_present, pain_score,
          work_related, aggravated_by_work, affects_work_performance
        `)
        .in('screening_id', screeningIds)

      if (symptomsResponse.error) {
        setError(symptomsResponse.error.message)
        setLoading(false)
        return
      }

      loadedSymptoms = (symptomsResponse.data ?? []) as Symptom[]
    }

    setWorkers((workersResponse.data ?? []) as Worker[])
    setScreenings(loadedScreenings)
    setSymptoms(loadedSymptoms)
    setInterventions((interventionsResponse.data ?? []) as Intervention[])
    setJobProfiles((jobProfilesResponse.data ?? []) as JobProfile[])
    setDepartments((departmentsResponse.data ?? []) as NamedItem[])
    setSites((sitesResponse.data ?? []) as NamedItem[])
    setLoading(false)
  }

  const workerMap = useMemo(() => {
    const map = new Map<string, Worker>()
    workers.forEach((worker) => map.set(worker.id, worker))
    return map
  }, [workers])

  const jobMap = useMemo(() => {
    const map = new Map<string, JobProfile>()
    jobProfiles.forEach((item) => map.set(item.id, item))
    return map
  }, [jobProfiles])

  const activeWorkers = useMemo(
    () => workers.filter((worker) => worker.employment_status !== 'inactive').length,
    [workers]
  )

  const completedScreenings = useMemo(
    () => screenings.filter((item) => item.screening_status === 'completed'),
    [screenings]
  )

  const latestScreenings = useMemo(() => {
    const map = new Map<string, Screening>()

    completedScreenings.forEach((item) => {
      const existing = map.get(item.worker_id)
      if (!existing || item.screening_date > existing.screening_date) {
        map.set(item.worker_id, item)
      }
    })

    return Array.from(map.values())
  }, [completedScreenings])

  const workersScreened = new Set(
    completedScreenings.map((item) => item.worker_id)
  ).size

  const coverage = activeWorkers > 0
    ? Math.round((workersScreened / activeWorkers) * 100)
    : 0

  const highRisk = latestScreenings.filter(
    (item) =>
      item.overall_risk_level === 'high' ||
      item.overall_risk_level === 'very_high'
  ).length

  const moderatePlus = latestScreenings.filter(
    (item) =>
      item.overall_risk_level === 'moderate' ||
      item.overall_risk_level === 'high' ||
      item.overall_risk_level === 'very_high'
  ).length

  const symptomatic = latestScreenings.filter(
    (item) => item.current_msk_complaint
  ).length

  const activeInterventions = interventions.filter(
    (item) =>
      item.intervention_status === 'planned' ||
      item.intervention_status === 'active'
  ).length

  const today = new Date().toISOString().slice(0, 10)

  const rescreensDue = latestScreenings.filter(
    (item) =>
      item.reassessment_required &&
      item.recommended_rescreen_date &&
      item.recommended_rescreen_date <= today
  ).length

  const riskDistribution = useMemo(() => {
    const values = { low: 0, moderate: 0, high: 0, veryHigh: 0 }

    latestScreenings.forEach((item) => {
      if (item.overall_risk_level === 'low') values.low += 1
      if (item.overall_risk_level === 'moderate') values.moderate += 1
      if (item.overall_risk_level === 'high') values.high += 1
      if (item.overall_risk_level === 'very_high') values.veryHigh += 1
    })

    return values
  }, [latestScreenings])

  const bodyRegions = useMemo(() => {
    const latestIds = new Set(latestScreenings.map((item) => item.id))
    const map = new Map<string, {
      region: string
      symptomatic: number
      workRelated: number
      workImpact: number
      highPain: number
      score: number
    }>()

    symptoms.forEach((item) => {
      if (!latestIds.has(item.screening_id) || !item.symptoms_present) return

      const row = map.get(item.body_region) || {
        region: item.body_region,
        symptomatic: 0,
        workRelated: 0,
        workImpact: 0,
        highPain: 0,
        score: 0,
      }

      row.symptomatic += 1
      if (item.work_related || item.aggravated_by_work) row.workRelated += 1
      if (item.affects_work_performance) row.workImpact += 1
      if ((item.pain_score ?? 0) >= 7) row.highPain += 1

      row.score =
        row.symptomatic +
        row.workRelated +
        row.workImpact * 2 +
        row.highPain * 2

      map.set(item.body_region, row)
    })

    return Array.from(map.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
  }, [symptoms, latestScreenings])

  function makeRanking(
    getId: (worker: Worker) => string | null,
    labels: Map<string, string>
  ) {
    const map = new Map<string, RankedItem>()

    latestScreenings.forEach((screening) => {
      const worker = workerMap.get(screening.worker_id)
      if (!worker) return

      const id = getId(worker)
      if (!id) return

      const row = map.get(id) || {
        id,
        label: labels.get(id) || 'Unknown',
        screened: 0,
        elevated: 0,
        high: 0,
        rate: 0,
      }

      row.screened += 1

      if (
        screening.overall_risk_level === 'moderate' ||
        screening.overall_risk_level === 'high' ||
        screening.overall_risk_level === 'very_high'
      ) row.elevated += 1

      if (
        screening.overall_risk_level === 'high' ||
        screening.overall_risk_level === 'very_high'
      ) row.high += 1

      row.rate = Math.round((row.elevated / row.screened) * 100)
      map.set(id, row)
    })

    return Array.from(map.values())
      .sort((a, b) => b.rate - a.rate || b.elevated - a.elevated)
      .slice(0, 6)
  }

  const jobRisk = useMemo(() => {
    const labels = new Map<string, string>()
    jobProfiles.forEach((item) =>
      labels.set(item.id, item.description || item.job_code || 'Unnamed Job Profile')
    )
    return makeRanking((worker) => worker.job_profile_id, labels)
  }, [latestScreenings, workerMap, jobProfiles])

  const departmentRisk = useMemo(() => {
    const labels = new Map(departments.map((item) => [item.id, item.name]))
    return makeRanking((worker) => worker.department_id, labels)
  }, [latestScreenings, workerMap, departments])

  const siteRisk = useMemo(() => {
    const labels = new Map(sites.map((item) => [item.id, item.name]))
    return makeRanking((worker) => worker.site_id, labels)
  }, [latestScreenings, workerMap, sites])

  const recentScreenings = useMemo(() => {
    return screenings.slice(0, 8).map((screening) => {
      const worker = workerMap.get(screening.worker_id)
      const profile = worker?.job_profile_id
        ? jobMap.get(worker.job_profile_id)
        : null

      return {
        ...screening,
        workerName: worker
          ? `${worker.first_name} ${worker.last_name}`
          : 'Unknown Worker',
        employeeNumber: worker?.employee_number || '—',
        jobProfile: profile?.description || profile?.job_code || 'Not Assigned',
      }
    }) as RecentRow[]
  }, [screenings, workerMap, jobMap])

  function formatLabel(value: string | null | undefined) {
    if (!value) return 'Not Recorded'

    return value
      .split('_')
      .join(' ')
      .replace(/\b\w/g, (letter: string) => letter.toUpperCase())
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return '—'

    return new Date(`${value}T00:00:00`).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  function openScreening(item: Screening) {
    navigate(
      item.screening_status === 'completed'
        ? `/msk-screenings/${item.id}/risk`
        : `/msk-screenings/${item.id}`
    )
  }

  function RankingTable({
    title,
    description,
    firstColumn,
    rows,
  }: {
    title: string
    description: string
    firstColumn: string
    rows: RankedItem[]
  }) {
    return (
      <div className="panel">
        <h2>{title}</h2>
        <p>{description}</p>

        {rows.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            No linked screening data is available yet.
          </p>
        ) : (
          <div className="fce-report-table-wrap" style={{ marginTop: 20 }}>
            <table className="fce-report-table">
              <thead>
                <tr>
                  <th>{firstColumn}</th>
                  <th>Screened</th>
                  <th>Moderate+</th>
                  <th>High / Very High</th>
                  <th>Elevated Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.label}</strong></td>
                    <td>{item.screened}</td>
                    <td>{item.elevated}</td>
                    <td>{item.high}</td>
                    <td>{item.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Loading MSK prevention dashboard...</p>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SPINESYNC ENTERPRISE</span>
          <h1>MSK Risk Dashboard</h1>
          <p>
            Workforce musculoskeletal screening, risk detection,
            prevention and re-screening intelligence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="secondary-button" onClick={loadDashboard}>
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="primary-button"
            onClick={() => navigate('/msk-screenings/new')}
          >
            <ClipboardPlus size={16} />
            New Screening
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="fce-summary-row">
        <div>
          <Users size={18} />
          <span>ACTIVE WORKERS</span>
          <strong>{activeWorkers}</strong>
        </div>

        <div>
          <ShieldCheck size={18} />
          <span>WORKERS SCREENED</span>
          <strong>{workersScreened}</strong>
        </div>

        <div>
          <AlertTriangle size={18} />
          <span>HIGH / VERY HIGH</span>
          <strong>{highRisk}</strong>
        </div>

        <div>
          <HeartPulse size={18} />
          <span>ACTIVE INTERVENTIONS</span>
          <strong>{activeInterventions}</strong>
        </div>
      </div>

      <div className="panel">
        <h2>Prevention Overview</h2>
        <p>Current workforce MSK surveillance indicators.</p>

        <div className="fce-summary-row" style={{ marginTop: 20 }}>
          <div>
            <Activity size={18} />
            <span>SCREENING COVERAGE</span>
            <strong>{coverage}%</strong>
          </div>

          <div>
            <AlertTriangle size={18} />
            <span>MODERATE+</span>
            <strong>{moderatePlus}</strong>
          </div>

          <div>
            <HeartPulse size={18} />
            <span>SYMPTOMATIC</span>
            <strong>{symptomatic}</strong>
          </div>

          <div>
            <CalendarDays size={18} />
            <span>RE-SCREENS DUE</span>
            <strong>{rescreensDue}</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2>Current Worker Risk Distribution</h2>
        <p>
          Latest completed screening per worker, so repeated re-screens
          are not counted as separate current-risk cases.
        </p>

        <div className="fce-summary-row" style={{ marginTop: 20 }}>
          <div><span>LOW</span><strong>{riskDistribution.low}</strong></div>
          <div><span>MODERATE</span><strong>{riskDistribution.moderate}</strong></div>
          <div><span>HIGH</span><strong>{riskDistribution.high}</strong></div>
          <div><span>VERY HIGH</span><strong>{riskDistribution.veryHigh}</strong></div>
        </div>
      </div>

      <div className="panel">
        <h2>Body-Region MSK Signals</h2>
        <p>
          Most prominent symptomatic regions from each worker's latest
          completed screening.
        </p>

        {bodyRegions.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            No symptomatic body-region data has been recorded yet.
          </p>
        ) : (
          <div className="fce-report-table-wrap" style={{ marginTop: 20 }}>
            <table className="fce-report-table">
              <thead>
                <tr>
                  <th>Body Region</th>
                  <th>Symptomatic</th>
                  <th>Work Related / Aggravated</th>
                  <th>Work Impact</th>
                  <th>Pain ≥ 7</th>
                </tr>
              </thead>
              <tbody>
                {bodyRegions.map((item) => (
                  <tr key={item.region}>
                    <td><strong>{formatLabel(item.region)}</strong></td>
                    <td>{item.symptomatic}</td>
                    <td>{item.workRelated}</td>
                    <td>{item.workImpact}</td>
                    <td>{item.highPain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RankingTable
        title="Job Profile Risk Signals"
        description="Latest screening results grouped by assigned job profile."
        firstColumn="Job Profile"
        rows={jobRisk}
      />

      <RankingTable
        title="Department Risk Signals"
        description="Current elevated-risk burden by worker department."
        firstColumn="Department"
        rows={departmentRisk}
      />

      <RankingTable
        title="Site Risk Signals"
        description="Current elevated-risk burden by work site."
        firstColumn="Site"
        rows={siteRisk}
      />

      <div className="panel">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 20,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <div>
            <h2>Recent MSK Screenings</h2>
            <p>Latest workforce screening activity recorded in SpineSync.</p>
          </div>

          <button
            className="secondary-button"
            onClick={() => navigate('/msk-screenings')}
          >
            View All
            <ArrowRight size={16} />
          </button>
        </div>

        {recentScreenings.length === 0 ? (
          <p style={{ marginTop: 20 }}>No MSK screenings have been recorded yet.</p>
        ) : (
          <div className="fce-report-table-wrap" style={{ marginTop: 20 }}>
            <table className="fce-report-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Employee No.</th>
                  <th>Job Profile</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentScreenings.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.workerName}</strong></td>
                    <td>{item.employeeNumber}</td>
                    <td>{item.jobProfile}</td>
                    <td>{formatDate(item.screening_date)}</td>
                    <td>{formatLabel(item.screening_type)}</td>
                    <td>{formatLabel(item.overall_risk_level)}</td>
                    <td>{formatLabel(item.screening_status)}</td>
                    <td>
                      <button
                        className="secondary-button"
                        onClick={() => openScreening(item)}
                      >
                        {item.screening_status === 'completed' ? 'View' : 'Continue'}
                      </button>
                    </td>
                  </tr>
                ))}
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
            <h2>Prevention Intelligence</h2>
            <p>Enterprise MSK surveillance for preventive decision support.</p>
          </div>
        </div>

        <p>
          Dashboard indicators summarise recorded MSK screening and
          preventive-intervention data. They support identification of
          areas warranting preventive attention, follow-up prioritisation,
          and trend monitoring. They do not predict that an injury will
          occur and do not independently determine medical or occupational
          fitness.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
          <button className="secondary-button" onClick={() => navigate('/workers')}>
            <Users size={16} />
            Workers
          </button>

          <button
            className="primary-button"
            onClick={() => navigate('/msk-screenings')}
          >
            <HeartPulse size={16} />
            MSK Screening
          </button>

          <button
            className="secondary-button"
            onClick={() => navigate('/assessments')}
          >
            <Activity size={16} />
            FCE / Clinical
          </button>

          <button className="secondary-button" onClick={() => navigate('/reports')}>
            Reports
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
