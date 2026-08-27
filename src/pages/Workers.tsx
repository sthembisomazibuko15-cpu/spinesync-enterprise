import {
  Search,
  UserPlus,
  X,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  sex: string | null
  employment_status: string
  fitness_status: string
  created_at: string
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
  title: string
}

const emptyForm = {
  employee_number: '',
  first_name: '',
  last_name: '',
  date_of_birth: '',
  sex: '',
  operation_id: '',
  site_id: '',
  department_id: '',
  job_profile_id: '',
  employment_status: 'active',
  fitness_status: 'not_assessed',
}

export default function Workers() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [workers, setWorkers] =
    useState<Worker[]>([])

  const [operations, setOperations] =
    useState<Operation[]>([])

  const [sites, setSites] =
    useState<Site[]>([])

  const [
    departments,
    setDepartments,
  ] = useState<Department[]>([])

  const [
    jobProfiles,
    setJobProfiles,
  ] = useState<JobProfile[]>([])

  const [
    organisationId,
    setOrganisationId,
  ] = useState<string | null>(null)

  const [query, setQuery] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [
    showModal,
    setShowModal,
  ] = useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [form, setForm] =
    useState(emptyForm)

  useEffect(() => {
    initialise()
  }, [user])

  async function initialise() {
    if (!user) return

    setLoading(true)
    setError(null)

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('organisation_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (!profile?.organisation_id) {
      setError('No organisation assigned.')
      setLoading(false)
      return
    }

    setOrganisationId(
      profile.organisation_id
    )

    await Promise.all([
      loadWorkers(
        profile.organisation_id
      ),
      loadOptions(
        profile.organisation_id
      ),
    ])

    setLoading(false)
  }

  async function loadWorkers(
    organisation: string
  ) {
    const {
      data,
      error,
    } = await supabase
      .from('workers')
      .select(`
        id,
        employee_number,
        first_name,
        last_name,
        sex,
        employment_status,
        fitness_status,
        created_at
      `)
      .eq(
        'organisation_id',
        organisation
      )
      .order(
        'created_at',
        {
          ascending: false,
        }
      )

    if (error) {
      setError(error.message)
      return
    }

    setWorkers(
      (data ?? []) as Worker[]
    )
  }

  async function loadOptions(
    organisation: string
  ) {
    const [
      operationsResult,
      sitesResult,
      departmentsResult,
      jobsResult,
    ] = await Promise.all([
      supabase
        .from('operations')
        .select('id,name')
        .eq(
          'organisation_id',
          organisation
        )
        .order('name'),

      supabase
        .from('sites')
        .select(
          'id,operation_id,name'
        )
        .order('name'),

      supabase
        .from('departments')
        .select(
          'id,site_id,name'
        )
        .order('name'),

      supabase
        .from('job_profiles')
        .select('id,title')
        .eq(
          'organisation_id',
          organisation
        )
        .order('title'),
    ])

    const firstError =
      operationsResult.error ||
      sitesResult.error ||
      departmentsResult.error ||
      jobsResult.error

    if (firstError) {
      setError(firstError.message)
      return
    }

    setOperations(
      operationsResult.data ?? []
    )

    setSites(
      sitesResult.data ?? []
    )

    setDepartments(
      departmentsResult.data ?? []
    )

    setJobProfiles(
      jobsResult.data ?? []
    )
  }

  async function saveWorker(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!organisationId)
      return

    setSaving(true)
    setError(null)

    const {
      error: insertError,
    } = await supabase
      .from('workers')
      .insert({
        organisation_id:
          organisationId,

        employee_number:
          form.employee_number.trim(),

        first_name:
          form.first_name.trim(),

        last_name:
          form.last_name.trim(),

        date_of_birth:
          form.date_of_birth ||
          null,

        sex:
          form.sex ||
          null,

        operation_id:
          form.operation_id ||
          null,

        site_id:
          form.site_id ||
          null,

        department_id:
          form.department_id ||
          null,

        job_profile_id:
          form.job_profile_id ||
          null,

        employment_status:
          form.employment_status,

        fitness_status:
          form.fitness_status,
      })

    if (insertError) {
      setError(
        insertError.message
      )

      setSaving(false)
      return
    }

    setForm(emptyForm)
    setShowModal(false)

    await loadWorkers(
      organisationId
    )

    setSaving(false)
  }

  const filteredWorkers =
    useMemo(() => {
      const search =
        query
          .trim()
          .toLowerCase()

      if (!search)
        return workers

      return workers.filter(
        (worker) =>
          [
            worker.employee_number,
            worker.first_name,
            worker.last_name,
          ].some(
            (value) =>
              value
                .toLowerCase()
                .includes(search)
          )
      )
    }, [workers, query])

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

  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>Workers</h2>

          <p>
            Manage the mine workforce
            and functional status.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setShowModal(true)
          }
        >
          <UserPlus size={16} />
          Add worker
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="worker-summary-grid">
        <div className="worker-summary-card">
          <span>Total workers</span>
          <strong>
            {workers.length}
          </strong>
        </div>

        <div className="worker-summary-card">
          <span>Fit</span>
          <strong>
            {
              workers.filter(
                (worker) =>
                  worker.fitness_status ===
                  'fit'
              ).length
            }
          </strong>
        </div>

        <div className="worker-summary-card">
          <span>Restricted</span>
          <strong>
            {
              workers.filter(
                (worker) =>
                  worker.fitness_status ===
                  'fit_with_restrictions'
              ).length
            }
          </strong>
        </div>

        <div className="worker-summary-card">
          <span>Not assessed</span>
          <strong>
            {
              workers.filter(
                (worker) =>
                  worker.fitness_status ===
                  'not_assessed'
              ).length
            }
          </strong>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Search workers..."
            />
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  Employee no.
                </th>
                <th>
                  Worker
                </th>
                <th>
                  Sex
                </th>
                <th>
                  Employment
                </th>
                <th>
                  Fitness
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5}>
                    Loading workers...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredWorkers.length ===
                  0 && (
                  <tr>
                    <td colSpan={5}>
                      No workers yet.
                    </td>
                  </tr>
                )}

              {!loading &&
                filteredWorkers.map(
                  (worker) => (
                    <tr
                      key={worker.id}
                    >
                      <td>
                        {
                          worker.employee_number
                        }
                      </td>

                      <td>
                        <button
                          className="worker-link"
                          onClick={() =>
                            navigate(
                              `/workers/${worker.id}`
                            )
                          }
                        >
                          {
                            worker.first_name
                          }{' '}
                          {
                            worker.last_name
                          }
                        </button>
                      </td>

                      <td>
                        {worker.sex
                          ? formatStatus(
                              worker.sex
                            )
                          : '—'}
                      </td>

                      <td>
                        {formatStatus(
                          worker.employment_status
                        )}
                      </td>

                      <td>
                        <span
                          className={`badge ${worker.fitness_status}`}
                        >
                          {formatStatus(
                            worker.fitness_status
                          )}
                        </span>
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="modal-overlay">
          <div className="worker-modal">
            <div className="modal-header">
              <div>
                <span className="eyebrow">
                  WORKER REGISTRY
                </span>

                <h2>
                  Add worker
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="worker-form"
              onSubmit={saveWorker}
            >
              <div className="form-grid">

                <label>
                  Employee number

                  <input
                    value={
                      form.employee_number
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        employee_number:
                          event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  First name

                  <input
                    value={
                      form.first_name
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        first_name:
                          event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Last name

                  <input
                    value={
                      form.last_name
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        last_name:
                          event.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Date of birth

                  <input
                    type="date"
                    value={
                      form.date_of_birth
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        date_of_birth:
                          event.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Sex

                  <select
                    value={form.sex}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        sex:
                          event.target.value,
                      })
                    }
                  >
                    <option value="">
                      Select sex
                    </option>
                    <option value="male">
                      Male
                    </option>
                    <option value="female">
                      Female
                    </option>
                    <option value="other">
                      Other
                    </option>
                  </select>
                </label>

                <label>
                  Mining operation

                  <select
                    value={
                      form.operation_id
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        operation_id:
                          event.target.value,
                        site_id: '',
                        department_id: '',
                      })
                    }
                  >
                    <option value="">
                      Select operation
                    </option>

                    {operations.map(
                      (operation) => (
                        <option
                          key={
                            operation.id
                          }
                          value={
                            operation.id
                          }
                        >
                          {
                            operation.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Site / Shaft

                  <select
                    value={
                      form.site_id
                    }
                    disabled={
                      !form.operation_id
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        site_id:
                          event.target.value,
                        department_id: '',
                      })
                    }
                  >
                    <option value="">
                      Select site
                    </option>

                    {sites
                      .filter(
                        (site) =>
                          site.operation_id ===
                          form.operation_id
                      )
                      .map(
                        (site) => (
                          <option
                            key={
                              site.id
                            }
                            value={
                              site.id
                            }
                          >
                            {
                              site.name
                            }
                          </option>
                        )
                      )}
                  </select>
                </label>

                <label>
                  Department

                  <select
                    value={
                      form.department_id
                    }
                    disabled={
                      !form.site_id
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        department_id:
                          event.target.value,
                      })
                    }
                  >
                    <option value="">
                      Select department
                    </option>

                    {departments
                      .filter(
                        (department) =>
                          department.site_id ===
                          form.site_id
                      )
                      .map(
                        (department) => (
                          <option
                            key={
                              department.id
                            }
                            value={
                              department.id
                            }
                          >
                            {
                              department.name
                            }
                          </option>
                        )
                      )}
                  </select>
                </label>

                <label>
                  Job profile

                  <select
                    value={
                      form.job_profile_id
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        job_profile_id:
                          event.target.value,
                      })
                    }
                  >
                    <option value="">
                      Select job
                    </option>

                    {jobProfiles.map(
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

                <label>
                  Employment status

                  <select
                    value={
                      form.employment_status
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        employment_status:
                          event.target.value,
                      })
                    }
                  >
                    <option value="active">
                      Active
                    </option>
                    <option value="medical_leave">
                      Medical leave
                    </option>
                    <option value="restricted_duty">
                      Restricted duty
                    </option>
                    <option value="rehabilitation">
                      Rehabilitation
                    </option>
                    <option value="inactive">
                      Inactive
                    </option>
                  </select>
                </label>

                <label>
                  Fitness status

                  <select
                    value={
                      form.fitness_status
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        fitness_status:
                          event.target.value,
                      })
                    }
                  >
                    <option value="not_assessed">
                      Not assessed
                    </option>
                    <option value="fit">
                      Fit
                    </option>
                    <option value="fit_with_restrictions">
                      Fit with restrictions
                    </option>
                    <option value="temporarily_unfit">
                      Temporarily unfit
                    </option>
                    <option value="rehabilitation">
                      Rehabilitation
                    </option>
                    <option value="reassessment_required">
                      Reassessment required
                    </option>
                  </select>
                </label>

              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : 'Save worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
