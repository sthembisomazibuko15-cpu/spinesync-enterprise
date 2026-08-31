import {
  BriefcaseBusiness,
  Edit3,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'

import {
  FormEvent,
  useEffect,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

type JobProfile = {
  id: string
  organisation_id: string
  title: string
  job_code: string | null
  description: string | null
  physical_demand_level: string | null
  lifting_required_kg: number | null
  carrying_required_kg: number | null
  push_required_kg: number | null
  pull_required_kg: number | null
  standing_required_minutes: number | null
  walking_required_minutes: number | null
  stair_climbing_required: boolean | null
  ladder_climbing_required: boolean | null
  squatting_required: boolean | null
  kneeling_required: boolean | null
  crawling_required: boolean | null
  overhead_work_required: boolean | null
  repetitive_upper_limb_required: boolean | null
  uneven_ground_required: boolean | null
  confined_space_required: boolean | null
  notes: string | null
}

type FormState = {
  title: string
  job_code: string
  description: string
  physical_demand_level: string
  lifting_required_kg: string
  carrying_required_kg: string
  push_required_kg: string
  pull_required_kg: string
  standing_required_minutes: string
  walking_required_minutes: string
  stair_climbing_required: boolean
  ladder_climbing_required: boolean
  squatting_required: boolean
  kneeling_required: boolean
  crawling_required: boolean
  overhead_work_required: boolean
  repetitive_upper_limb_required: boolean
  uneven_ground_required: boolean
  confined_space_required: boolean
  notes: string
}

const emptyForm: FormState = {
  title: '',
  job_code: '',
  description: '',
  physical_demand_level: '',
  lifting_required_kg: '',
  carrying_required_kg: '',
  push_required_kg: '',
  pull_required_kg: '',
  standing_required_minutes: '',
  walking_required_minutes: '',
  stair_climbing_required: false,
  ladder_climbing_required: false,
  squatting_required: false,
  kneeling_required: false,
  crawling_required: false,
  overhead_work_required: false,
  repetitive_upper_limb_required: false,
  uneven_ground_required: false,
  confined_space_required: false,
  notes: '',
}

export default function JobProfiles() {
  const [profiles, setProfiles] =
    useState<JobProfile[]>([])

  const [organisationId, setOrganisationId] =
    useState<string | null>(null)

  const [form, setForm] =
    useState<FormState>(emptyForm)

  const [editingId, setEditingId] =
    useState<string | null>(null)

  const [showForm, setShowForm] =
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
    initialise()
  }, [])

  async function initialise() {
    setLoading(true)
    setError(null)

    const {
      data: authData,
      error: authError,
    } = await supabase.auth.getUser()

    if (
      authError ||
      !authData.user
    ) {
      setError(
        authError?.message ||
          'Unable to identify logged-in user.'
      )
      setLoading(false)
      return
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('organisation_id')
      .eq('id', authData.user.id)
      .single()

    if (
      profileError ||
      !profileData?.organisation_id
    ) {
      setError(
        profileError?.message ||
          'No organisation linked to this account.'
      )
      setLoading(false)
      return
    }

    setOrganisationId(
      profileData.organisation_id
    )

    await loadJobProfiles(
      profileData.organisation_id
    )

    setLoading(false)
  }

  async function loadJobProfiles(
    orgId: string
  ) {
    const {
      data,
      error: loadError,
    } = await supabase
      .from('job_profiles')
      .select(`
        id,
        organisation_id,
        title,
        job_code,
        description,
        physical_demand_level,
        lifting_required_kg,
        carrying_required_kg,
        push_required_kg,
        pull_required_kg,
        standing_required_minutes,
        walking_required_minutes,
        stair_climbing_required,
        ladder_climbing_required,
        squatting_required,
        kneeling_required,
        crawling_required,
        overhead_work_required,
        repetitive_upper_limb_required,
        uneven_ground_required,
        confined_space_required,
        notes
      `)
      .eq('organisation_id', orgId)
      .order('title')

    if (loadError) {
      setError(loadError.message)
      return
    }

    setProfiles(
      (data ?? []) as JobProfile[]
    )
  }

  function updateField(
    field: keyof FormState,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function numberOrNull(
    value: string
  ) {
    if (!value.trim()) {
      return null
    }

    const number =
      Number(value)

    return Number.isNaN(number)
      ? null
      : number
  }

  function openNewProfile() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setError(null)
    setMessage(null)
  }

  function editProfile(
    profile: JobProfile
  ) {
    setEditingId(profile.id)

    setForm({
      title:
        profile.title || '',

      job_code:
        profile.job_code || '',

      description:
        profile.description || '',

      physical_demand_level:
        profile.physical_demand_level || '',

      lifting_required_kg:
        profile.lifting_required_kg !== null
          ? String(
              profile.lifting_required_kg
            )
          : '',

      carrying_required_kg:
        profile.carrying_required_kg !== null
          ? String(
              profile.carrying_required_kg
            )
          : '',

      push_required_kg:
        profile.push_required_kg !== null
          ? String(
              profile.push_required_kg
            )
          : '',

      pull_required_kg:
        profile.pull_required_kg !== null
          ? String(
              profile.pull_required_kg
            )
          : '',

      standing_required_minutes:
        profile.standing_required_minutes !== null
          ? String(
              profile.standing_required_minutes
            )
          : '',

      walking_required_minutes:
        profile.walking_required_minutes !== null
          ? String(
              profile.walking_required_minutes
            )
          : '',

      stair_climbing_required:
        Boolean(
          profile.stair_climbing_required
        ),

      ladder_climbing_required:
        Boolean(
          profile.ladder_climbing_required
        ),

      squatting_required:
        Boolean(
          profile.squatting_required
        ),

      kneeling_required:
        Boolean(
          profile.kneeling_required
        ),

      crawling_required:
        Boolean(
          profile.crawling_required
        ),

      overhead_work_required:
        Boolean(
          profile.overhead_work_required
        ),

      repetitive_upper_limb_required:
        Boolean(
          profile.repetitive_upper_limb_required
        ),

      uneven_ground_required:
        Boolean(
          profile.uneven_ground_required
        ),

      confined_space_required:
        Boolean(
          profile.confined_space_required
        ),

      notes:
        profile.notes || '',
    })

    setShowForm(true)
    setError(null)
    setMessage(null)
  }

  async function saveJobProfile(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!organisationId) {
      return
    }

    if (!form.title.trim()) {
      setError(
        'Job title is required.'
      )
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    const payload = {
      organisation_id:
        organisationId,

      title:
        form.title.trim(),

      job_code:
        form.job_code.trim() || null,

      description:
        form.description.trim() || null,

      physical_demand_level:
        form.physical_demand_level ||
        null,

      lifting_required_kg:
        numberOrNull(
          form.lifting_required_kg
        ),

      carrying_required_kg:
        numberOrNull(
          form.carrying_required_kg
        ),

      push_required_kg:
        numberOrNull(
          form.push_required_kg
        ),

      pull_required_kg:
        numberOrNull(
          form.pull_required_kg
        ),

      standing_required_minutes:
        numberOrNull(
          form.standing_required_minutes
        ),

      walking_required_minutes:
        numberOrNull(
          form.walking_required_minutes
        ),

      stair_climbing_required:
        form.stair_climbing_required,

      ladder_climbing_required:
        form.ladder_climbing_required,

      squatting_required:
        form.squatting_required,

      kneeling_required:
        form.kneeling_required,

      crawling_required:
        form.crawling_required,

      overhead_work_required:
        form.overhead_work_required,

      repetitive_upper_limb_required:
        form.repetitive_upper_limb_required,

      uneven_ground_required:
        form.uneven_ground_required,

      confined_space_required:
        form.confined_space_required,

      notes:
        form.notes.trim() || null,
    }

    if (editingId) {
      const {
        error: updateError,
      } = await supabase
        .from('job_profiles')
        .update(payload)
        .eq('id', editingId)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }

      setMessage(
        'Job profile updated successfully.'
      )
    } else {
      const {
        error: insertError,
      } = await supabase
        .from('job_profiles')
        .insert(payload)

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }

      setMessage(
        'Job profile created successfully.'
      )
    }

    await loadJobProfiles(
      organisationId
    )

    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
    setSaving(false)
  }

  async function deleteProfile(
    profile: JobProfile
  ) {
    const confirmed =
      window.confirm(
        `Delete "${profile.title}"?`
      )

    if (!confirmed) {
      return
    }

    setError(null)
    setMessage(null)

    const {
      error: deleteError,
    } = await supabase
      .from('job_profiles')
      .delete()
      .eq('id', profile.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setMessage(
      'Job profile deleted.'
    )

    if (organisationId) {
      await loadJobProfiles(
        organisationId
      )
    }
  }

  function demandList(
    profile: JobProfile
  ) {
    const items: string[] = []

    if (
      profile.lifting_required_kg !== null
    ) {
      items.push(
        `Lift ${profile.lifting_required_kg} kg`
      )
    }

    if (
      profile.carrying_required_kg !== null
    ) {
      items.push(
        `Carry ${profile.carrying_required_kg} kg`
      )
    }

    if (
      profile.push_required_kg !== null
    ) {
      items.push(
        `Push ${profile.push_required_kg} kg`
      )
    }

    if (
      profile.pull_required_kg !== null
    ) {
      items.push(
        `Pull ${profile.pull_required_kg} kg`
      )
    }

    return items
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading job profiles...
        </p>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>
          <span className="eyebrow">
            OCCUPATIONAL DEMANDS
          </span>

          <h1>
            Job Profiles
          </h1>

          <p>
            Build physical job-demand
            profiles for mining roles and
            compare them with worker FCE
            performance.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={openNewProfile}
        >
          <Plus size={16} />
          New Job Profile
        </button>

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

      {showForm && (
        <form
          className="panel stack"
          onSubmit={saveJobProfile}
        >

          <div className="page-heading">

            <div>
              <h2>
                {editingId
                  ? 'Edit Job Profile'
                  : 'New Job Profile'}
              </h2>

              <p>
                Record the actual physical
                demands required for this
                occupation.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
                setForm(emptyForm)
              }}
            >
              <X size={16} />
              Close
            </button>

          </div>

          <div className="form-grid">

            <label>
              <span>
                Job Title *
              </span>

              <input
                value={form.title}
                onChange={(event) =>
                  updateField(
                    'title',
                    event.target.value
                  )
                }
                placeholder="e.g. Rock Drill Operator"
                required
              />
            </label>

            <label>
              <span>
                Job Code
              </span>

              <input
                value={form.job_code}
                onChange={(event) =>
                  updateField(
                    'job_code',
                    event.target.value
                  )
                }
                placeholder="e.g. RDO-001"
              />
            </label>

            <label>
              <span>
                Physical Demand Level
              </span>

              <select
                value={
                  form.physical_demand_level
                }
                onChange={(event) =>
                  updateField(
                    'physical_demand_level',
                    event.target.value
                  )
                }
              >
                <option value="">
                  Select demand level
                </option>

                <option value="sedentary">
                  Sedentary
                </option>

                <option value="light">
                  Light
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="heavy">
                  Heavy
                </option>

                <option value="very_heavy">
                  Very Heavy
                </option>
              </select>
            </label>

          </div>

          <label>
            <span>
              Job Description
            </span>

            <textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                updateField(
                  'description',
                  event.target.value
                )
              }
              placeholder="Describe the main duties performed in this role"
            />
          </label>

          <div>
            <h3>
              Force & Material Handling
            </h3>

            <p>
              Enter the minimum required
              capacity for the role.
            </p>
          </div>

          <div className="form-grid">

            <label>
              <span>
                Lifting Requirement (kg)
              </span>

              <input
                type="number"
                step="0.1"
                min="0"
                value={
                  form.lifting_required_kg
                }
                onChange={(event) =>
                  updateField(
                    'lifting_required_kg',
                    event.target.value
                  )
                }
                placeholder="e.g. 25"
              />
            </label>

            <label>
              <span>
                Carry Requirement (kg)
              </span>

              <input
                type="number"
                step="0.1"
                min="0"
                value={
                  form.carrying_required_kg
                }
                onChange={(event) =>
                  updateField(
                    'carrying_required_kg',
                    event.target.value
                  )
                }
                placeholder="e.g. 20"
              />
            </label>

            <label>
              <span>
                Push Requirement (kg)
              </span>

              <input
                type="number"
                step="0.1"
                min="0"
                value={
                  form.push_required_kg
                }
                onChange={(event) =>
                  updateField(
                    'push_required_kg',
                    event.target.value
                  )
                }
                placeholder="e.g. 30"
              />
            </label>

            <label>
              <span>
                Pull Requirement (kg)
              </span>

              <input
                type="number"
                step="0.1"
                min="0"
                value={
                  form.pull_required_kg
                }
                onChange={(event) =>
                  updateField(
                    'pull_required_kg',
                    event.target.value
                  )
                }
                placeholder="e.g. 30"
              />
            </label>

          </div>

          <div>
            <h3>
              Mobility & Endurance
            </h3>
          </div>

          <div className="form-grid">

            <label>
              <span>
                Standing Requirement
                (minutes)
              </span>

              <input
                type="number"
                min="0"
                value={
                  form.standing_required_minutes
                }
                onChange={(event) =>
                  updateField(
                    'standing_required_minutes',
                    event.target.value
                  )
                }
                placeholder="e.g. 120"
              />
            </label>

            <label>
              <span>
                Walking Requirement
                (minutes)
              </span>

              <input
                type="number"
                min="0"
                value={
                  form.walking_required_minutes
                }
                onChange={(event) =>
                  updateField(
                    'walking_required_minutes',
                    event.target.value
                  )
                }
                placeholder="e.g. 90"
              />
            </label>

          </div>

          <div>
            <h3>
              Postural & Environmental
              Demands
            </h3>

            <p>
              Select all demands that form
              a meaningful part of the job.
            </p>
          </div>

          <div className="form-grid">

            <label>
              <input
                type="checkbox"
                checked={
                  form.stair_climbing_required
                }
                onChange={(event) =>
                  updateField(
                    'stair_climbing_required',
                    event.target.checked
                  )
                }
              />
              Stair Climbing
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  form.ladder_climbing_required
                }
                onChange={(event) =>
                  updateField(
                    'ladder_climbing_required',
                    event.target.checked
                  )
                }
              />
              Ladder Climbing
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  form.squatting_required
                }
                onChange={(event) =>
                  updateField(
                    'squatting_required',
                    event.target.checked
                  )
                }
              />
              Squatting
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  form.kneeling_required
                }
                onChange={(event) =>
                  updateField(
                    'kneeling_required',
                    event.target.checked
                  )
                }
              />
              Kneeling
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  form.crawling_required
                }
                onChange={(event) =>
                  updateField(
                    'crawling_required',
                    event.target.checked
                  )
                }
              />
              Crawling
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  form.overhead_work_required
                }
                onChange={(event) =>
                  updateField(
                    'overhead_work_required',
                    event.target.checked
                  )
                }
              />
              Overhead Work
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  form.repetitive_upper_limb_required
                }
                onChange={(event) =>
                  updateField(
                    'repetitive_upper_limb_required',
                    event.target.checked
                  )
                }
              />
              Repetitive Upper-Limb Work
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  form.uneven_ground_required
                }
                onChange={(event) =>
                  updateField(
                    'uneven_ground_required',
                    event.target.checked
                  )
                }
              />
              Uneven Ground
            </label>

            <label>
              <input
                type="checkbox"
                checked={
                  form.confined_space_required
                }
                onChange={(event) =>
                  updateField(
                    'confined_space_required',
                    event.target.checked
                  )
                }
              />
              Confined Space
            </label>

          </div>

          <label>
            <span>
              Additional Notes
            </span>

            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) =>
                updateField(
                  'notes',
                  event.target.value
                )
              }
              placeholder="Additional hazards, task requirements or job-demand observations"
            />
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            <Save size={16} />

            {saving
              ? 'Saving...'
              : editingId
                ? 'Update Job Profile'
                : 'Save Job Profile'}
          </button>

        </form>
      )}

      {!showForm && (
        <div className="stack">

          {profiles.length === 0 ? (
            <div className="panel">

              <h3>
                No job profiles yet
              </h3>

              <p>
                Create your first mining
                job-demand profile to begin
                matching worker FCE results
                with occupational demands.
              </p>

            </div>
          ) : (
            profiles.map((profile) => (
              <div
                className="panel"
                key={profile.id}
              >

                <div className="page-heading">

                  <div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <BriefcaseBusiness
                        size={20}
                      />

                      <h3>
                        {profile.title}
                      </h3>
                    </div>

                    <p>
                      {profile.job_code ||
                        'No job code'}
                      {' • '}
                      {profile.physical_demand_level
                        ? profile.physical_demand_level
                            .split('_')
                            .join(' ')
                        : 'Demand level not set'}
                    </p>

                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                    }}
                  >

                    <button
                      className="secondary-button"
                      onClick={() =>
                        editProfile(profile)
                      }
                    >
                      <Edit3 size={15} />
                      Edit
                    </button>

                    <button
                      className="secondary-button"
                      onClick={() =>
                        deleteProfile(profile)
                      }
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>

                  </div>

                </div>

                {profile.description && (
                  <p>
                    {profile.description}
                  </p>
                )}

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    marginTop: '14px',
                  }}
                >
                  {demandList(profile).map(
                    (demand) => (
                      <span
                        key={demand}
                        className="badge"
                      >
                        {demand}
                      </span>
                    )
                  )}
                </div>

              </div>
            ))
          )}

        </div>
      )}

    </div>
  )
}
