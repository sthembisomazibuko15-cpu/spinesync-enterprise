import {
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

type Profile = {
  id: string
  full_name: string | null
  profession: string | null
  hpcsa_number: string | null
  practice_name: string | null
  phone: string | null
  email: string | null
  signature_url: string | null
}

export default function Settings() {
  const [profile, setProfile] =
    useState<Profile | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [message, setMessage] =
    useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    profession: '',
    hpcsa_number: '',
    practice_name: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    setError(null)

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      setError(
        userError?.message ||
          'Unable to identify the logged-in user.'
      )
      setLoading(false)
      return
    }

    const {
      data,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        profession,
        hpcsa_number,
        practice_name,
        phone,
        email,
        signature_url
      `)
      .eq('id', userData.user.id)
      .single()

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    const typedProfile = data as Profile

    setProfile(typedProfile)

    setForm({
      full_name:
        typedProfile.full_name || '',
      profession:
        typedProfile.profession || '',
      hpcsa_number:
        typedProfile.hpcsa_number || '',
      practice_name:
        typedProfile.practice_name || '',
      phone:
        typedProfile.phone || '',
      email:
        typedProfile.email ||
        userData.user.email ||
        '',
    })

    setLoading(false)
  }

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function saveProfile(
    event: React.FormEvent
  ) {
    event.preventDefault()

    if (!profile) return

    setSaving(true)
    setMessage(null)
    setError(null)

    const {
      error: updateError,
    } = await supabase
      .from('profiles')
      .update({
        full_name:
          form.full_name.trim() || null,

        profession:
          form.profession.trim() || null,

        hpcsa_number:
          form.hpcsa_number.trim() || null,

        practice_name:
          form.practice_name.trim() || null,

        phone:
          form.phone.trim() || null,

        email:
          form.email.trim() || null,
      })
      .eq('id', profile.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setMessage(
      'Assessor profile saved successfully.'
    )

    setSaving(false)

    await loadProfile()
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>
          <span className="eyebrow">
            SPINESYNC ENTERPRISE
          </span>

          <h1>Settings</h1>

          <p>
            Manage your professional
            information used across
            SpineSync reports.
          </p>
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

      <form
        className="panel"
        onSubmit={saveProfile}
      >

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <UserRound size={20} />
          </div>

          <div>
            <h3>
              Assessor Profile
            </h3>

            <p>
              These details will appear on
              completed FCE reports.
            </p>
          </div>

        </div>

        <div className="form-grid">

          <label>
            <span>
              Full Name
            </span>

            <input
              type="text"
              value={form.full_name}
              onChange={(event) =>
                updateField(
                  'full_name',
                  event.target.value
                )
              }
              placeholder="e.g. Sthembiso Mazibuko"
            />
          </label>

          <label>
            <span>
              Profession
            </span>

            <input
              type="text"
              value={form.profession}
              onChange={(event) =>
                updateField(
                  'profession',
                  event.target.value
                )
              }
              placeholder="e.g. Registered Biokineticist"
            />
          </label>

          <label>
            <span>
              HPCSA Registration Number
            </span>

            <input
              type="text"
              value={form.hpcsa_number}
              onChange={(event) =>
                updateField(
                  'hpcsa_number',
                  event.target.value
                )
              }
              placeholder="e.g. BK0000000"
            />
          </label>

          <label>
            <span>
              Practice / Organisation
            </span>

            <input
              type="text"
              value={form.practice_name}
              onChange={(event) =>
                updateField(
                  'practice_name',
                  event.target.value
                )
              }
              placeholder="e.g. M&M Rehab Hub"
            />
          </label>

          <label>
            <span>
              Contact Number
            </span>

            <input
              type="tel"
              value={form.phone}
              onChange={(event) =>
                updateField(
                  'phone',
                  event.target.value
                )
              }
              placeholder="e.g. 082 000 0000"
            />
          </label>

          <label>
            <span>
              Email Address
            </span>

            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                updateField(
                  'email',
                  event.target.value
                )
              }
              placeholder="e.g. assessor@example.com"
            />
          </label>

        </div>

        <div className="settings-note">

          <ShieldCheck size={18} />

          <p>
            SpineSync will use these details
            to identify the professional who
            completed the assessment. The
            final fitness decision remains
            the assessor's professional
            determination.
          </p>

        </div>

        <div className="form-actions">

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            <Save size={16} />

            {saving
              ? 'Saving...'
              : 'Save Assessor Profile'}
          </button>

        </div>

      </form>

    </div>
  )
}
