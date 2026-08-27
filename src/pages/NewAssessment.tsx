import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Ruler,
  Save,
  User,
} from 'lucide-react'

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

type Worker = {
  id: string
  organisation_id: string
  employee_number: string
  first_name: string
  last_name: string
}

export default function NewAssessment() {
  const { user } = useAuth()

  const navigate = useNavigate()

  const [searchParams] =
    useSearchParams()

  const workerId =
    searchParams.get('worker')

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [form, setForm] =
    useState({
      assessment_type: 'fce',
      assessment_date:
        new Date()
          .toISOString()
          .split('T')[0],

      referral_reason: '',

      pain_score: '0',

      systolic_bp: '',
      diastolic_bp: '',
      resting_hr: '',

      height_cm: '',
      weight_kg: '',

      pre_test_status:
        'cleared',
    })

  useEffect(() => {
    loadWorker()
  }, [workerId])

  async function loadWorker() {
    if (!workerId) {
      setError(
        'No worker was selected.'
      )

      setLoading(false)
      return
    }

    const {
      data,
      error: workerError,
    } = await supabase
      .from('workers')
      .select(`
        id,
        organisation_id,
        employee_number,
        first_name,
        last_name
      `)
      .eq('id', workerId)
      .single()

    if (workerError) {
      setError(
        workerError.message
      )

      setLoading(false)
      return
    }

    setWorker(
      data as Worker
    )

    setLoading(false)
  }

  const height =
    Number(form.height_cm)

  const weight =
    Number(form.weight_kg)

  const bmi =
    height > 0 &&
    weight > 0
      ? weight /
        Math.pow(
          height / 100,
          2
        )
      : null

  async function saveAssessment(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!worker || !user)
      return

    setSaving(true)
    setError(null)

    const {
      data,
      error: saveError,
    } = await supabase
      .from('assessments')
      .insert({
        organisation_id:
          worker.organisation_id,

        worker_id:
          worker.id,

        assessor_id:
          user.id,

        assessment_type:
          form.assessment_type,

        assessment_date:
          form.assessment_date,

        referral_reason:
          form.referral_reason.trim() ||
          null,

        pain_score:
          form.pain_score
            ? Number(
                form.pain_score
              )
            : null,

        systolic_bp:
          form.systolic_bp
            ? Number(
                form.systolic_bp
              )
            : null,

        diastolic_bp:
          form.diastolic_bp
            ? Number(
                form.diastolic_bp
              )
            : null,

        resting_hr:
          form.resting_hr
            ? Number(
                form.resting_hr
              )
            : null,

        height_cm:
          form.height_cm
            ? Number(
                form.height_cm
              )
            : null,

        weight_kg:
          form.weight_kg
            ? Number(
                form.weight_kg
              )
            : null,

        bmi:
          bmi
            ? Number(
                bmi.toFixed(2)
              )
            : null,

        pre_test_status:
          form.pre_test_status,

        assessment_status:
          'in_progress',
      })
      .select('id')
      .single()

    if (saveError) {
      setError(
        saveError.message
      )

      setSaving(false)
      return
    }

    navigate(
      `/assessments/${data.id}`
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Preparing FCE...
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
          <button
            className="back-link button-reset"
            onClick={() =>
              navigate(
                `/workers/${worker.id}`
              )
            }
          >
            <ArrowLeft size={16} />
            Worker profile
          </button>

          <span className="eyebrow">
            FUNCTIONAL CAPACITY
            EVALUATION
          </span>

          <h2>
            New FCE
          </h2>

          <p>
            {worker.first_name}{' '}
            {worker.last_name}
            {' • '}
            {worker.employee_number}
          </p>
        </div>

        <div className="assessment-status">
          <Activity size={17} />

          Assessment setup
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="assessment-progress">
        <div className="progress-step active">
          <span>1</span>
          Setup
        </div>

        <div className="progress-line" />

        <div className="progress-step">
          <span>2</span>
          Screening
        </div>

        <div className="progress-line" />

        <div className="progress-step">
          <span>3</span>
          Testing
        </div>

        <div className="progress-line" />

        <div className="progress-step">
          <span>4</span>
          Outcome
        </div>
      </div>

      <form
        className="stack"
        onSubmit={saveAssessment}
      >

        <section className="panel assessment-section">
          <div className="assessment-section-title">
            <div className="profile-card-icon">
              <User size={20} />
            </div>

            <div>
              <h3>
                Assessment Setup
              </h3>

              <p>
                Confirm assessment
                details and referral.
              </p>
            </div>
          </div>

          <div className="form-grid">

            <label>
              Assessment type

              <select
                value={
                  form.assessment_type
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    assessment_type:
                      event.target.value,
                  })
                }
              >
                <option value="fce">
                  Functional Capacity
                  Evaluation
                </option>

                <option value="return_to_work">
                  Return-to-work
                  assessment
                </option>

                <option value="baseline">
                  Baseline assessment
                </option>

                <option value="reassessment">
                  Reassessment
                </option>
              </select>
            </label>

            <label>
              Assessment date

              <input
                type="date"
                value={
                  form.assessment_date
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    assessment_date:
                      event.target.value,
                  })
                }
                required
              />
            </label>

            <label className="form-full">
              Referral reason

              <textarea
                value={
                  form.referral_reason
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    referral_reason:
                      event.target.value,
                  })
                }
                placeholder="Example: Return-to-work evaluation following lumbar injury"
                rows={4}
              />
            </label>

          </div>
        </section>

        <section className="panel assessment-section">
          <div className="assessment-section-title">
            <div className="profile-card-icon">
              <HeartPulse size={20} />
            </div>

            <div>
              <h3>
                Pre-Test Screening
              </h3>

              <p>
                Record baseline
                observations before
                physical testing.
              </p>
            </div>
          </div>

          <div className="form-grid">

            <label>
              Pain score /10

              <input
                type="number"
                min="0"
                max="10"
                value={
                  form.pain_score
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    pain_score:
                      event.target.value,
                  })
                }
              />
            </label>

            <label>
              Systolic BP

              <input
                type="number"
                value={
                  form.systolic_bp
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    systolic_bp:
                      event.target.value,
                  })
                }
                placeholder="mmHg"
              />
            </label>

            <label>
              Diastolic BP

              <input
                type="number"
                value={
                  form.diastolic_bp
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    diastolic_bp:
                      event.target.value,
                  })
                }
                placeholder="mmHg"
              />
            </label>

            <label>
              Resting heart rate

              <input
                type="number"
                value={
                  form.resting_hr
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    resting_hr:
                      event.target.value,
                  })
                }
                placeholder="bpm"
              />
            </label>

            <label>
              Screening status

              <select
                value={
                  form.pre_test_status
                }
                onChange={(event) =>
                  setForm({
                    ...form,
                    pre_test_status:
                      event.target.value,
                  })
                }
              >
                <option value="cleared">
                  Cleared for testing
                </option>

                <option value="modified">
                  Proceed with
                  modifications
                </option>

                <option value="deferred">
                  Testing deferred
                </option>
              </select>
            </label>

          </div>
        </section>

        <section className="panel assessment-section">
          <div className="assessment-section-title">
            <div className="profile-card-icon">
              <Ruler size={20} />
            </div>

            <div>
              <h3>
                Anthropometrics
              </h3>

              <p>
                Record basic physical
                measurements.
              </p>
            </div>
          </div>

          <div className="form-grid">

            <label>
              Height

              <div className="input-unit">
                <input
                  type="number"
                  step="0.1"
                  value={
                    form.height_cm
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      height_cm:
                        event.target.value,
                    })
                  }
                />

                <span>cm</span>
              </div>
            </label>

            <label>
              Weight

              <div className="input-unit">
                <input
                  type="number"
                  step="0.1"
                  value={
                    form.weight_kg
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      weight_kg:
                        event.target.value,
                    })
                  }
                />

                <span>kg</span>
              </div>
            </label>

            <div className="bmi-card">
              <span>
                Calculated BMI
              </span>

              <strong>
                {bmi
                  ? bmi.toFixed(1)
                  : '—'}
              </strong>
            </div>

          </div>
        </section>

        <div className="assessment-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate(
                `/workers/${worker.id}`
              )
            }
          >
            <ArrowLeft size={16} />
            Cancel
          </button>

          <button
            className="primary-button"
            disabled={
              saving ||
              form.pre_test_status ===
                'deferred'
            }
          >
            {saving ? (
              <>
                <Save size={16} />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2
                  size={16}
                />

                Save & Start Testing

                <ArrowRight
                  size={16}
                />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  )
}
