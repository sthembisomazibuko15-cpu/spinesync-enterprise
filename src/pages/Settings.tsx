import {
  Save,
  Upload,
  UserRound,
} from 'lucide-react'

import {
  ChangeEvent,
  FormEvent,
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

  const [uploading, setUploading] =
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
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      setError(profileError.message)
      setLoading(false)
      return
    }

    const typedProfile =
      data as Profile

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
        typedProfile.email || '',
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
    event: FormEvent
  ) {
    event.preventDefault()

    if (!profile) {
      return
    }

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

  async function uploadSignature(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0]

    if (!file || !profile) {
      return
    }

    setUploading(true)
    setMessage(null)
    setError(null)

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ]

    if (
      !allowedTypes.includes(file.type)
    ) {
      setError(
        'Please upload a PNG, JPG, or WEBP image.'
      )
      setUploading(false)
      event.target.value = ''
      return
    }

    if (
      file.size >
      2 * 1024 * 1024
    ) {
      setError(
        'Signature image must be smaller than 2 MB.'
      )
      setUploading(false)
      event.target.value = ''
      return
    }

    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase() || 'png'

    const filePath =
      `${profile.id}/signature.${extension}`

    /*
      Remove previous signature file
      if one exists.
    */

    if (profile.signature_url) {
      await supabase.storage
        .from('signatures')
        .remove([
          profile.signature_url,
        ])
    }

    const {
      error: uploadError,
    } = await supabase.storage
      .from('signatures')
      .upload(
        filePath,
        file,
        {
          cacheControl: '3600',
          upsert: true,
        }
      )

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      event.target.value = ''
      return
    }

    const {
      error: profileUpdateError,
    } = await supabase
      .from('profiles')
      .update({
        signature_url:
          filePath,
      })
      .eq('id', profile.id)

    if (profileUpdateError) {
      setError(
        profileUpdateError.message
      )
      setUploading(false)
      event.target.value = ''
      return
    }

    setMessage(
      'Signature uploaded successfully.'
    )

    setUploading(false)
    event.target.value = ''

    await loadProfile()
  }

  async function removeSignature() {
    if (
      !profile ||
      !profile.signature_url
    ) {
      return
    }

    setUploading(true)
    setMessage(null)
    setError(null)

    const {
      error: storageError,
    } = await supabase.storage
      .from('signatures')
      .remove([
        profile.signature_url,
      ])

    if (storageError) {
      setError(storageError.message)
      setUploading(false)
      return
    }

    const {
      error: updateError,
    } = await supabase
      .from('profiles')
      .update({
        signature_url: null,
      })
      .eq('id', profile.id)

    if (updateError) {
      setError(updateError.message)
      setUploading(false)
      return
    }

    setMessage(
      'Signature removed.'
    )

    setUploading(false)

    await loadProfile()
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>
          Loading settings...
        </p>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>
          <span className="eyebrow">
            ACCOUNT
          </span>

          <h1>
            Settings
          </h1>

          <p>
            Manage your professional
            assessor information.
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
        className="panel stack"
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
              These details appear on
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
              value={form.full_name}
              onChange={(event) =>
                updateField(
                  'full_name',
                  event.target.value
                )
              }
              placeholder="Full professional name"
            />
          </label>

          <label>
            <span>
              Profession
            </span>

            <input
              value={form.profession}
              onChange={(event) =>
                updateField(
                  'profession',
                  event.target.value
                )
              }
              placeholder="e.g. Biokineticist"
            />
          </label>

          <label>
            <span>
              HPCSA Registration Number
            </span>

            <input
              value={
                form.hpcsa_number
              }
              onChange={(event) =>
                updateField(
                  'hpcsa_number',
                  event.target.value
                )
              }
              placeholder="HPCSA registration number"
            />
          </label>

          <label>
            <span>
              Practice / Organisation
            </span>

            <input
              value={
                form.practice_name
              }
              onChange={(event) =>
                updateField(
                  'practice_name',
                  event.target.value
                )
              }
              placeholder="Practice or organisation"
            />
          </label>

          <label>
            <span>
              Contact Number
            </span>

            <input
              value={form.phone}
              onChange={(event) =>
                updateField(
                  'phone',
                  event.target.value
                )
              }
              placeholder="Contact number"
            />
          </label>

          <label>
            <span>
              Email
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
              placeholder="Professional email"
            />
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
            : 'Save Profile'}
        </button>

      </form>

      <div className="panel stack">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Upload size={20} />
          </div>

          <div>
            <h3>
              Digital Signature
            </h3>

            <p>
              Upload the signature that
              will appear on completed
              FCE reports.
            </p>
          </div>

        </div>

        {profile?.signature_url ? (
          <div className="stack">

            <div
              style={{
                padding: '20px',
                border:
                  '1px solid #e5e7eb',
                borderRadius: '12px',
                background: '#fff',
              }}
            >
              <p>
                Signature uploaded.
              </p>

              <small>
                {profile.signature_url}
              </small>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={
                removeSignature
              }
              disabled={uploading}
            >
              Remove Signature
            </button>

          </div>
        ) : (
          <p>
            No signature uploaded yet.
          </p>
        )}

        <label
          className="secondary-button"
          style={{
            width: 'fit-content',
            cursor: 'pointer',
          }}
        >
          <Upload size={16} />

          {uploading
            ? 'Uploading...'
            : profile?.signature_url
              ? 'Replace Signature'
              : 'Upload Signature'}

          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={uploadSignature}
            disabled={uploading}
            style={{
              display: 'none',
            }}
          />

        </label>

        <small>
          PNG, JPG or WEBP. Maximum size
          2 MB. A transparent PNG works
          best.
        </small>

      </div>

    </div>
  )
}
