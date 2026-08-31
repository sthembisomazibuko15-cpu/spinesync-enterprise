import {
  Activity,
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  Download,
  RefreshCw,
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
}

type JobProfile = {
  id: string
  title: string
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

  const [results, setResults] =
    useState<FceResult[]>([])

  const [dateFilter, setDateFilter] =
    useState<DateFilter>('all')

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
        .order(
          'assessment_date',
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
        `),

      supabase
        .from('job_profiles')
        .select(`
          id,
          title
        `),
    ])

    if (assessmentResponse.error) {
      setError(
        assessmentResponse.error.message
      )
      setLoading(false)
      return
    }

    if (workerResponse.error) {
      setError(
        workerResponse.error.message
      )
      setLoading(false)
      return
    }

    if (jobResponse.error) {
      setError(
        jobResponse.error.message
      )
      setLoading(false)
      return
    }

    const loadedAssessments =
      (assessmentResponse.data ??
        []) as Assessment[]

    setAssessments(
      loadedAssessments
    )

    setWorkers(
      (workerResponse.data ??
        []) as Worker[]
    )

    setJobProfiles(
      (jobResponse.data ??
        []) as JobProfile[]
    )

    if (
      loadedAssessments.length === 0
    ) {
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
      setError(
        resultError.message
      )
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

    const days =
      Number(dateFilter)

    const assessmentDate =
      new Date(
        `${value}T00:00:00`
      )

    const threshold =
      new Date()

    threshold.setHours(
      0,
      0,
      0,
      0
    )

    threshold.setDate(
      threshold.getDate() -
        days
    )

    return (
      assessmentDate >=
      threshold
    )
  }

  const filteredAssessments =
    useMemo(
      () =>
        assessments.filter(
          (item) =>
            dateInsideFilter(
              item.assessment_date
            )
        ),
      [
        assessments,
        dateFilter,
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
          (item) =>
            item.worker_id
        )
      ).size

    const completionRate =
      filteredAssessments.length >
      0
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
          label:
            'Rehabilitation',
          value:
            metrics.rehabilitation,
        },
        {
          label:
            'Reassessment',
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
          const current =
            map.get(
              item.test_name
            ) || {
              name:
                item.test_name,
              assessments: 0,
              failures: 0,
              borderline: 0,
            }

          current.assessments += 1

          if (
            item.result === 'fail'
          ) {
            current.failures += 1
          }

          if (
            item.result ===
            'borderline'
          ) {
            current.borderline +=
              1
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
            workers.find(
              (item) =>
                item.id ===
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
                item.result ===
                'fail'
            ).length

          current.borderline +=
            assessmentResults.filter(
              (item) =>
                item.result ===
                'borderline'
            ).length

          current.capacityGaps +=
            assessmentResults.filter(
              (item) =>
                item.measured_value !==
                  null &&
                item.required_value !==
                  null &&
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
      workers,
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
            workers.find(
              (item) =>
                item.id ===
                assessment.worker_id
            )

          if (!worker) {
            return
          }

          const job =
            jobProfiles.find(
              (item) =>
                item.id ===
                worker.job_profile_id
            )

          rows.push({
            workerId: worker.id,

            name:
              `${worker.first_name} ${worker.last_name}`,

            employeeNumber:
              worker.employee_number,

            jobTitle:
              job?.title ||
              'Not assigned',

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
      workers,
      jobProfiles,
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

  function exportCsv() {
    const headers = [
      'Worker',
      'Employee Number',
      'Job Profile',
      'Assessment Date',
      'Status',
      'Outcome',
    ]

    const rows =
      filteredAssessments.map(
        (assessment) => {
          const worker =
            workers.find(
              (item) =>
                item.id ===
                assessment.worker_id
            )

          const job =
            jobProfiles.find(
              (item) =>
                item.id ===
                worker?.job_profile_id
            )

          return [
            worker
              ? `${worker.first_name} ${worker.last_name}`
              : '',
            worker
              ?.employee_number ||
              '',
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
      'spinesync-fce-report.csv'

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
          Loading analytics...
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
            Mine-level overview of
            functional capacity,
            occupational outcomes and
            job-demand risks.
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
            onClick={
              loadReports
            }
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

        <label
          style={{
            maxWidth: 260,
          }}
        >
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

        <h2>
          Occupational Outcomes
        </h2>

        <p>
          Distribution of final
          assessor-determined outcomes.
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
              <div
                key={item.label}
              >
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
                    overflow:
                      'hidden',
                  }}
                >
                  <div
                    style={{
                      height:
                        '100%',
                      width: `${
                        (
                          item.value /
                          maxOutcome
                        ) * 100
                      }%`,
                      background:
                        'currentColor',
                      borderRadius:
                        999,
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
              Common Functional
              Difficulties
            </h2>

            <p>
              FCE tests producing the
              highest number of failed or
              borderline findings.
            </p>
          </div>

        </div>

        {demandSummary.length ===
        0 ? (
          <p>
            No FCE test data available
            for this reporting period.
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
                  <th>Borderline</th>
                  <th>Failed</th>
                </tr>
              </thead>

              <tbody>

                {demandSummary.map(
                  (item) => (
                    <tr
                      key={
                        item.name
                      }
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
              Compare assessment
              findings across occupational
              job profiles.
            </p>
          </div>

        </div>

        {jobSummary.length ===
        0 ? (
          <p>
            No assessed job profiles
            available.
          </p>
        ) : (
          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>Job Profile</th>
                  <th>FCEs</th>
                  <th>Borderline</th>
                  <th>Failed Tests</th>
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
              Recent completed FCEs
              resulting in restrictions,
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
              in this period.
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
                  <th>Job Profile</th>
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
          recorded FCE findings and
          assessor-determined outcomes.
          They are intended to support
          rehabilitation planning,
          workforce risk surveillance and
          occupational decision-making.
          They do not replace individual
          clinical assessment or
          occupational medical
          certification.
        </p>

      </div>

    </div>
  )
}
