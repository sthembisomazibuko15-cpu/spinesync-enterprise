import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  HeartPulse,
  MapPin,
  Network,
  RefreshCw,
  Search,
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
  current_msk_complaint: boolean
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
  overall_risk_level: string | null
  intervention_required: boolean
  reassessment_required: boolean
  recommended_rescreen_date: string | null
  screening_status: string
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
  intervention_type: string
  body_region: string | null
  intervention_status: string
}

type Operation = {
  id: string
  name: string
}

type Site = {
  id: string
  operation_id: string
  name: string
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
  description: string | null
}

type IntelligenceRow = {
  id: string
  label: string
  workers: number
  symptomatic: number
  moderatePlus: number
  highPlus: number
  intervention: number
  highRate: number
}

type WorkerRiskRow = {
  screening: Screening
  worker: Worker
  workerName: string
  operation: string
  site: string
  department: string
  jobProfile: string
}

const exposureFields: Array<{
  key: keyof Screening
  label: string
}> = [
  { key: 'manual_handling_exposure', label: 'Manual Handling' },
  { key: 'repetitive_work_exposure', label: 'Repetitive Work' },
  { key: 'awkward_posture_exposure', label: 'Awkward Posture' },
  { key: 'prolonged_posture_exposure', label: 'Prolonged Posture' },
  { key: 'vibration_exposure', label: 'Vibration' },
  { key: 'overhead_work_exposure', label: 'Overhead Work' },
  { key: 'kneeling_squatting_exposure', label: 'Kneeling / Squatting' },
  { key: 'confined_space_exposure', label: 'Confined Space' },
  { key: 'uneven_ground_exposure', label: 'Uneven Ground' },
  { key: 'prolonged_walking_exposure', label: 'Prolonged Walking' },
  { key: 'prolonged_standing_exposure', label: 'Prolonged Standing' },
]

export default function RiskIntelligence() {
  const navigate = useNavigate()

  const [workers, setWorkers] = useState<Worker[]>([])
  const [screenings, setScreenings] = useState<Screening[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [interventions, setInterventions] = useState<Intervention[]>([])
  const [operations, setOperations] = useState<Operation[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([])

  const [operationFilter, setOperationFilter] = useState('')
  const [siteFilter, setSiteFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [jobFilter, setJobFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadIntelligence()
  }, [])

  async function loadIntelligence() {
    setLoading(true)
    setError(null)

    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      setError(userError?.message || 'Unable to identify the signed-in user.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
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
      operationsResponse,
      sitesResponse,
      departmentsResponse,
      jobProfilesResponse,
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
          current_msk_complaint,
          manual_handling_exposure, repetitive_work_exposure,
          awkward_posture_exposure, prolonged_posture_exposure,
          vibration_exposure, overhead_work_exposure,
          kneeling_squatting_exposure, confined_space_exposure,
          uneven_ground_exposure, prolonged_walking_exposure,
          prolonged_standing_exposure,
          overall_risk_level, intervention_required,
          reassessment_required, recommended_rescreen_date,
          screening_status
        `)
        .eq('organisation_id', organisationId)
        .order('screening_date', { ascending: false }),

      supabase
        .from('msk_interventions')
        .select(`
          id, worker_id, screening_id, intervention_type,
          body_region, intervention_status
        `)
        .eq('organisation_id', organisationId),

      supabase
        .from('operations')
        .select('id, name')
        .eq('organisation_id', organisationId),

      supabase
        .from('sites')
        .select('id, operation_id, name'),

      supabase
        .from('departments')
        .select('id, site_id, name'),

      supabase
        .from('job_profiles')
        .select('id, title, job_code, description')
        .eq('organisation_id', organisationId),
    ])

    const firstError = [
      workersResponse.error,
      screeningsResponse.error,
      interventionsResponse.error,
      operationsResponse.error,
      sitesResponse.error,
      departmentsResponse.error,
      jobProfilesResponse.error,
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
    setOperations((operationsResponse.data ?? []) as Operation[])
    setSites((sitesResponse.data ?? []) as Site[])
    setDepartments((departmentsResponse.data ?? []) as Department[])
    setJobProfiles((jobProfilesResponse.data ?? []) as JobProfile[])
    setLoading(false)
  }

  const workerMap = useMemo(
    () => new Map(workers.map((item) => [item.id, item])),
    [workers]
  )

  const operationMap = useMemo(
    () => new Map(operations.map((item) => [item.id, item.name])),
    [operations]
  )

  const siteMap = useMemo(
    () => new Map(sites.map((item) => [item.id, item.name])),
    [sites]
  )

  const departmentMap = useMemo(
    () => new Map(departments.map((item) => [item.id, item.name])),
    [departments]
  )

  const jobMap = useMemo(
    () => new Map(jobProfiles.map((item) => [
      item.id,
      item.title || item.description || item.job_code || 'Unnamed Job Profile',
    ])),
    [jobProfiles]
  )

  const latestCompleted = useMemo(() => {
    const map = new Map<string, Screening>()

    screenings
      .filter((item) => item.screening_status === 'completed')
      .forEach((item) => {
        const existing = map.get(item.worker_id)

        if (!existing || item.screening_date > existing.screening_date) {
          map.set(item.worker_id, item)
        }
      })

    return Array.from(map.values())
  }, [screenings])

  const availableSites = useMemo(
    () => sites.filter((item) => !operationFilter || item.operation_id === operationFilter),
    [sites, operationFilter]
  )

  const availableDepartments = useMemo(() => {
    if (!siteFilter) return departments
    return departments.filter((item) => item.site_id === siteFilter)
  }, [departments, siteFilter])

  const filteredLatest = useMemo(() => {
    const query = search.trim().toLowerCase()

    return latestCompleted.filter((screening) => {
      const worker = workerMap.get(screening.worker_id)
      if (!worker) return false

      if (operationFilter && worker.operation_id !== operationFilter) return false
      if (siteFilter && worker.site_id !== siteFilter) return false
      if (departmentFilter && worker.department_id !== departmentFilter) return false
      if (jobFilter && worker.job_profile_id !== jobFilter) return false
      if (riskFilter && screening.overall_risk_level !== riskFilter) return false

      if (query) {
        const haystack = [
          worker.first_name,
          worker.last_name,
          worker.employee_number,
          worker.operation_id ? operationMap.get(worker.operation_id) : '',
          worker.site_id ? siteMap.get(worker.site_id) : '',
          worker.department_id ? departmentMap.get(worker.department_id) : '',
          worker.job_profile_id ? jobMap.get(worker.job_profile_id) : '',
        ]
          .join(' ')
          .toLowerCase()

        if (!haystack.includes(query)) return false
      }

      return true
    })
  }, [
    latestCompleted,
    workerMap,
    operationFilter,
    siteFilter,
    departmentFilter,
    jobFilter,
    riskFilter,
    search,
    operationMap,
    siteMap,
    departmentMap,
    jobMap,
  ])

  const filteredIds = useMemo(
    () => new Set(filteredLatest.map((item) => item.id)),
    [filteredLatest]
  )

  const workerRows = useMemo(() => {
    return filteredLatest
      .map((screening): WorkerRiskRow | null => {
        const worker = workerMap.get(screening.worker_id)
        if (!worker) return null

        return {
          screening,
          worker,
          workerName: `${worker.first_name} ${worker.last_name}`,
          operation: worker.operation_id
            ? operationMap.get(worker.operation_id) || 'Unknown'
            : 'Not Assigned',
          site: worker.site_id
            ? siteMap.get(worker.site_id) || 'Unknown'
            : 'Not Assigned',
          department: worker.department_id
            ? departmentMap.get(worker.department_id) || 'Unknown'
            : 'Not Assigned',
          jobProfile: worker.job_profile_id
            ? jobMap.get(worker.job_profile_id) || 'Unknown'
            : 'Not Assigned',
        }
      })
      .filter((item): item is WorkerRiskRow => item !== null)
      .sort((a, b) => riskWeight(b.screening.overall_risk_level) - riskWeight(a.screening.overall_risk_level))
  }, [
    filteredLatest,
    workerMap,
    operationMap,
    siteMap,
    departmentMap,
    jobMap,
  ])

  const symptomatic = filteredLatest.filter(
    (item) => item.current_msk_complaint
  ).length

  const moderatePlus = filteredLatest.filter(
    (item) =>
      item.overall_risk_level === 'moderate' ||
      item.overall_risk_level === 'high' ||
      item.overall_risk_level === 'very_high'
  ).length

  const highPlus = filteredLatest.filter(
    (item) =>
      item.overall_risk_level === 'high' ||
      item.overall_risk_level === 'very_high'
  ).length

  const interventionRequired = filteredLatest.filter(
    (item) => item.intervention_required
  ).length

  const activeInterventions = interventions.filter(
    (item) =>
      filteredLatest.some((screening) => screening.worker_id === item.worker_id) &&
      (item.intervention_status === 'planned' || item.intervention_status === 'active')
  ).length

  const riskDistribution = useMemo(() => {
    const result = { low: 0, moderate: 0, high: 0, veryHigh: 0 }

    filteredLatest.forEach((item) => {
      if (item.overall_risk_level === 'low') result.low += 1
      if (item.overall_risk_level === 'moderate') result.moderate += 1
      if (item.overall_risk_level === 'high') result.high += 1
      if (item.overall_risk_level === 'very_high') result.veryHigh += 1
    })

    return result
  }, [filteredLatest])

  const bodyRegions = useMemo(() => {
    const map = new Map<string, {
      region: string
      symptomatic: number
      workRelated: number
      workImpact: number
      highPain: number
      score: number
    }>()

    symptoms.forEach((item) => {
      if (!filteredIds.has(item.screening_id) || !item.symptoms_present) return

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
      .slice(0, 10)
  }, [symptoms, filteredIds])

  const exposureSignals = useMemo(() => {
    return exposureFields
      .map((field) => ({
        label: field.label,
        count: filteredLatest.filter((screening) => Boolean(screening[field.key])).length,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [filteredLatest])

  function makeIntelligenceRows(
    getId: (worker: Worker) => string | null,
    labels: Map<string, string>
  ) {
    const map = new Map<string, IntelligenceRow>()

    filteredLatest.forEach((screening) => {
      const worker = workerMap.get(screening.worker_id)
      if (!worker) return

      const id = getId(worker)
      if (!id) return

      const row = map.get(id) || {
        id,
        label: labels.get(id) || 'Unknown',
        workers: 0,
        symptomatic: 0,
        moderatePlus: 0,
        highPlus: 0,
        intervention: 0,
        highRate: 0,
      }

      row.workers += 1
      if (screening.current_msk_complaint) row.symptomatic += 1

      if (
        screening.overall_risk_level === 'moderate' ||
        screening.overall_risk_level === 'high' ||
        screening.overall_risk_level === 'very_high'
      ) {
        row.moderatePlus += 1
      }

      if (
        screening.overall_risk_level === 'high' ||
        screening.overall_risk_level === 'very_high'
      ) {
        row.highPlus += 1
      }

      if (screening.intervention_required) row.intervention += 1

      row.highRate = row.workers > 0
        ? Math.round((row.highPlus / row.workers) * 100)
        : 0

      map.set(id, row)
    })

    return Array.from(map.values())
      .sort((a, b) => b.highRate - a.highRate || b.highPlus - a.highPlus)
  }

  const operationRows = useMemo(
    () => makeIntelligenceRows(
      (worker) => worker.operation_id,
      operationMap
    ),
    [filteredLatest, workerMap, operationMap]
  )

  const siteRows = useMemo(
    () => makeIntelligenceRows(
      (worker) => worker.site_id,
      siteMap
    ),
    [filteredLatest, workerMap, siteMap]
  )

  const departmentRows = useMemo(
    () => makeIntelligenceRows(
      (worker) => worker.department_id,
      departmentMap
    ),
    [filteredLatest, workerMap, departmentMap]
  )

  const jobRows = useMemo(
    () => makeIntelligenceRows(
      (worker) => worker.job_profile_id,
      jobMap
    ),
    [filteredLatest, workerMap, jobMap]
  )

  function clearFilters() {
    setOperationFilter('')
    setSiteFilter('')
    setDepartmentFilter('')
    setJobFilter('')
    setRiskFilter('')
    setSearch('')
  }

  function handleOperationChange(value: string) {
    setOperationFilter(value)
    setSiteFilter('')
    setDepartmentFilter('')
  }

  function handleSiteChange(value: string) {
    setSiteFilter(value)
    setDepartmentFilter('')
  }

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

  function riskWeight(value: string | null) {
    if (value === 'very_high') return 4
    if (value === 'high') return 3
    if (value === 'moderate') return 2
    if (value === 'low') return 1
    return 0
  }

  function IntelligenceTable({
    title,
    description,
    icon,
    firstColumn,
    rows,
  }: {
    title: string
    description: string
    icon: React.ReactNode
    firstColumn: string
    rows: IntelligenceRow[]
  }) {
    return (
      <div className="panel">
        <div className="assessment-section-title">
          <div className="assessment-section-icon">{icon}</div>
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            No linked screening data is available for the current filters.
          </p>
        ) : (
          <div className="fce-report-table-wrap" style={{ marginTop: 20 }}>
            <table className="fce-report-table">
              <thead>
                <tr>
                  <th>{firstColumn}</th>
                  <th>Workers</th>
                  <th>Symptomatic</th>
                  <th>Moderate+</th>
                  <th>High / Very High</th>
                  <th>Intervention</th>
                  <th>High+ Rate</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.label}</strong></td>
                    <td>{item.workers}</td>
                    <td>{item.symptomatic}</td>
                    <td>{item.moderatePlus}</td>
                    <td>{item.highPlus}</td>
                    <td>{item.intervention}</td>
                    <td>{item.highRate}%</td>
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
        <p>Loading organisation risk intelligence...</p>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SPINESYNC ENTERPRISE</span>
          <h1>Risk Intelligence</h1>
          <p>
            Organisation-wide MSK screening intelligence across operations,
            sites, departments and job profiles.
          </p>
        </div>

        <button className="secondary-button" onClick={loadIntelligence}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="panel">
        <div className="assessment-section-title">
          <div className="assessment-section-icon">
            <Search size={20} />
          </div>

          <div>
            <h2>Intelligence Filters</h2>
            <p>Focus the current workforce view on a specific organisational group.</p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
            marginTop: 20,
          }}
        >
          <select
            value={operationFilter}
            onChange={(event) => handleOperationChange(event.target.value)}
          >
            <option value="">All Operations</option>
            {operations.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>

          <select
            value={siteFilter}
            onChange={(event) => handleSiteChange(event.target.value)}
          >
            <option value="">All Sites</option>
            {availableSites.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
          >
            <option value="">All Departments</option>
            {availableDepartments.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>

          <select
            value={jobFilter}
            onChange={(event) => setJobFilter(event.target.value)}
          >
            <option value="">All Job Profiles</option>
            {jobProfiles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title || item.description || item.job_code || 'Unnamed Job Profile'}
              </option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
          >
            <option value="">All Risk Levels</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="very_high">Very High</option>
          </select>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 14,
            flexWrap: 'wrap',
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search worker, employee number or work area..."
            style={{ flex: '1 1 320px' }}
          />

          <button className="secondary-button" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      <div className="fce-summary-row">
        <div>
          <Users size={18} />
          <span>WORKERS IN VIEW</span>
          <strong>{filteredLatest.length}</strong>
        </div>

        <div>
          <HeartPulse size={18} />
          <span>SYMPTOMATIC</span>
          <strong>{symptomatic}</strong>
        </div>

        <div>
          <AlertTriangle size={18} />
          <span>MODERATE+</span>
          <strong>{moderatePlus}</strong>
        </div>

        <div>
          <ShieldCheck size={18} />
          <span>HIGH / VERY HIGH</span>
          <strong>{highPlus}</strong>
        </div>
      </div>

      <div className="fce-summary-row">
        <div>
          <ShieldCheck size={18} />
          <span>INTERVENTION REQUIRED</span>
          <strong>{interventionRequired}</strong>
        </div>

        <div>
          <HeartPulse size={18} />
          <span>ACTIVE INTERVENTIONS</span>
          <strong>{activeInterventions}</strong>
        </div>

        <div>
          <Users size={18} />
          <span>SCREENED WORKERS</span>
          <strong>{latestCompleted.length}</strong>
        </div>

        <div>
          <AlertTriangle size={18} />
          <span>HIGH+ RATE</span>
          <strong>
            {filteredLatest.length > 0
              ? Math.round((highPlus / filteredLatest.length) * 100)
              : 0}%
          </strong>
        </div>
      </div>

      <div className="panel">
        <h2>Current Risk Distribution</h2>
        <p>
          Latest completed screening per worker within the selected organisational view.
        </p>

        <div className="fce-summary-row" style={{ marginTop: 20 }}>
          <div><span>LOW</span><strong>{riskDistribution.low}</strong></div>
          <div><span>MODERATE</span><strong>{riskDistribution.moderate}</strong></div>
          <div><span>HIGH</span><strong>{riskDistribution.high}</strong></div>
          <div><span>VERY HIGH</span><strong>{riskDistribution.veryHigh}</strong></div>
        </div>
      </div>

      <IntelligenceTable
        title="Operation Intelligence"
        description="Current MSK screening indicators grouped by mining operation."
        icon={<Network size={20} />}
        firstColumn="Operation"
        rows={operationRows}
      />

      <IntelligenceTable
        title="Site Intelligence"
        description="Current MSK screening indicators grouped by work site."
        icon={<MapPin size={20} />}
        firstColumn="Site"
        rows={siteRows}
      />

      <IntelligenceTable
        title="Department Intelligence"
        description="Current MSK screening indicators grouped by worker department."
        icon={<Building2 size={20} />}
        firstColumn="Department"
        rows={departmentRows}
      />

      <IntelligenceTable
        title="Job Profile Intelligence"
        description="Current MSK screening indicators grouped by assigned job profile."
        icon={<BriefcaseBusiness size={20} />}
        firstColumn="Job Profile"
        rows={jobRows}
      />

      <div className="panel">
        <h2>Body-Region Hotspots</h2>
        <p>
          Symptomatic regions from the latest completed screening for workers currently in view.
        </p>

        {bodyRegions.length === 0 ? (
          <p style={{ marginTop: 20 }}>No symptomatic body-region data is available.</p>
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

      <div className="panel">
        <h2>Occupational Exposure Signals</h2>
        <p>
          Recorded work-exposure indicators from the latest completed screenings in view.
        </p>

        {exposureSignals.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            No occupational exposure indicators are recorded for this selection.
          </p>
        ) : (
          <div className="fce-report-table-wrap" style={{ marginTop: 20 }}>
            <table className="fce-report-table">
              <thead>
                <tr>
                  <th>Exposure</th>
                  <th>Workers</th>
                  <th>Recorded Rate</th>
                </tr>
              </thead>

              <tbody>
                {exposureSignals.map((item) => (
                  <tr key={item.label}>
                    <td><strong>{item.label}</strong></td>
                    <td>{item.count}</td>
                    <td>
                      {filteredLatest.length > 0
                        ? Math.round((item.count / filteredLatest.length) * 100)
                        : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Worker Risk Drill-Down</h2>
        <p>
          Workers represented in the current intelligence view, ordered by recorded risk category.
        </p>

        {workerRows.length === 0 ? (
          <p style={{ marginTop: 20 }}>
            No completed worker screenings match the current filters.
          </p>
        ) : (
          <div className="fce-report-table-wrap" style={{ marginTop: 20 }}>
            <table className="fce-report-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Employee No.</th>
                  <th>Operation</th>
                  <th>Site</th>
                  <th>Department</th>
                  <th>Job Profile</th>
                  <th>Screened</th>
                  <th>Risk</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {workerRows.map((item) => (
                  <tr key={item.screening.id}>
                    <td><strong>{item.workerName}</strong></td>
                    <td>{item.worker.employee_number || '—'}</td>
                    <td>{item.operation}</td>
                    <td>{item.site}</td>
                    <td>{item.department}</td>
                    <td>{item.jobProfile}</td>
                    <td>{formatDate(item.screening.screening_date)}</td>
                    <td>{formatLabel(item.screening.overall_risk_level)}</td>
                    <td>
                      <button
                        className="secondary-button"
                        onClick={() =>
                          navigate(`/msk-screenings/${item.screening.id}/risk`)
                        }
                      >
                        View Risk
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
            <h2>Risk Intelligence Interpretation</h2>
            <p>Enterprise MSK surveillance for preventive decision support.</p>
          </div>
        </div>

        <p>
          These indicators summarise recorded MSK screening, symptom,
          occupational-exposure and preventive-intervention information.
          Higher concentrations identify groups warranting further preventive
          attention and investigation. They do not predict that an injury will
          occur, establish that workplace exposure caused a symptom, or
          independently determine medical or occupational fitness.
        </p>
      </div>
    </div>
  )
}
