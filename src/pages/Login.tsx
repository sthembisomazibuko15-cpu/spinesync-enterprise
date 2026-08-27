import {
  Activity,
  ArrowRight,
  LockKeyhole,
  Mail,
} from 'lucide-react'

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()

  const {
    user,
    signIn,
    signUp,
  } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] =
    useState('')

  const [mode, setMode] =
    useState<'login' | 'signup'>('login')

  const [error, setError] =
    useState<string | null>(null)

  const [message, setMessage] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(false)

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  async function handleSubmit(
    event: FormEvent
  ) {
    event.preventDefault()

    setError(null)
    setMessage(null)
    setLoading(true)

    if (mode === 'login') {
      const result =
        await signIn(email, password)

      if (result.error) {
        setError(result.error)
      }
    } else {
      const result =
        await signUp(email, password)

      if (result.error) {
        setError(result.error)
      } else {
        setMessage(
          'Account created. Check your email if confirmation is enabled.'
        )
      }
    }

    setLoading(false)
  }

  return (
    <div className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand">
          <div className="login-logo">
            <Activity size={28} />
          </div>

          <div>
            <strong>SpineSync</strong>
            <span>Enterprise</span>
          </div>
        </div>

        <div className="login-hero">
          <span className="eyebrow">
            MINING HEALTH INTELLIGENCE
          </span>

          <h1>
            From worker capacity to safer
            work.
          </h1>

          <p>
            Musculoskeletal risk,
            functional capacity,
            rehabilitation and
            return-to-work intelligence
            in one enterprise platform.
          </p>
        </div>

        <div className="login-footer">
          SpineSync Enterprise
        </div>
      </section>

      <section className="login-form-panel">
        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div>
            <span className="eyebrow">
              SECURE ACCESS
            </span>

            <h2>
              {mode === 'login'
                ? 'Welcome back'
                : 'Create account'}
            </h2>

            <p>
              {mode === 'login'
                ? 'Sign in to continue to SpineSync Enterprise.'
                : 'Create your SpineSync Enterprise account.'}
            </p>
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

          <label className="auth-field">
            Email

            <div>
              <Mail size={18} />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="name@company.co.za"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            Password

            <div>
              <LockKeyhole size={18} />

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Enter password"
                minLength={6}
                required
              />
            </div>
          </label>

          <button
            className="login-submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}

            {!loading && (
              <ArrowRight size={18} />
            )}
          </button>

          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setError(null)
              setMessage(null)

              setMode(
                mode === 'login'
                  ? 'signup'
                  : 'login'
              )
            }}
          >
            {mode === 'login'
              ? 'Need an account? Create one'
              : 'Already registered? Sign in'}
          </button>
        </form>
      </section>
    </div>
  )
}
