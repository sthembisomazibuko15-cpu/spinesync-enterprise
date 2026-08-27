import {
  Activity,
  Building2,
  ArrowRight,
} from 'lucide-react'

import {
  useState,
  type FormEvent,
} from 'react'

import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'

export default function Onboarding() {
  const navigate = useNavigate()

  const [organisationName, setOrganisationName] =
    useState('')

  const [country, setCountry] =
    useState('South Africa')

  const [loading, setLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault()

    setLoading(true)
    setError(null)

    const { error } = await supabase.rpc(
      'create_my_organisation',
      {
        organisation_name:
          organisationName.trim(),

        organisation_country:
          country.trim(),
      }
    )

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    navigate('/dashboard', {
      replace: true,
    })

    window.location.reload()
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <div className="onboarding-logo">
          <Activity size={28} />
        </div>

        <span className="eyebrow">
          SPINESYNC ENTERPRISE
        </span>

        <h1>
          Set up your organisation
        </h1>

        <p>
          Create the organisation that will
          manage your mining operations,
          workers, assessments and reports.
        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="onboarding-form"
        >
          <label>
            Organisation name

            <div className="onboarding-input">
              <Building2 size={18} />

              <input
                value={organisationName}
                onChange={(event) =>
                  setOrganisationName(
                    event.target.value
                  )
                }
                placeholder="Example: M&M Mining Health"
                required
              />
            </div>
          </label>

          <label>
            Country

            <input
              className="plain-input"
              value={country}
              onChange={(event) =>
                setCountry(
                  event.target.value
                )
              }
              required
            />
          </label>

          <button
            className="login-submit"
            disabled={loading}
          >
            {loading
              ? 'Creating organisation...'
              : 'Create organisation'}

            {!loading && (
              <ArrowRight size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
