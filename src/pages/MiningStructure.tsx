import {
  Building2,
  Factory,
  MapPin,
  Plus,
  Users,
} from 'lucide-react'

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

type Operation = {
  id: string
  name: string
  commodity: string | null
  province: string | null
  status: string
}

type Site = {
  id: string
  operation_id: string
  name: string
  site_type: string | null
}

type Department = {
  id: string
  site_id: string
  name: string
}

type JobProfile = {
  id: string
  title: string
  department: string | null
  lifting_required_kg: number | null
  carrying_required_kg: number | null
  msk_risk_level: string | null
}

export default function MiningStructure() {
  const { user } = useAuth()

  const [organisationId, setOrganisationId] =
    useState<string | null>(null)

  const [operations, setOperations] =
    useState<Operation[]>([])

  const [sites, setSites] =
    useState<Site[]>([])

  const [departments, setDepartments] =
    useState<Department[]>([])

  const [jobProfiles, setJobProfiles] =
    useState<JobProfile[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [operationForm, setOperationForm] =
    useState({
      name: '',
      commodity: '',
      province: '',
    })

  const [siteForm, setSiteForm] =
    useState({
      operation_id: '',
      name: '',
      site_type: 'underground',
    })

  const [departmentForm, setDepartmentForm] =
    useState({
      site_id: '',
      name: '',
    })

  const [jobForm, setJobForm] =
    useState({
      title: '',
      department: '',
      lifting_required_kg: '',
      carrying_required_kg: '',
      msk_risk_level: 'moderate',
    })

  useEffect(() => {
    initialise()
  }, [user])

  async function initialise() {
    if (!user) return

    setLoading(true)

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
        'No organisation is assigned to this account.'
      )

      setLoading(false)
      return
    }

    setOrganisationId(
      profile.organisation_id
    )

    await loadStructure(
      profile.organisation_id
    )

    setLoading(false)
  }

  async function loadStructure(
    organisation: string
  ) {
    setError(null)

    const [
      operationsResult,
      sitesResult,
      departmentsResult,
      jobsResult,
    ] = await Promise.all([
      supabase
        .from('operations')
        .select(
          'id,name,commodity,province,status'
        )
        .eq(
          'organisation_id',
          organisation
        )
        .order('name'),

      supabase
        .from('sites')
        .select(
          'id,operation_id,name,site_type'
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
        .select(`
          id,
          title,
          department,
          lifting_required_kg,
          carrying_required_kg,
          msk_risk_level
        `)
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

  async function addOperation(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!organisationId) return

    const { error } = await supabase
      .from('operations')
      .insert({
        organisation_id:
          organisationId,

        name:
          operationForm.name.trim(),

        commodity:
          operationForm.commodity.trim() ||
          null,

        province:
          operationForm.province.trim() ||
          null,
      })

    if (error) {
      setError(error.message)
      return
    }

    setOperationForm({
      name: '',
      commodity: '',
      province: '',
    })

    await loadStructure(
      organisationId
    )
  }

  async function addSite(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!siteForm.operation_id)
      return

    const { error } = await supabase
      .from('sites')
      .insert({
        operation_id:
          siteForm.operation_id,

        name:
          siteForm.name.trim(),

        site_type:
          siteForm.site_type,
      })

    if (error) {
      setError(error.message)
      return
    }

    setSiteForm({
      operation_id: '',
      name: '',
      site_type: 'underground',
    })

    if (organisationId) {
      await loadStructure(
        organisationId
      )
    }
  }

  async function addDepartment(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!departmentForm.site_id)
      return

    const { error } = await supabase
      .from('departments')
      .insert({
        site_id:
          departmentForm.site_id,

        name:
          departmentForm.name.trim(),
      })

    if (error) {
      setError(error.message)
      return
    }

    setDepartmentForm({
      site_id: '',
      name: '',
    })

    if (organisationId) {
      await loadStructure(
        organisationId
      )
    }
  }

  async function addJobProfile(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!organisationId) return

    const { error } = await supabase
      .from('job_profiles')
      .insert({
        organisation_id:
          organisationId,

        title:
          jobForm.title.trim(),

        department:
          jobForm.department.trim() ||
          null,

        lifting_required_kg:
          jobForm.lifting_required_kg
            ? Number(
                jobForm.lifting_required_kg
              )
            : null,

        carrying_required_kg:
          jobForm.carrying_required_kg
            ? Number(
                jobForm.carrying_required_kg
              )
            : null,

        msk_risk_level:
          jobForm.msk_risk_level,
      })

    if (error) {
      setError(error.message)
      return
    }

    setJobForm({
      title: '',
      department: '',
      lifting_required_kg: '',
      carrying_required_kg: '',
      msk_risk_level:
        'moderate',
    })

    await loadStructure(
      organisationId
    )
  }

  function operationName(
    id: string
  ) {
    return (
      operations.find(
        (item) =>
          item.id === id
      )?.name ?? 'Unknown'
    )
  }

  function siteName(
    id: string
  ) {
    return (
      sites.find(
        (item) =>
          item.id === id
      )?.name ?? 'Unknown'
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>
          Loading mining structure...
        </p>
      </div>
    )
  }

  return (
    <div className="stack">
      <div className="section-heading">
        <div>
          <h2>
            Mining Structure
          </h2>

          <p>
            Configure operations,
            shafts, departments and
            occupational job demands.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="structure-summary-grid">
        <div className="worker-summary-card">
          <Building2 size={20} />

          <span>
            Operations
          </span>

          <strong>
            {operations.length}
          </strong>
        </div>

        <div className="worker-summary-card">
          <MapPin size={20} />

          <span>
            Sites / Shafts
          </span>

          <strong>
            {sites.length}
          </strong>
        </div>

        <div className="worker-summary-card">
          <Users size={20} />

          <span>
            Departments
          </span>

          <strong>
            {departments.length}
          </strong>
        </div>

        <div className="worker-summary-card">
          <Factory size={20} />

          <span>
            Job Profiles
          </span>

          <strong>
            {jobProfiles.length}
          </strong>
        </div>
      </div>

      <div className="structure-grid">

        {/* OPERATION */}

        <section className="panel structure-panel">
          <div className="panel-header">
            <div>
              <h3>
                Mining Operations
              </h3>

              <span>
                Mines managed by the organisation
              </span>
            </div>
          </div>

          <form
            className="compact-form"
            onSubmit={addOperation}
          >
            <input
              value={
                operationForm.name
              }
              onChange={(event) =>
                setOperationForm({
                  ...operationForm,
                  name:
                    event.target.value,
                })
              }
              placeholder="Mine / operation name"
              required
            />

            <input
              value={
                operationForm.commodity
              }
              onChange={(event) =>
                setOperationForm({
                  ...operationForm,
                  commodity:
                    event.target.value,
                })
              }
              placeholder="Commodity e.g. Platinum"
            />

            <input
              value={
                operationForm.province
              }
              onChange={(event) =>
                setOperationForm({
                  ...operationForm,
                  province:
                    event.target.value,
                })
              }
              placeholder="Province"
            />

            <button
              className="primary-button"
            >
              <Plus size={16} />
              Add operation
            </button>
          </form>

          <div className="structure-list">
            {operations.map(
              (operation) => (
                <div
                  className="structure-item"
                  key={operation.id}
                >
                  <div>
                    <strong>
                      {operation.name}
                    </strong>

                    <span>
                      {operation.commodity ||
                        'Commodity not set'}

                      {' • '}

                      {operation.province ||
                        'Province not set'}
                    </span>
                  </div>

                  <span className="status-pill">
                    {operation.status}
                  </span>
                </div>
              )
            )}
          </div>
        </section>

        {/* SITE */}

        <section className="panel structure-panel">
          <div className="panel-header">
            <div>
              <h3>
                Sites / Shafts
              </h3>

              <span>
                Underground, surface and processing sites
              </span>
            </div>
          </div>

          <form
            className="compact-form"
            onSubmit={addSite}
          >
            <select
              value={
                siteForm.operation_id
              }
              onChange={(event) =>
                setSiteForm({
                  ...siteForm,
                  operation_id:
                    event.target.value,
                })
              }
              required
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

            <input
              value={
                siteForm.name
              }
              onChange={(event) =>
                setSiteForm({
                  ...siteForm,
                  name:
                    event.target.value,
                })
              }
              placeholder="Site / shaft name"
              required
            />

            <select
              value={
                siteForm.site_type
              }
              onChange={(event) =>
                setSiteForm({
                  ...siteForm,
                  site_type:
                    event.target.value,
                })
              }
            >
              <option value="underground">
                Underground
              </option>

              <option value="open_pit">
                Open pit
              </option>

              <option value="processing">
                Processing
              </option>

              <option value="surface">
                Surface
              </option>

              <option value="office">
                Office
              </option>

              <option value="other">
                Other
              </option>
            </select>

            <button
              className="primary-button"
            >
              <Plus size={16} />
              Add site
            </button>
          </form>

          <div className="structure-list">
            {sites.map(
              (site) => (
                <div
                  className="structure-item"
                  key={site.id}
                >
                  <div>
                    <strong>
                      {site.name}
                    </strong>

                    <span>
                      {operationName(
                        site.operation_id
                      )}

                      {' • '}

                      {site.site_type
                        ?.split('_')
                        .join(' ')}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* DEPARTMENT */}

        <section className="panel structure-panel">
          <div className="panel-header">
            <div>
              <h3>
                Departments
              </h3>

              <span>
                Workforce functional areas
              </span>
            </div>
          </div>

          <form
            className="compact-form"
            onSubmit={
              addDepartment
            }
          >
            <select
              value={
                departmentForm.site_id
              }
              onChange={(event) =>
                setDepartmentForm({
                  ...departmentForm,
                  site_id:
                    event.target.value,
                })
              }
              required
            >
              <option value="">
                Select site
              </option>

              {sites.map(
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

            <input
              value={
                departmentForm.name
              }
              onChange={(event) =>
                setDepartmentForm({
                  ...departmentForm,
                  name:
                    event.target.value,
                })
              }
              placeholder="Department name"
              required
            />

            <button
              className="primary-button"
            >
              <Plus size={16} />
              Add department
            </button>
          </form>

          <div className="structure-list">
            {departments.map(
              (department) => (
                <div
                  className="structure-item"
                  key={
                    department.id
                  }
                >
                  <div>
                    <strong>
                      {
                        department.name
                      }
                    </strong>

                    <span>
                      {siteName(
                        department.site_id
                      )}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        {/* JOB */}

        <section className="panel structure-panel">
          <div className="panel-header">
            <div>
              <h3>
                Job Profiles
              </h3>

              <span>
                Physical demand profiles
              </span>
            </div>
          </div>

          <form
            className="compact-form"
            onSubmit={
              addJobProfile
            }
          >
            <input
              value={
                jobForm.title
              }
              onChange={(event) =>
                setJobForm({
                  ...jobForm,
                  title:
                    event.target.value,
                })
              }
              placeholder="Job title"
              required
            />

            <input
              value={
                jobForm.department
              }
              onChange={(event) =>
                setJobForm({
                  ...jobForm,
                  department:
                    event.target.value,
                })
              }
              placeholder="Department"
            />

            <input
              type="number"
              value={
                jobForm.lifting_required_kg
              }
              onChange={(event) =>
                setJobForm({
                  ...jobForm,
                  lifting_required_kg:
                    event.target.value,
                })
              }
              placeholder="Required lifting kg"
            />

            <input
              type="number"
              value={
                jobForm.carrying_required_kg
              }
              onChange={(event) =>
                setJobForm({
                  ...jobForm,
                  carrying_required_kg:
                    event.target.value,
                })
              }
              placeholder="Required carrying kg"
            />

            <select
              value={
                jobForm.msk_risk_level
              }
              onChange={(event) =>
                setJobForm({
                  ...jobForm,
                  msk_risk_level:
                    event.target.value,
                })
              }
            >
              <option value="low">
                Low MSK risk
              </option>

              <option value="moderate">
                Moderate MSK risk
              </option>

              <option value="high">
                High MSK risk
              </option>

              <option value="very_high">
                Very high MSK risk
              </option>
            </select>

            <button
              className="primary-button"
            >
              <Plus size={16} />
              Add job profile
            </button>
          </form>

          <div className="structure-list">
            {jobProfiles.map(
              (job) => (
                <div
                  className="structure-item"
                  key={job.id}
                >
                  <div>
                    <strong>
                      {job.title}
                    </strong>

                    <span>
                      Lift:{' '}
                      {job.lifting_required_kg ??
                        '—'}{' '}
                      kg • Carry:{' '}
                      {job.carrying_required_kg ??
                        '—'}{' '}
                      kg
                    </span>
                  </div>

                  <span className="status-pill">
                    {job.msk_risk_level
                      ?.split('_')
                      .join(' ') ||
                      'Not set'}
                  </span>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
