import {
  Activity,
  ArrowLeft,
  ClipboardPlus,
  HeartPulse,
  Save,
  User,
} from 'lucide-react'

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { supabase } from '../lib/supabase'

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  job_profile_id: string | null
}

export default function NewAssessment() {
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

  const [form, setForm] = useState({
    assessment_type: 'fce',
    assessment_date:
      new Date()
        .toISOString()
        .split('T')[0],

    referral_reason: '',
    pain_score: '',
    systolic_bp: '',
    diastolic_bp: '',
    resting_hr: '',
    height_cm: '',
    weight_kg: '',
    pre_test_status: 'cleared',
  })

  useEffect(() => {
    loadWorker()
  }, [workerId])

  async function loadWorker() {
    if (!workerId) {
      setError(
        'No worker was selected for this assessment.'
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
        employee_number,
        first_name,
        last_name,
        job_profile_id
      `)
      .eq('id', workerId)
      .single()

    if (workerError) {
      setError(workerError.message)
      setLoading(false)
      return
    }

    setWorker(data as Worker)
    setLoading(false)
  }

  const bmi = useMemo(() => {
    const height =
      Number(form.height_cm)

    const weight =
      Number(form.weight_kg)

    if (
      !height ||
      !weight ||
      height <= 0 ||
      weight <= 0
    ) {
      return null
    }

    const metres =
      height / 100

    return Number(
      (
        weight /
        (metres * metres)
      ).toFixed(1)
    )
  }, [
    form.height_cm,
    form.weight_kg,
  ])

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function numberOrNull(
    value: string
  ) {
    if (value.trim() === '') {
      return null
    }

    const number =
      Number(value)

    return Number.isNaN(number)
      ? null
      : number
  }

  async function createAssessment(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!worker) {
      return
    }

    setSaving(true)
    setError(null)

    /*
      Identify the professional
      creating the assessment.
    */

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
          'Unable to identify the logged-in assessor.'
      )
      setSaving(false)
      return
    }

    /*
      Load organisation from the
      logged-in assessor's profile.
    */

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(`
        organisation_id
      `)
      .eq(
        'id',
        authData.user.id
      )
      .single()

    if (
      profileError ||
      !profileData?.organisation_id
    ) {
      setError(
        profileError?.message ||
          'Your profile is not linked to an organisation.'
      )
      setSaving(false)
      return
    }

    /*
      Create assessment.

      assessor_id is permanently
      stored here.
    */

    const {
      data,
      error: insertError,
    } = await supabase
      .from('assessments')
      .insert({
        organisation_id:
          profileData.organisation_id,

        worker_id:
          worker.id,

        assessor_id:
          authData.user.id,

        assessment_type:
          form.assessment_type,

        assessment_date:
          form.assessment_date,

        referral_reason:
          form.referral_reason.trim() ||
          null,

        pain_score:
          numberOrNull(
            form.pain_score
          ),

        systolic_bp:
          numberOrNull(
            form.systolic_bp
          ),

        diastolic_bp:
          numberOrNull(
            form.diastolic_bp
          ),

        resting_hr:
          numberOrNull(
            form.resting_hr
          ),

        height_cm:
          numberOrNull(
            form.height_cm
          ),

        weight_kg:
          numberOrNull(
            form.weight_kg
          ),

        bmi,

        pre_test_status:
          form.pre_test_status,

        assessment_status:
          'in_progress',
      })
      .select('id')
      .single()

    if (insertError) {
      setError(
        insertError.message
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
          Preparing assessment...
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

  return (
    <div className="stack">

      <div className="page-heading">

        <div>

          <span className="eyebrow">
            FUNCTIONAL CAPACITY
            EVALUATION
          </span>

          <h1>
            New Assessment
          </h1>

          <p>
            Complete the pre-test
            information before beginning
            functional testing.
          </p>

        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate(
              `/workers/${worker?.id}`
            )
          }
        >
          <ArrowLeft size={16} />
          Worker Profile
        </button>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* WORKER SUMMARY */}

      <div className="worker-summary-card">

        <div className="worker-avatar-large">
          <User size={24} />
        </div>

        <div>
          <span>
            WORKER
          </span>

          <h3>
            {worker?.first_name}{' '}
            {worker?.last_name}
          </h3>

          <p>
            Employee number:{' '}
            {worker?.employee_number}
          </p>
        </div>

      </div>

      <form
        className="stack"
        onSubmit={createAssessment}
      >

        {/* ASSESSMENT DETAILS */}

        <div className="panel">

          <div className="assessment-section-title">

            <div className="assessment-section-icon">
              <ClipboardPlus size={20} />
            </div>

            <div>
              <h3>
                Assessment Details
              </h3>

              <p>
                Record the assessment type,
                date and referral reason.
              </p>
            </div>

          </div>

          <div className="form-grid">

            <label>
              <span>
                Assessment Type
              </span>

              <select
                value={
                  form.assessment_type
                }
                onChange={(event) =>
                  updateField(
                    'assessment_type',
                    event.target.value
                  )
                }
              >
                <option value="fce">
                  Functional Capacity Evaluation
                </option>

                <option value="return_to_work">
                  Return-to-Work Assessment
                </option>

                <option value="baseline">
                  Baseline Assessment
                </option>

                <option value="reassessment">
                  Reassessment
                </option>
              </select>
            </label>

            <label>
              <span>
                Assessment Date
              </span>

              <input
                type="date"
                value={
                  form.assessment_date
                }
                onChange={(event) =>
                  updateField(
                    'assessment_date',
                    event.target.value
                  )
                }
                required
              />
            </label>

          </div>

          <label>
            <span>
              Referral Reason
            </span>

            <textarea
              value={
                form.referral_reason
              }
              onChange={(event) =>
                updateField(
                  'referral_reason',
                  event.target.value
                )
              }
              placeholder="Reason for referral, injury history, return-to-work requirement or other relevant information"
              rows={4}
            />
          </label>

        </div>

        {/* CLINICAL SCREENING */}

        <div className="panel">

          <div className="assessment-section-title">

            <div className="assessment-section-icon">
              <HeartPulse size={20} />
            </div>

            <div>
              <h3>
                Pre-Test Clinical Screening
              </h3>

              <p>
                Record baseline clinical
                observations before
                functional testing.
              </p>
            </div>

          </div>

          <div className="form-grid">

            <label>
              <span>
                Pain Score /10
              </span>

              <input
                type="number"
                min="0"
                max="10"
                value={
                  form.pain_score
                }
                onChange={(event) =>
                  updateField(
                    'pain_score',
                    event.target.value
                  )
                }
                placeholder="0"
              />
            </label>

            <label>
              <span>
                Systolic BP
              </span>

              <input
                type="number"
                value={
                  form.systolic_bp
                }
                onChange={(event) =>
                  updateField(
                    'systolic_bp',
                    event.target.value
                  )
                }
                placeholder="120"
              />
            </label>

            <label>
              <span>
                Diastolic BP
              </span>

              <input
                type="number"
                value={
                  form.diastolic_bp
                }
                onChange={(event) =>
                  updateField(
                    'diastolic_bp',
                    event.target.value
                  )
                }
                placeholder="80"
              />
            </label>

            <label>
              <span>
                Resting Heart Rate
              </span>

              <input
                type="number"
                value={
                  form.resting_hr
                }
                onChange={(event) =>
                  updateField(
                    'resting_hr',
                    event.target.value
                  )
                }
                placeholder="70"
              />
            </label>

            <label>
              <span>
                Height (cm)
              </span>

              <input
                type="number"
                step="0.1"
                value={
                  form.height_cm
                }
                onChange={(event) =>
                  updateField(
                    'height_cm',
                    event.target.value
                  )
                }
                placeholder="175"
              />
            </label>

            <label>
              <span>
                Weight (kg)
              </span>

              <input
                type="number"
                step="0.1"
                value={
                  form.weight_kg
                }
                onChange={(event) =>
                  updateField(
                    'weight_kg',
                    event.target.value
                  )
                }
                placeholder="75"
              />
            </label>

          </div>

          <div className="form-grid">

            <label>
              <span>
                Calculated BMI
              </span>

              <input
                type="text"
                value={
                  bmi !== null
                    ? bmi
                    : ''
                }
                placeholder="Calculated automatically"
                disabled
              />
            </label>

            <label>
              <span>
                Pre-Test Status
              </span>

              <select
                value={
                  form.pre_test_status
                }
                onChange={(event) =>
                  updateField(
                    'pre_test_status',
                    event.target.value
                  )
                }
              >
                <option value="cleared">
                  Cleared for Testing
                </option>

                <option value="cleared_with_caution">
                  Cleared with Caution
                </option>

                <option value="deferred">
                  Testing Deferred
                </option>

                <option value="medical_review_required">
                  Medical Review Required
                </option>
              </select>
            </label>

          </div>

        </div>

        {/* START */}

        <div className="panel">

          <div className="assessment-section-title">

            <div className="assessment-section-icon">
              <Activity size={20} />
            </div>

            <div>
              <h3>
                Functional Testing
              </h3>

              <p>
                Saving this assessment will
                permanently record the
                logged-in professional as
                the assessor.
              </p>
            </div>

          </div>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            <Save size={16} />

            {saving
              ? 'Creating Assessment...'
              : 'Save & Start FCE'}
          </button>

        </div>

      </form>

    </div>
  )
}
