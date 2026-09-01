import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Filter,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Users,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

type Assessment = {
  id: string
  worker_id: string
  assessment_date: string
  assessment_status: string
  final_outcome: string | null
}

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  job_profile_id: string | null
  operation_id: string | null
  site_id: string | null
  department_id: string | null
}

type JobProfile = {
  id: string
  title: string
}

type StructureItem = {
  id: string
  name: string
}

type Site = StructureItem & {
  operation_id: string | null
}

type Department = StructureItem & {
  operation_id: string | null
  site_id: string | null
}

type FceResult = {
  id: string
  assessment_id: string
  test_name: string
  result: string | null
  measured_value: number | null
  required_value: number | null
  assessor_rating: string | null
}

type RehabilitationCase = {
  id: string
  worker_id: string
  referral_date: string
  case_status: string
  current_work_status: string | null
  discharge_outcome: string | null
  sessions_completed: number
  planned_sessions: number | null
}

type JobSummary = {
  id: string
  title: string
  assessments: number
  failures: number
  borderline: number
  capacityGaps: number
}

type DemandSummary = {
  name: string
  assessments: number
  failures: number
  borderline: number
}

type RiskWorker = {
  workerId: string
  name: string
  employeeNumber: string
  jobTitle: string
  operation: string
  site: string
  department: string
  outcome: string
  assessmentDate: string
}

type DateFilter =
  | 'all'
  | '30'
  | '90'
  | '365'

export default function Reports() {
  const [assessments, setAssessments] =
    useState<Assessment[]>([])

  const [workers, setWorkers] =
    useState<Worker[]>([])

  const [jobProfiles, setJobProfiles] =
    useState<JobProfile[]>([])

  const [operations, setOperations] =
    useState<StructureItem[]>([])

  const [sites, setSites] =
    useState<Site[]>([])

  const [departments, setDepartments] =
    useState<Department[]>([])

  const [results, setResults] =
    useState<FceResult[]>([])

  const [rehabCases, setRehabCases] =
    useState<RehabilitationCase[]>([])

  const [dateFilter, setDateFilter] =
    useState<DateFilter>('all')

  const [operationFilter, setOperationFilter] =
    useState('all')

  const [siteFilter, setSiteFilter] =
    useState('all')

  const [departmentFilter, setDepartmentFilter] =
    useState('all')

  const [jobFilter, setJobFilter] =
    useState('all')

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)
    setError(null)

    const [
      assessmentResponse,
      workerResponse,
      jobResponse,
      operationResponse,
      siteResponse,
      departmentResponse,
      rehabResponse,
    ] = await Promise.all([
      supabase
        .from('assessments')
        .select(`
          id,
          worker_id,
          assessment_date,
          assessment_status,
          final_outcome
        `)
        .order('assessment_date', {
          ascending: false,
        }),

      supabase
        .from('workers')
        .select(`
          id,
          employee_number,
          first_name,
          last_name,
          job_profile_id,
          operation_id,
          site_id,
          department_id
        `),

      supabase
        .from('job_profiles')
        .select(`
          id,
          title
        `),

      supabase
        .from('operations')
        .select(`
          id,
          name
        `)
        .order('name'),

      supabase
        .from('sites')
        .select(`
          id,
          name,
          operation_id
        `)
        .order('name'),

      supabase
        .from('departments')
        .select(`
          id,
          name,
          operation_id,
          site_id
        `)
        .order('name'),

      supabase
        .from('rehabilitation_cases')
        .select(`
          id,
          worker_id,
          referral_date,
          case_status,
          current_work_status,
          discharge_outcome,
          sessions_completed,
          planned_sessions
        `)
        .order('referral_date', {
          ascending: false,
        }),
    ])

    const firstError =
      assessmentResponse.error ||
      workerResponse.error ||
      jobResponse.error ||
      operationResponse.error ||
      siteResponse.error ||
      departmentResponse.error ||
      rehabResponse.error

    if (firstError) {
      setError(firstError.message)
      setLoading(false)
      return
    }

    const loadedAssessments =
      (assessmentResponse.data ??
        []) as Assessment[]

    setAssessments(loadedAssessments)

    setWorkers(
      (workerResponse.data ??
        []) as Worker[]
    )

    setJobProfiles(
      (jobResponse.data ??
        []) as JobProfile[]
    )

    setOperations(
      (operationResponse.data ??
        []) as StructureItem[]
    )

    setSites(
      (siteResponse.data ??
        []) as Site[]
    )

    setDepartments(
      (departmentResponse.data ??
        []) as Department[]
    )

    setRehabCases(
      (rehabResponse.data ??
        []) as RehabilitationCase[]
    )

    if (loadedAssessments.length === 0) {
      setResults([])
      setLoading(false)
      return
    }

    const assessmentIds =
      loadedAssessments.map(
        (item) => item.id
      )

    const {
      data: resultData,
      error: resultError,
    } = await supabase
      .from('fce_results')
      .select(`
        id,
        assessment_id,
        test_name,
        result,
        measured_value,
        required_value,
        assessor_rating
      `)
      .in(
        'assessment_id',
        assessmentIds
      )

    if (resultError) {
      setError(resultError.message)
      setLoading(false)
      return
    }

    setResults(
      (resultData ??
        []) as FceResult[]
    )

    setLoading(false)
  }

  function dateInsideFilter(
    value: string
  ) {
    if (dateFilter === 'all') {
      return true
    }

    const days = Number(dateFilter)

    const itemDate =
      new Date(`${value}T00:00:00`)

    const threshold = new Date()

    threshold.setHours(
      0,
      0,
      0,
      0
    )

    threshold.setDate(
      threshold.getDate() - days
    )

    return itemDate >= threshold
  }

  const workerMap = useMemo(() => {
    const map =
      new Map<string, Worker>()

    workers.forEach((worker) => {
      map.set(worker.id, worker)
    })

    return map
  }, [workers])

  const jobMap = useMemo(() => {
    const map =
      new Map<string, JobProfile>()

    jobProfiles.forEach((item) => {
      map.set(item.id, item)
    })

    return map
  }, [jobProfiles])

  const operationMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          StructureItem
        >()

      operations.forEach((item) => {
        map.set(item.id, item)
      })

      return map
    }, [operations])

  const siteMap = useMemo(() => {
    const map =
      new Map<string, Site>()

    sites.forEach((item) => {
      map.set(item.id, item)
    })

    return map
  }, [sites])

  const departmentMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          Department
        >()

      departments.forEach(
        (item) => {
          map.set(item.id, item)
        }
      )

      return map
    }, [departments])

  function workerInsideFilters(
    worker:
      | Worker
      | undefined
  ) {
    if (!worker) {
      return false
    }

    if (
      operationFilter !== 'all' &&
      worker.operation_id !==
        operationFilter
    ) {
      return false
    }

    if (
      siteFilter !== 'all' &&
      worker.site_id !== siteFilter
    ) {
      return false
    }

    if (
      departmentFilter !== 'all' &&
      worker.department_id !==
        departmentFilter
    ) {
      return false
    }

    if (
      jobFilter !== 'all' &&
      worker.job_profile_id !==
        jobFilter
    ) {
      return false
    }

    return true
  }

  const availableSites =
    useMemo(() => {
      if (
        operationFilter === 'all'
      ) {
        return sites
      }

      return sites.filter(
        (site) =>
          site.operation_id ===
          operationFilter
      )
    }, [
      sites,
      operationFilter,
    ])

  const availableDepartments =
    useMemo(() => {
      return departments.filter(
        (department) => {
          if (
            operationFilter !==
              'all' &&
            department.operation_id &&
            department.operation_id !==
              operationFilter
          ) {
            return false
          }

          if (
            siteFilter !== 'all' &&
            department.site_id &&
            department.site_id !==
              siteFilter
          ) {
            return false
          }

          return true
        }
      )
    }, [
      departments,
      operationFilter,
      siteFilter,
    ])

  const availableJobs =
    useMemo(() => {
      const relevantWorkerJobIds =
        new Set(
          workers
            .filter((worker) => {
              if (
                operationFilter !==
                  'all' &&
                worker.operation_id !==
                  operationFilter
              ) {
                return false
              }

              if (
                siteFilter !== 'all' &&
                worker.site_id !==
                  siteFilter
              ) {
                return false
              }

              if (
                departmentFilter !==
                  'all' &&
                worker.department_id !==
                  departmentFilter
              ) {
                return false
              }

              return true
            })
            .map(
              (worker) =>
                worker.job_profile_id
            )
            .filter(
              (id): id is string =>
                Boolean(id)
            )
        )

      return jobProfiles.filter(
        (job) =>
          relevantWorkerJobIds.has(
            job.id
          )
      )
    }, [
      workers,
      jobProfiles,
      operationFilter,
      siteFilter,
      departmentFilter,
    ])

  const filteredWorkers =
    useMemo(
      () =>
        workers.filter(
          workerInsideFilters
        ),
      [
        workers,
        operationFilter,
        siteFilter,
        departmentFilter,
        jobFilter,
      ]
    )

  const filteredWorkerIds =
    useMemo(
      () =>
        new Set(
          filteredWorkers.map(
            (worker) => worker.id
          )
        ),
      [filteredWorkers]
    )

  const filteredAssessments =
    useMemo(
      () =>
        assessments.filter(
          (item) =>
            dateInsideFilter(
              item.assessment_date
            ) &&
            filteredWorkerIds.has(
              item.worker_id
            )
        ),
      [
        assessments,
        dateFilter,
        filteredWorkerIds,
      ]
    )

  const filteredAssessmentIds =
    useMemo(
      () =>
        new Set(
          filteredAssessments.map(
            (item) => item.id
          )
        ),
      [filteredAssessments]
    )

  const filteredResults =
    useMemo(
      () =>
        results.filter(
          (item) =>
            filteredAssessmentIds.has(
              item.assessment_id
            )
        ),
      [
        results,
        filteredAssessmentIds,
      ]
    )

  const filteredRehabCases =
    useMemo(
      () =>
        rehabCases.filter(
          (item) =>
            filteredWorkerIds.has(
              item.worker_id
            ) &&
            dateInsideFilter(
              item.referral_date
            )
        ),
      [
        rehabCases,
        filteredWorkerIds,
        dateFilter,
      ]
    )

  const completedAssessments =
    useMemo(
      () =>
        filteredAssessments.filter(
          (item) =>
            item.assessment_status ===
            'completed'
        ),
      [filteredAssessments]
    )

  const metrics = useMemo(() => {
    const fit =
      completedAssessments.filter(
        (item) =>
          item.final_outcome ===
          'fit'
      ).length

    const restrictions =
      completedAssessments.filter(
        (item) =>
          item.final_outcome ===
          'fit_with_restrictions'
      ).length

    const temporarilyUnfit =
      completedAssessments.filter(
        (item) =>
          item.final_outcome ===
          'temporarily_unfit'
      ).length

    const rehabilitation =
      completedAssessments.filter(
        (item) =>
          item.final_outcome ===
          'rehabilitation'
      ).length

    const reassessment =
      completedAssessments.filter(
        (item) =>
          item.final_outcome ===
          'reassessment_required'
      ).length

    const workersAssessed =
      new Set(
        filteredAssessments.map(
          (item) => item.worker_id
        )
      ).size

    const completionRate =
      filteredAssessments.length > 0
        ? Math.round(
            (
              completedAssessments.length /
              filteredAssessments.length
            ) * 100
          )
        : 0

    return {
      fit,
      restrictions,
      temporarilyUnfit,
      rehabilitation,
      reassessment,
      workersAssessed,
      completionRate,
    }
  }, [
    filteredAssessments,
    completedAssessments,
  ])

  const rehabMetrics =
    useMemo(() => {
      const active =
        filteredRehabCases.filter(
          (item) =>
            item.case_status ===
              'active' ||
            item.case_status ===
              'on_hold'
        ).length

      const ready =
        filteredRehabCases.filter(
          (item) =>
            item.case_status ===
            'ready_for_reassessment'
        ).length

      const completed =
        filteredRehabCases.filter(
          (item) =>
            item.case_status ===
            'completed'
        ).length

      const fullDuty =
        filteredRehabCases.filter(
          (item) =>
            item.discharge_outcome ===
            'return_to_full_duty'
        ).length

      const modifiedDuty =
        filteredRehabCases.filter(
          (item) =>
            item.discharge_outcome ===
            'return_to_modified_duty'
        ).length

      const temporarilyUnfit =
        filteredRehabCases.filter(
          (item) =>
            item.discharge_outcome ===
            'temporarily_unfit'
        ).length

      const totalSessions =
        filteredRehabCases.reduce(
          (total, item) =>
            total +
            Number(
              item.sessions_completed ||
                0
            ),
          0
        )

      return {
        active,
        ready,
        completed,
        fullDuty,
        modifiedDuty,
        temporarilyUnfit,
        totalSessions,
      }
    }, [filteredRehabCases])

  const outcomeDistribution =
    useMemo(() => {
      return [
        {
          label: 'Fit',
          value: metrics.fit,
        },
        {
          label:
            'Fit With Restrictions',
          value:
            metrics.restrictions,
        },
        {
          label:
            'Temporarily Unfit',
          value:
            metrics.temporarilyUnfit,
        },
        {
          label: 'Rehabilitation',
          value:
            metrics.rehabilitation,
        },
        {
          label: 'Reassessment',
          value:
            metrics.reassessment,
        },
      ]
    }, [metrics])

  const maxOutcome =
    Math.max(
      ...outcomeDistribution.map(
        (item) => item.value
      ),
      1
    )

  const demandSummary =
    useMemo(() => {
      const map =
        new Map<
          string,
          DemandSummary
        >()

      filteredResults.forEach(
        (item) => {
          const rating =
            item.assessor_rating ||
            item.result

          const current =
            map.get(
              item.test_name
            ) || {
              name: item.test_name,
              assessments: 0,
              failures: 0,
              borderline: 0,
            }

          current.assessments += 1

          if (rating === 'fail') {
            current.failures += 1
          }

          if (
            rating === 'borderline'
          ) {
            current.borderline += 1
          }

          map.set(
            item.test_name,
            current
          )
        }
      )

      return Array.from(
        map.values()
      )
        .sort(
          (a, b) =>
            b.failures -
              a.failures ||
            b.borderline -
              a.borderline
        )
        .slice(0, 10)
    }, [filteredResults])

  const jobSummary =
    useMemo(() => {
      const map =
        new Map<
          string,
          JobSummary
        >()

      jobProfiles.forEach(
        (job) => {
          map.set(job.id, {
            id: job.id,
            title: job.title,
            assessments: 0,
            failures: 0,
            borderline: 0,
            capacityGaps: 0,
          })
        }
      )

      filteredAssessments.forEach(
        (assessment) => {
          const worker =
            workerMap.get(
              assessment.worker_id
            )

          if (
            !worker?.job_profile_id
          ) {
            return
          }

          const current =
            map.get(
              worker.job_profile_id
            )

          if (!current) {
            return
          }

          current.assessments += 1

          const assessmentResults =
            filteredResults.filter(
              (item) =>
                item.assessment_id ===
                assessment.id
            )

          current.failures +=
            assessmentResults.filter(
              (item) =>
                (
                  item.assessor_rating ||
                  item.result
                ) === 'fail'
            ).length

          current.borderline +=
            assessmentResults.filter(
              (item) =>
                (
                  item.assessor_rating ||
                  item.result
                ) === 'borderline'
            ).length

          current.capacityGaps +=
            assessmentResults.filter(
              (item) =>
                item.measured_value !==
                  null &&
                item.required_value !==
                  null &&
                Number(
                  item.required_value
                ) > 0 &&
                Number(
                  item.measured_value
                ) <
                  Number(
                    item.required_value
                  )
            ).length
        }
      )

      return Array.from(
        map.values()
      )
        .filter(
          (item) =>
            item.assessments > 0
        )
        .sort(
          (a, b) =>
            b.failures -
              a.failures ||
            b.capacityGaps -
              a.capacityGaps
        )
    }, [
      jobProfiles,
      workerMap,
      filteredAssessments,
      filteredResults,
    ])

  const riskWorkers =
    useMemo(() => {
      const rows:
        RiskWorker[] = []

      completedAssessments.forEach(
        (assessment) => {
          if (
            ![
              'fit_with_restrictions',
              'temporarily_unfit',
              'rehabilitation',
              'reassessment_required',
            ].includes(
              assessment.final_outcome ||
                ''
            )
          ) {
            return
          }

          const worker =
            workerMap.get(
              assessment.worker_id
            )

          if (!worker) {
            return
          }

          const job =
            worker.job_profile_id
              ? jobMap.get(
                  worker.job_profile_id
                )
              : undefined

          const operation =
            worker.operation_id
              ? operationMap.get(
                  worker.operation_id
                )
              : undefined

          const site =
            worker.site_id
              ? siteMap.get(
                  worker.site_id
                )
              : undefined

          const department =
            worker.department_id
              ? departmentMap.get(
                  worker.department_id
                )
              : undefined

          rows.push({
            workerId: worker.id,

            name:
              `${worker.first_name} ${worker.last_name}`,

            employeeNumber:
              worker.employee_number,

            jobTitle:
              job?.title ||
              'Not assigned',

            operation:
              operation?.name || '—',

            site:
              site?.name || '—',

            department:
              department?.name || '—',

            outcome:
              assessment.final_outcome ||
              'Not recorded',

            assessmentDate:
              assessment.assessment_date,
          })
        }
      )

      return rows
        .sort(
          (a, b) =>
            b.assessmentDate.localeCompare(
              a.assessmentDate
            )
        )
        .slice(0, 10)
    }, [
      completedAssessments,
      workerMap,
      jobMap,
      operationMap,
      siteMap,
      departmentMap,
    ])

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

  function clearFilters() {
    setDateFilter('all')
    setOperationFilter('all')
    setSiteFilter('all')
    setDepartmentFilter('all')
    setJobFilter('all')
  }

  function handleOperationChange(
    value: string
  ) {
    setOperationFilter(value)
    setSiteFilter('all')
    setDepartmentFilter('all')
    setJobFilter('all')
  }

  function handleSiteChange(
    value: string
  ) {
    setSiteFilter(value)
    setDepartmentFilter('all')
    setJobFilter('all')
  }

  function handleDepartmentChange(
    value: string
  ) {
    setDepartmentFilter(value)
    setJobFilter('all')
  }

  function exportCsv() {
    const headers = [
      'Worker',
      'Employee Number',
      'Operation',
      'Site / Shaft',
      'Department',
      'Job Profile',
      'Assessment Date',
      'Status',
      'Outcome',
    ]

    const rows =
      filteredAssessments.map(
        (assessment) => {
          const worker =
            workerMap.get(
              assessment.worker_id
            )

          const job =
            worker?.job_profile_id
              ? jobMap.get(
                  worker.job_profile_id
                )
              : undefined

          const operation =
            worker?.operation_id
              ? operationMap.get(
                  worker.operation_id
                )
              : undefined

          const site =
            worker?.site_id
              ? siteMap.get(
                  worker.site_id
                )
              : undefined

          const department =
            worker?.department_id
              ? departmentMap.get(
                  worker.department_id
                )
              : undefined

          return [
            worker
              ? `${worker.first_name} ${worker.last_name}`
              : '',

            worker
              ?.employee_number ||
              '',

            operation?.name || '',

            site?.name || '',

            department?.name || '',

            job?.title || '',

            assessment.assessment_date,

            assessment.assessment_status,

            assessment.final_outcome ||
              '',
          ]
        }
      )

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(
                value
              ).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(',')
      )
      .join('\n')

    const blob =
      new Blob(
        [csv],
        {
          type:
            'text/csv;charset=utf-8;',
        }
      )

    const url =
      URL.createObjectURL(blob)

    const link =
      document.createElement('a')

    link.href = url

    link.download =
      'spinesync-enterprise-report.csv'

    document.body.appendChild(
      link
    )

    link.click()
    link.remove()

    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading enterprise
          analytics...
        </p>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>
          <span className="eyebrow">
            MANAGEMENT INTELLIGENCE
          </span>

          <h1>
            Reports & Analytics
          </h1>

          <p>
            Mine-level functional
            capacity, rehabilitation and
            return-to-work intelligence.
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
            onClick={loadReports}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            className="primary-button"
            onClick={exportCsv}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Filter size={20} />
          </div>

          <div>
            <h2>
              Enterprise Filters
            </h2>

            <p>
              Analyse the workforce by
              mine structure and
              occupational role.
            </p>
          </div>

        </div>

        <div className="form-grid">

          <label>
            <span>
              Reporting Period
            </span>

            <select
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target
                    .value as DateFilter
                )
              }
            >
              <option value="all">
                All Time
              </option>

              <option value="30">
                Last 30 Days
              </option>

              <option value="90">
                Last 90 Days
              </option>

              <option value="365">
                Last 12 Months
              </option>
            </select>
          </label>

          <label>
            <span>
              Operation
            </span>

            <select
              value={
                operationFilter
              }
              onChange={(event) =>
                handleOperationChange(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Operations
              </option>

              {operations.map(
                (operation) => (
                  <option
                    key={operation.id}
                    value={
                      operation.id
                    }
                  >
                    {operation.name}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>
              Site / Shaft
            </span>

            <select
              value={siteFilter}
              onChange={(event) =>
                handleSiteChange(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Sites / Shafts
              </option>

              {availableSites.map(
                (site) => (
                  <option
                    key={site.id}
                    value={site.id}
                  >
                    {site.name}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>
              Department
            </span>

            <select
              value={
                departmentFilter
              }
              onChange={(event) =>
                handleDepartmentChange(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Departments
              </option>

              {availableDepartments.map(
                (department) => (
                  <option
                    key={
                      department.id
                    }
                    value={
                      department.id
                    }
                  >
                    {department.name}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>
              Job Profile
            </span>

            <select
              value={jobFilter}
              onChange={(event) =>
                setJobFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Job Profiles
              </option>

              {availableJobs.map(
                (job) => (
                  <option
                    key={job.id}
                    value={job.id}
                  >
                    {job.title}
                  </option>
                )
              )}
            </select>
          </label>

        </div>

        <div
          style={{
            marginTop: 18,
          }}
        >
          <button
            className="secondary-button"
            onClick={clearFilters}
          >
            <RotateCcw size={16} />
            Clear Filters
          </button>
        </div>

      </div>

      <div className="fce-summary-row">

        <div>
          <Users size={18} />

          <span>
            WORKERS ASSESSED
          </span>

          <strong>
            {metrics.workersAssessed}
          </strong>
        </div>

        <div>
          <ClipboardCheck
            size={18}
          />

          <span>
            COMPLETED FCES
          </span>

          <strong>
            {
              completedAssessments
                .length
            }
          </strong>
        </div>

        <div>
          <CheckCircle2
            size={18}
          />

          <span>FIT</span>

          <strong>
            {metrics.fit}
          </strong>
        </div>

        <div>
          <ShieldAlert
            size={18}
          />

          <span>
            RESTRICTED
          </span>

          <strong>
            {metrics.restrictions}
          </strong>
        </div>

        <div>
          <AlertTriangle
            size={18}
          />

          <span>
            TEMP. UNFIT
          </span>

          <strong>
            {
              metrics.temporarilyUnfit
            }
          </strong>
        </div>

        <div>
          <Activity size={18} />

          <span>
            COMPLETION RATE
          </span>

          <strong>
            {
              metrics.completionRate
            }%
          </strong>
        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Building2 size={20} />
          </div>

          <div>
            <h2>
              Selected Workforce
            </h2>

            <p>
              Workforce population
              represented by the current
              mine-level filters.
            </p>
          </div>

        </div>

        <div className="fce-summary-row">

          <div>
            <Users size={18} />

            <span>
              WORKERS IN SCOPE
            </span>

            <strong>
              {
                filteredWorkers.length
              }
            </strong>
          </div>

          <div>
            <ClipboardCheck
              size={18}
            />

            <span>
              TOTAL FCES
            </span>

            <strong>
              {
                filteredAssessments.length
              }
            </strong>
          </div>

          <div>
            <Activity size={18} />

            <span>
              REHAB CASES
            </span>

            <strong>
              {
                filteredRehabCases.length
              }
            </strong>
          </div>

          <div>
            <ShieldAlert
              size={18}
            />

            <span>
              ACTIVE REHAB
            </span>

            <strong>
              {rehabMetrics.active}
            </strong>
          </div>

        </div>

      </div>

      <div className="panel">

        <h2>
          Occupational Outcomes
        </h2>

        <p>
          Distribution of final
          assessor-determined FCE
          outcomes for the selected
          workforce.
        </p>

        <div
          style={{
            display: 'grid',
            gap: 14,
            marginTop: 20,
          }}
        >

          {outcomeDistribution.map(
            (item) => (
              <div key={item.label}>

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    gap: 16,
                    marginBottom: 6,
                  }}
                >
                  <span>
                    {item.label}
                  </span>

                  <strong>
                    {item.value}
                  </strong>
                </div>

                <div
                  style={{
                    height: 10,
                    borderRadius: 999,
                    background:
                      'rgba(127,127,127,0.15)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',

                      width: `${
                        (
                          item.value /
                          maxOutcome
                        ) * 100
                      }%`,

                      background:
                        'currentColor',

                      borderRadius: 999,
                    }}
                  />
                </div>

              </div>
            )
          )}

        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Rehabilitation &
              Return-to-Work Outcomes
            </h2>

            <p>
              Rehabilitation activity and
              RTW outcomes for the
              selected workforce.
            </p>
          </div>

        </div>

        <div className="fce-summary-row">

          <div>
            <Activity size={18} />

            <span>
              ACTIVE CASES
            </span>

            <strong>
              {rehabMetrics.active}
            </strong>
          </div>

          <div>
            <ClipboardCheck
              size={18}
            />

            <span>
              READY FOR REASSESSMENT
            </span>

            <strong>
              {rehabMetrics.ready}
            </strong>
          </div>

          <div>
            <CheckCircle2
              size={18}
            />

            <span>
              COMPLETED CASES
            </span>

            <strong>
              {rehabMetrics.completed}
            </strong>
          </div>

          <div>
            <Users size={18} />

            <span>
              FULL DUTY RTW
            </span>

            <strong>
              {rehabMetrics.fullDuty}
            </strong>
          </div>

          <div>
            <BriefcaseBusiness
              size={18}
            />

            <span>
              MODIFIED DUTY RTW
            </span>

            <strong>
              {
                rehabMetrics.modifiedDuty
              }
            </strong>
          </div>

          <div>
            <Activity size={18} />

            <span>
              REHAB SESSIONS
            </span>

            <strong>
              {
                rehabMetrics.totalSessions
              }
            </strong>
          </div>

        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Common Functional
              Difficulties
            </h2>

            <p>
              FCE tests producing the
              highest number of failed or
              borderline findings in the
              selected workforce.
            </p>
          </div>

        </div>

        {demandSummary.length ===
        0 ? (
          <p>
            No FCE test data available
            for the selected filters.
          </p>
        ) : (
          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>
                    Functional Demand
                  </th>

                  <th>Tests</th>

                  <th>
                    Borderline
                  </th>

                  <th>Failed</th>
                </tr>
              </thead>

              <tbody>

                {demandSummary.map(
                  (item) => (
                    <tr
                      key={item.name}
                    >
                      <td>
                        <strong>
                          {item.name}
                        </strong>
                      </td>

                      <td>
                        {
                          item.assessments
                        }
                      </td>

                      <td>
                        {
                          item.borderline
                        }
                      </td>

                      <td>
                        {
                          item.failures
                        }
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
            <BriefcaseBusiness
              size={20}
            />
          </div>

          <div>
            <h2>
              Job Profile Risk
              Overview
            </h2>

            <p>
              Compare functional findings
              across occupational job
              profiles within the
              selected mine structure.
            </p>
          </div>

        </div>

        {jobSummary.length ===
        0 ? (
          <p>
            No assessed job profiles
            available for the selected
            filters.
          </p>
        ) : (
          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>
                    Job Profile
                  </th>

                  <th>FCEs</th>

                  <th>
                    Borderline
                  </th>

                  <th>
                    Failed Tests
                  </th>

                  <th>
                    Capacity Gaps
                  </th>
                </tr>
              </thead>

              <tbody>

                {jobSummary.map(
                  (item) => (
                    <tr
                      key={item.id}
                    >
                      <td>
                        <strong>
                          {item.title}
                        </strong>
                      </td>

                      <td>
                        {
                          item.assessments
                        }
                      </td>

                      <td>
                        {
                          item.borderline
                        }
                      </td>

                      <td>
                        {
                          item.failures
                        }
                      </td>

                      <td>
                        {
                          item.capacityGaps
                        }
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
            <ShieldAlert
              size={20}
            />
          </div>

          <div>
            <h2>
              Workers Requiring
              Attention
            </h2>

            <p>
              Workers with recent
              assessor-determined
              restrictions,
              rehabilitation,
              reassessment or temporary
              unfitness.
            </p>
          </div>

        </div>

        {riskWorkers.length ===
        0 ? (
          <div className="fce-no-gap">
            <CheckCircle2
              size={20}
            />

            <span>
              No workers requiring
              follow-up were identified
              for the selected filters.
            </span>
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

                  <th>
                    Operation
                  </th>

                  <th>
                    Site / Shaft
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Job Profile
                  </th>

                  <th>Date</th>

                  <th>Outcome</th>
                </tr>
              </thead>

              <tbody>

                {riskWorkers.map(
                  (item) => (
                    <tr
                      key={`${item.workerId}-${item.assessmentDate}`}
                    >
                      <td>
                        <strong>
                          {item.name}
                        </strong>
                      </td>

                      <td>
                        {
                          item.employeeNumber
                        }
                      </td>

                      <td>
                        {
                          item.operation
                        }
                      </td>

                      <td>
                        {item.site}
                      </td>

                      <td>
                        {
                          item.department
                        }
                      </td>

                      <td>
                        {
                          item.jobTitle
                        }
                      </td>

                      <td>
                        {formatDate(
                          item.assessmentDate
                        )}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            item.outcome ===
                            'temporarily_unfit'
                              ? 'fail'
                              : 'borderline'
                          }`}
                        >
                          {formatLabel(
                            item.outcome
                          )}
                        </span>
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

        <h2>
          Management Interpretation
        </h2>

        <p>
          These analytics aggregate
          recorded FCE, rehabilitation
          and assessor-determined
          return-to-work information
          across the selected operation,
          site or shaft, department and
          job profile. They are intended
          to support workforce planning,
          rehabilitation monitoring,
          functional-capacity
          surveillance and occupational
          risk management. They do not
          independently determine an
          individual worker's medical or
          occupational fitness.
        </p>

      </div>

    </div>
  )
}
