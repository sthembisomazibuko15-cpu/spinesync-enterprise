import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardList,
  Eye,
  MapPin,
  ShieldCheck,
  User,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import { supabase } from '../lib/supabase'

type WorkerProfileData = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  sex: string | null
  employment_status: string
  fitness_status: string
  operation_id: string | null
  site_id: string | null
  department_id: string | null
  job_profile_id: string | null
}

type Option = {
  id: string
  name?: string
  title?: string
}

type Assessment = {
  id: string
  assessment_type: string
  assessment_date: string
  assessment_status: string
  final_outcome: string | null
  created_at: string
}

export default function WorkerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [worker, setWorker] =
    useState<WorkerProfileData | null>(null)

  const [operation, setOperation] =
    useState<Option | null>(null)

  const [site, setSite] =
    useState<Option | null>(null)

  const [department, setDepartment] =
    useState<Option | null>(null)

  const [job, setJob] =
    useState<Option | null>(null)

  const [assessments, setAssessments] =
    useState<Assessment[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadWorker()
  }, [id])

  async function loadWorker() {
    if (!id) return

    setLoading(true)
    setError(null)

    const {
      data,
      error: workerError,
    } = await supabase
      .from('workers')
      .select(`
        id,
        employee_number,
        first_name,
        last_name,
        date_of_birth,
        sex,
        employment_status,
        fitness_status,
        operation_id,
        site_id,
        department_id,
        job_profile_id
      `)
      .eq('id', id)
      .single()

    if (workerError) {
      setError(workerError.message)
      setLoading(false)
      return
    }

    const workerData =
      data as WorkerProfileData

    setWorker(workerData)

    await Promise.all([
      loadLinkedData(workerData),
      loadAssessments(workerData.id),
    ])

    setLoading(false)
  }

  async function loadLinkedData(
    workerData: WorkerProfileData
  ) {
    const [
      operationResult,
      siteResult,
      departmentResult,
      jobResult,
    ] = await Promise.all([
      workerData.operation_id
        ? supabase
            .from('operations')
            .select('id,name')
            .eq(
              'id',
              workerData.operation_id
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      workerData.site_id
        ? supabase
            .from('sites')
            .select('id,name')
            .eq(
              'id',
              workerData.site_id
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      workerData.department_id
        ? supabase
            .from('departments')
            .select('id,name')
            .eq(
              'id',
              workerData.department_id
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),

      workerData.job_profile_id
        ? supabase
            .from('job_profiles')
            .select('id,title')
            .eq(
              'id',
              workerData.job_profile_id
            )
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),
    ])

    setOperation(
      operationResult.data
    )

    setSite(
      siteResult.data
    )

    setDepartment(
      departmentResult.data
    )

    setJob(
      jobResult.data
    )
  }

  async function loadAssessments(
    workerId: string
  ) {
    const {
      data,
      error: assessmentError,
    } = await supabase
      .from('assessments')
      .select(`
        id,
        assessment_type,
        assessment_date,
        assessment_status,
        final_outcome,
        created_at
      `)
      .eq(
        'worker_id',
        workerId
      )
      .order(
        'assessment_date',
        {
          ascending: false,
        }
      )

    if (assessmentError) {
      setError(
        assessmentError.message
      )
      return
    }

    setAssessments(
      (data ?? []) as Assessment[]
    )
  }

  function formatStatus(
    value: string
  ) {
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
    if (!value) return '—'

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

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading worker profile...
        </p>
      </div>
    )
  }

  if (error || !worker) {
    return (
      <div className="stack">
        <div className="error-message">
          {error ||
            'Worker not found.'}
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate('/workers')
          }
        >
          Back to workers
        </button>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="section-heading">
        <div>
          <Link
            to="/workers"
            className="back-link"
          >
            <ArrowLeft size={16} />
            Workers
          </Link>

          <h2>
            {worker.first_name}{' '}
            {worker.last_name}
          </h2>

          <p>
            Employee{' '}
            {worker.employee_number}
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            navigate(
              `/assessments/new?worker=${worker.id}`
            )
          }
        >
          <Activity size={16} />
          Start FCE
        </button>
      </div>

      <div className="worker-profile-grid">

        <section className="panel profile-card">
          <div className="profile-card-icon">
            <User size={20} />
          </div>

          <h3>
            Worker Details
          </h3>

          <div className="profile-details">

            <div>
              <span>
                Employee number
              </span>

              <strong>
                {
                  worker.employee_number
                }
              </strong>
            </div>

            <div>
              <span>
                Date of birth
              </span>

              <strong>
                {worker.date_of_birth
                  ? formatDate(
                      worker.date_of_birth
                    )
                  : 'Not recorded'}
              </strong>
            </div>

            <div>
              <span>
                Sex
              </span>

              <strong>
                {worker.sex
                  ? formatStatus(
                      worker.sex
                    )
                  : 'Not recorded'}
              </strong>
            </div>

          </div>
        </section>

        <section className="panel profile-card">
          <div className="profile-card-icon">
            <MapPin size={20} />
          </div>

          <h3>
            Mining Placement
          </h3>

          <div className="profile-details">

            <div>
              <span>
                Operation
              </span>

              <strong>
                {operation?.name ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <span>
                Site / Shaft
              </span>

              <strong>
                {site?.name ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <span>
                Department
              </span>

              <strong>
                {department?.name ||
                  'Not assigned'}
              </strong>
            </div>

          </div>
        </section>

        <section className="panel profile-card">
          <div className="profile-card-icon">
            <BriefcaseBusiness
              size={20}
            />
          </div>

          <h3>
            Job Profile
          </h3>

          <div className="profile-details">
            <div>
              <span>
                Job
              </span>

              <strong>
                {job?.title ||
                  'Not assigned'}
              </strong>
            </div>
          </div>
        </section>

        <section className="panel profile-card">
          <div className="profile-card-icon">
            <ShieldCheck size={20} />
          </div>

          <h3>
            Current Status
          </h3>

          <div className="profile-details">

            <div>
              <span>
                Employment
              </span>

              <strong>
                {formatStatus(
                  worker.employment_status
                )}
              </strong>
            </div>

            <div>
              <span>
                Fitness
              </span>

              <strong>
                {formatStatus(
                  worker.fitness_status
                )}
              </strong>
            </div>

          </div>
        </section>

      </div>

      <section className="panel">

        <div className="panel-header">
          <div>
            <h3>
              Assessment History
            </h3>

            <span>
              FCE and functional
              assessment records
            </span>
          </div>

          <ClipboardList
            size={19}
          />
        </div>

        {assessments.length === 0 ? (
          <div className="empty-state">
            <Activity size={32} />

            <h3>
              No assessments yet
            </h3>

            <p>
              Start the worker's first
              functional capacity
              evaluation.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                navigate(
                  `/assessments/new?worker=${worker.id}`
                )
              }
            >
              Start FCE
            </button>
          </div>
        ) : (
          <div className="table-wrap">

            <table>
              <thead>
                <tr>
                  <th>
                    Date
                  </th>

                  <th>
                    Assessment
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Outcome
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {assessments.map(
                  (assessment) => (
                    <tr
                      key={
                        assessment.id
                      }
                    >
                      <td>
                        <div className="assessment-date-cell">
                          <CalendarDays
                            size={15}
                          />

                          {formatDate(
                            assessment.assessment_date
                          )}
                        </div>
                      </td>

                      <td>
                        <strong>
                          {formatStatus(
                            assessment.assessment_type
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            assessment.assessment_status ===
                            'completed'
                              ? 'pass'
                              : 'borderline'
                          }`}
                        >
                          {formatStatus(
                            assessment.assessment_status
                          )}
                        </span>
                      </td>

                      <td>
                        {assessment.final_outcome ? (
                          <span
                            className={`badge ${
                              assessment.final_outcome ===
                              'fit'
                                ? 'pass'
                                : assessment.final_outcome ===
                                    'temporarily_unfit'
                                  ? 'fail'
                                  : 'borderline'
                            }`}
                          >
                            {formatStatus(
                              assessment.final_outcome
                            )}
                          </span>
                        ) : (
                          'Pending'
                        )}
                      </td>

                      <td>
                        <button
                          className="secondary-button"
                          onClick={() => {
                            if (
                              assessment.assessment_status ===
                              'completed'
                            ) {
                              navigate(
                                `/assessments/${assessment.id}/outcome`
                              )
                            } else {
                              navigate(
                                `/assessments/${assessment.id}`
                              )
                            }
                          }}
                        >
                          <Eye size={15} />

                          {assessment.assessment_status ===
                          'completed'
                            ? 'View FCE'
                            : 'Continue'}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>

          </div>
        )}

      </section>

    </div>
  )
}
