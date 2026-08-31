import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  Edit3,
  MapPin,
  Save,
  ShieldCheck,
  User,
  X,
} from 'lucide-react'

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import { supabase } from '../lib/supabase'

type Worker = {
  id: string
  organisation_id: string
  employee_number: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  sex: string | null
  employment_status: string | null
  fitness_status: string | null
  operation_id: string | null
  site_id: string | null
  department_id: string | null
  job_profile_id: string | null
}

type Assessment = {
  id: string
  assessment_date: string
  assessment_type: string
  assessment_status: string
  final_outcome: string | null
}

type NamedItem = {
  id: string
  name: string
}

type JobProfile = {
  id: string
  title: string
}

type EditForm = {
  operation_id: string
  site_id: string
  department_id: string
  job_profile_id: string
  employment_status: string
}

export default function WorkerProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [assessments, setAssessments] =
    useState<Assessment[]>([])

  const [operations, setOperations] =
    useState<NamedItem[]>([])

  const [sites, setSites] =
    useState<NamedItem[]>([])

  const [departments, setDepartments] =
    useState<NamedItem[]>([])

  const [jobProfiles, setJobProfiles] =
    useState<JobProfile[]>([])

  const [operation, setOperation] =
    useState<NamedItem | null>(null)

  const [site, setSite] =
    useState<NamedItem | null>(null)

  const [department, setDepartment] =
    useState<NamedItem | null>(null)

  const [jobProfile, setJobProfile] =
    useState<JobProfile | null>(null)

  const [editForm, setEditForm] =
    useState<EditForm>({
      operation_id: '',
      site_id: '',
      department_id: '',
      job_profile_id: '',
      employment_status: 'active',
    })

  const [editing, setEditing] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [message, setMessage] =
    useState<string | null>(null)

  useEffect(() => {
    loadWorker()
  }, [id])

  async function loadWorker() {
    if (!id) {
      setError('Worker not found.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const {
      data: workerData,
      error: workerError,
    } = await supabase
      .from('workers')
      .select(`
        id,
        organisation_id,
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

    const typedWorker =
      workerData as Worker

    setWorker(typedWorker)

    setEditForm({
      operation_id:
        typedWorker.operation_id || '',

      site_id:
        typedWorker.site_id || '',

      department_id:
        typedWorker.department_id || '',

      job_profile_id:
        typedWorker.job_profile_id || '',

      employment_status:
        typedWorker.employment_status ||
        'active',
    })

    const [
      assessmentResponse,
      operationsResponse,
      sitesResponse,
      departmentsResponse,
      jobsResponse,
    ] = await Promise.all([
      supabase
        .from('assessments')
        .select(`
          id,
          assessment_date,
          assessment_type,
          assessment_status,
          final_outcome
        `)
        .eq('worker_id', typedWorker.id)
        .order(
          'assessment_date',
          {
            ascending: false,
          }
        ),

      supabase
        .from('operations')
        .select('id,name')
        .eq(
          'organisation_id',
          typedWorker.organisation_id
        )
        .order('name'),

      supabase
        .from('sites')
        .select('id,name')
        .eq(
          'organisation_id',
          typedWorker.organisation_id
        )
        .order('name'),

      supabase
        .from('departments')
        .select('id,name')
        .eq(
          'organisation_id',
          typedWorker.organisation_id
        )
        .order('name'),

      supabase
        .from('job_profiles')
        .select('id,title')
        .eq(
          'organisation_id',
          typedWorker.organisation_id
        )
        .order('title'),
    ])

    if (assessmentResponse.error) {
      setError(
        assessmentResponse.error.message
      )
      setLoading(false)
      return
    }

    setAssessments(
      (assessmentResponse.data ??
        []) as Assessment[]
    )

    setOperations(
      (operationsResponse.data ??
        []) as NamedItem[]
    )

    setSites(
      (sitesResponse.data ??
        []) as NamedItem[]
    )

    setDepartments(
      (departmentsResponse.data ??
        []) as NamedItem[]
    )

    setJobProfiles(
      (jobsResponse.data ??
        []) as JobProfile[]
    )

    const currentOperation =
      operationsResponse.data?.find(
        (item) =>
          item.id ===
          typedWorker.operation_id
      ) || null

    const currentSite =
      sitesResponse.data?.find(
        (item) =>
          item.id ===
          typedWorker.site_id
      ) || null

    const currentDepartment =
      departmentsResponse.data?.find(
        (item) =>
          item.id ===
          typedWorker.department_id
      ) || null

    const currentJob =
      jobsResponse.data?.find(
        (item) =>
          item.id ===
          typedWorker.job_profile_id
      ) || null

    setOperation(
      currentOperation as NamedItem | null
    )

    setSite(
      currentSite as NamedItem | null
    )

    setDepartment(
      currentDepartment as
        | NamedItem
        | null
    )

    setJobProfile(
      currentJob as JobProfile | null
    )

    setLoading(false)
  }

  async function saveWorker(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!worker) {
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    const {
      error: updateError,
    } = await supabase
      .from('workers')
      .update({
        operation_id:
          editForm.operation_id ||
          null,

        site_id:
          editForm.site_id ||
          null,

        department_id:
          editForm.department_id ||
          null,

        job_profile_id:
          editForm.job_profile_id ||
          null,

        employment_status:
          editForm.employment_status,
      })
      .eq('id', worker.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setMessage(
      'Worker assignment updated successfully.'
    )

    setEditing(false)
    setSaving(false)

    await loadWorker()
  }

  function cancelEdit() {
    if (!worker) {
      return
    }

    setEditForm({
      operation_id:
        worker.operation_id || '',

      site_id:
        worker.site_id || '',

      department_id:
        worker.department_id || '',

      job_profile_id:
        worker.job_profile_id || '',

      employment_status:
        worker.employment_status ||
        'active',
    })

    setEditing(false)
    setError(null)
  }

  function formatStatus(
    value: string | null | undefined
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
    value: string | null
  ) {
    if (!value) {
      return 'Not recorded'
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

  function startFce() {
    if (!worker) {
      return
    }

    navigate(
      `/assessments/new?worker=${worker.id}`
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading worker...
        </p>
      </div>
    )
  }

  if (
    error &&
    !worker
  ) {
    return (
      <div className="stack">

        <div className="error-message">
          {error}
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate('/workers')
          }
        >
          <ArrowLeft size={16} />
          Back to Workers
        </button>

      </div>
    )
  }

  if (!worker) {
    return null
  }

  return (
    <div className="stack">

      {/* HEADER */}

      <div className="page-heading">

        <div>

          <button
            className="secondary-button"
            onClick={() =>
              navigate('/workers')
            }
            style={{
              marginBottom: '16px',
            }}
          >
            <ArrowLeft size={16} />
            Workers
          </button>

          <span className="eyebrow">
            WORKER PROFILE
          </span>

          <h1>
            {worker.first_name}{' '}
            {worker.last_name}
          </h1>

          <p>
            Employee{' '}
            {worker.employee_number}
          </p>

        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >

          <button
            className="secondary-button"
            onClick={() => {
              setEditing(true)
              setMessage(null)
            }}
          >
            <Edit3 size={16} />
            Edit Worker
          </button>

          <button
            className="primary-button"
            onClick={startFce}
          >
            <ClipboardCheck
              size={16}
            />
            Start FCE
          </button>

        </div>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {/* EDIT WORKER */}

      {editing && (
        <form
          className="panel stack"
          onSubmit={saveWorker}
        >

          <div className="page-heading">

            <div>
              <h2>
                Edit Worker Assignment
              </h2>

              <p>
                Assign this worker to the
                correct mining structure
                and job-demand profile.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={cancelEdit}
            >
              <X size={16} />
              Cancel
            </button>

          </div>

          <div className="form-grid">

            <label>
              <span>
                Mining Operation
              </span>

              <select
                value={
                  editForm.operation_id
                }
                onChange={(event) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      operation_id:
                        event.target
                          .value,
                    })
                  )
                }
              >
                <option value="">
                  Not assigned
                </option>

                {operations.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
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
                value={
                  editForm.site_id
                }
                onChange={(event) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      site_id:
                        event.target
                          .value,
                    })
                  )
                }
              >
                <option value="">
                  Not assigned
                </option>

                {sites.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
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
                  editForm.department_id
                }
                onChange={(event) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      department_id:
                        event.target
                          .value,
                    })
                  )
                }
              >
                <option value="">
                  Not assigned
                </option>

                {departments.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
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
                value={
                  editForm.job_profile_id
                }
                onChange={(event) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      job_profile_id:
                        event.target
                          .value,
                    })
                  )
                }
              >
                <option value="">
                  Not assigned
                </option>

                {jobProfiles.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.title}
                    </option>
                  )
                )}

              </select>
            </label>

            <label>
              <span>
                Employment Status
              </span>

              <select
                value={
                  editForm
                    .employment_status
                }
                onChange={(event) =>
                  setEditForm(
                    (current) => ({
                      ...current,
                      employment_status:
                        event.target
                          .value,
                    })
                  )
                }
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

                <option value="on_leave">
                  On Leave
                </option>

                <option value="terminated">
                  Terminated
                </option>
              </select>
            </label>

          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            <Save size={16} />

            {saving
              ? 'Saving...'
              : 'Save Assignment'}
          </button>

        </form>
      )}

      {/* WORKER DETAILS */}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <User size={20} />
          </div>

          <div>
            <h2>
              Worker Details
            </h2>
          </div>

        </div>

        <div className="fce-info-table">

          <div>
            <span>
              Employee Number
            </span>

            <strong>
              {worker.employee_number}
            </strong>
          </div>

          <div>
            <span>
              Date of Birth
            </span>

            <strong>
              {formatDate(
                worker.date_of_birth
              )}
            </strong>
          </div>

          <div>
            <span>Sex</span>

            <strong>
              {formatStatus(
                worker.sex
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* MINING PLACEMENT */}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <MapPin size={20} />
          </div>

          <div>
            <h2>
              Mining Placement
            </h2>
          </div>

        </div>

        <div className="fce-info-table">

          <div>
            <span>Operation</span>

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
            <span>Department</span>

            <strong>
              {department?.name ||
                'Not assigned'}
            </strong>
          </div>

        </div>

      </div>

      {/* JOB PROFILE */}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <BriefcaseBusiness
              size={20}
            />
          </div>

          <div>
            <h2>
              Job Profile
            </h2>
          </div>

        </div>

        <div className="fce-info-table">

          <div>
            <span>Job</span>

            <strong>
              {jobProfile?.title ||
                'Not assigned'}
            </strong>
          </div>

        </div>

      </div>

      {/* STATUS */}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2>
              Current Status
            </h2>
          </div>

        </div>

        <div className="fce-info-table">

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
              Fitness Status
            </span>

            <strong>
              {formatStatus(
                worker.fitness_status
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* ASSESSMENT HISTORY */}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Building2 size={20} />
          </div>

          <div>
            <h2>
              Assessment History
            </h2>

            <p>
              Previous and active
              assessments for this worker.
            </p>
          </div>

        </div>

        {assessments.length === 0 ? (
          <p>
            No assessments recorded for
            this worker.
          </p>
        ) : (
          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Outcome</th>
                  <th>Action</th>
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
                        {formatDate(
                          assessment
                            .assessment_date
                        )}
                      </td>

                      <td>
                        {formatStatus(
                          assessment
                            .assessment_type
                        )}
                      </td>

                      <td>
                        {formatStatus(
                          assessment
                            .assessment_status
                        )}
                      </td>

                      <td>
                        {formatStatus(
                          assessment
                            .final_outcome
                        )}
                      </td>

                      <td>

                        <button
                          className="secondary-button"
                          onClick={() => {
                            if (
                              assessment
                                .assessment_status ===
                              'completed'
                            ) {
                              navigate(
                                `/assessments/${assessment.id}/record`
                              )
                            } else {
                              navigate(
                                `/assessments/${assessment.id}`
                              )
                            }
                          }}
                        >
                          {assessment
                            .assessment_status ===
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

      </div>

    </div>
  )
}
