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

import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string

  date_of_birth:
    | string
    | null

  sex:
    | string
    | null

  employment_status: string
  fitness_status: string

  created_at: string
}

const emptyWorkerForm = {
  employee_number: '',
  first_name: '',
  last_name: '',
  date_of_birth: '',
  sex: '',
  employment_status: 'active',
  fitness_status: 'not_assessed',
}

export default function Workers() {
  const { user } = useAuth()

  const [workers, setWorkers] =
    useState<Worker[]>([])

  const [query, setQuery] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [showModal, setShowModal] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [organisationId, setOrganisationId] =
    useState<string | null>(null)

  const [form, setForm] =
    useState(emptyWorkerForm)

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
      setError(
        'No organisation assigned to this account.'
      )

      setLoading(false)
      return
    }

    setOrganisationId(
      profile.organisation_id
    )

    await loadWorkers(
      profile.organisation_id
    )

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
        date_of_birth,
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

  async function handleAddWorker(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!organisationId) {
      setError(
        'Organisation not loaded.'
      )
      return
    }

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

    setForm(
      emptyWorkerForm
    )

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

      if (!search) {
        return workers
      }

      return workers.filter(
        (worker) => {
          const values = [
            worker.employee_number,
            worker.first_name,
            worker.last_name,
            worker.employment_status,
            worker.fitness_status,
          ]

          return values.some(
            (value) =>
              value
                ?.toLowerCase()
                .includes(search)
          )
        }
      )
    }, [workers, query])

  function formatStatus(
    value: string
  ) {
    return value
      .replaceAll('_', ' ')
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      )
  }

  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>
            Workers
          </h2>

          <p>
            Manage employee records,
            functional status and
            assessment readiness.
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
          <span>
            Total workers
          </span>

          <strong>
            {workers.length}
          </strong>
        </div>

        <div className="worker-summary-card">
          <span>
            Fit
          </span>

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
          <span>
            Restricted
          </span>

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
          <span>
            Not assessed
          </span>

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

                <th>
                  Date added
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6}>
                    Loading workers...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredWorkers.length ===
                  0 && (
                  <tr>
                    <td colSpan={6}>
                      No workers found.
                    </td>
                  </tr>
                )}

              {!loading &&
                filteredWorkers.map(
                  (worker) => (
                    <tr
                      key={
                        worker.id
                      }
                    >
                      <td>
                        {
                          worker.employee_number
                        }
                      </td>

                      <td>
                        <strong>
                          {
                            worker.first_name
                          }{' '}
                          {
                            worker.last_name
                          }
                        </strong>
                      </td>

                      <td>
                        {worker.sex
                          ? formatStatus(
                              worker.sex
                            )
                          : '—'}
                      </td>

                      <td>
                        <span className="status-pill">
                          {formatStatus(
                            worker.employment_status
                          )}
                        </span>
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

                      <td>
                        {new Date(
                          worker.created_at
                        ).toLocaleDateString()}
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

                <p>
                  Create a new
                  workforce record.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleAddWorker
              }
              className="worker-form"
            >
              <div className="form-grid">
                <label>
                  Employee number

                  <input
                    value={
                      form.employee_number
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        employee_number:
                          event
                            .target
                            .value,
                      })
                    }
                    placeholder="EMP-001"
                    required
                  />
                </label>

                <label>
                  First name

                  <input
                    value={
                      form.first_name
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        first_name:
                          event
                            .target
                            .value,
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
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        last_name:
                          event
                            .target
                            .value,
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
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        date_of_birth:
                          event
                            .target
                            .value,
                      })
                    }
                  />
                </label>

                <label>
                  Sex

                  <select
                    value={
                      form.sex
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        sex:
                          event
                            .target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Select
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

                    <option value="prefer_not_to_say">
                      Prefer not to say
                    </option>
                  </select>
                </label>

                <label>
                  Employment status

                  <select
                    value={
                      form.employment_status
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        employment_status:
                          event
                            .target
                            .value,
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
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        fitness_status:
                          event
                            .target
                            .value,
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
