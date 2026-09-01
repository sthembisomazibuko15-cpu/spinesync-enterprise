import {
  Activity,
  ArrowLeft,
  ClipboardCheck,
  Save,
} from 'lucide-react'

import {
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

type JobProfile = {
  id: string
  title: string
}

type RehabilitationCase = {
  id: string
  case_number: string | null
  worker_id: string
  case_status: string
}

export default function NewAssessment() {
  const navigate = useNavigate()

  const [searchParams] =
    useSearchParams()

  const workerFromUrl =
    searchParams.get('worker')

  const rehabilitationCaseFromUrl =
    searchParams.get('rehab')

  const assessmentTypeFromUrl =
    searchParams.get('type')

  const isReassessment =
    assessmentTypeFromUrl ===
    'reassessment'

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [jobProfile, setJobProfile] =
    useState<JobProfile | null>(null)

  const [
    rehabilitationCase,
    setRehabilitationCase,
  ] =
    useState<RehabilitationCase | null>(
      null
    )

  const [
    assessmentDate,
    setAssessmentDate,
  ] = useState(
    new Date()
      .toISOString()
      .split('T')[0]
  )

  const [
    referralReason,
    setReferralReason,
  ] = useState('')

  const [painScore, setPainScore] =
    useState('')

  const [systolicBp, setSystolicBp] =
    useState('')

  const [diastolicBp, setDiastolicBp] =
    useState('')

  const [restingHr, setRestingHr] =
    useState('')

  const [heightCm, setHeightCm] =
    useState('')

  const [weightKg, setWeightKg] =
    useState('')

  const [
    preTestStatus,
    setPreTestStatus,
  ] = useState('cleared')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadAssessmentContext()
  }, [
    workerFromUrl,
    rehabilitationCaseFromUrl,
  ])

  async function loadAssessmentContext() {
    setLoading(true)
    setError(null)

    if (!workerFromUrl) {
      setError(
        'No worker was selected for this assessment.'
      )
      setLoading(false)
      return
    }

    const {
      data: workerData,
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
      .eq('id', workerFromUrl)
      .single()

    if (
      workerError ||
      !workerData
    ) {
      setError(
        workerError?.message ||
          'Worker not found.'
      )
      setLoading(false)
      return
    }

    const loadedWorker =
      workerData as Worker

    setWorker(loadedWorker)

    if (loadedWorker.job_profile_id) {
      const {
        data: jobProfileData,
      } = await supabase
        .from('job_profiles')
        .select(`
          id,
          title
        `)
        .eq(
          'id',
          loadedWorker.job_profile_id
        )
        .single()

      if (jobProfileData) {
        setJobProfile(
          jobProfileData as JobProfile
        )
      }
    }

    if (
      rehabilitationCaseFromUrl
    ) {
      const {
        data: caseData,
        error: caseError,
      } = await supabase
        .from('rehabilitation_cases')
        .select(`
          id,
          case_number,
          worker_id,
          case_status
        `)
        .eq(
          'id',
          rehabilitationCaseFromUrl
        )
        .single()

      if (
        caseError ||
        !caseData
      ) {
        setError(
          caseError?.message ||
            'Linked rehabilitation case not found.'
        )
        setLoading(false)
        return
      }

      const loadedCase =
        caseData as RehabilitationCase

      if (
        loadedCase.worker_id !==
        loadedWorker.id
      ) {
        setError(
          'The rehabilitation case does not belong to the selected worker.'
        )
        setLoading(false)
        return
      }

      setRehabilitationCase(
        loadedCase
      )

      if (
        isReassessment &&
        !referralReason
      ) {
        setReferralReason(
          'Post-rehabilitation functional capacity reassessment.'
        )
      }
    }

    setLoading(false)
  }

  const bmi = useMemo(() => {
    const height =
      Number(heightCm)

    const weight =
      Number(weightKg)

    if (
      !height ||
      !weight ||
      height <= 0 ||
      weight <= 0
    ) {
      return ''
    }

    const heightMetres =
      height / 100

    return (
      weight /
      (heightMetres *
        heightMetres)
    ).toFixed(1)
  }, [heightCm, weightKg])

  function formatLabel(
    value:
      | string
      | null
      | undefined
  ) {
    if (!value) {
      return 'Not recorded'
    }

    return value
      .split('_')
      .join(' ')
      .replace(
        /\b\w/g,
        (letter: string) =>
          letter.toUpperCase()
      )
  }

  function numberOrNull(
    value: string
  ) {
    if (value === '') {
      return null
    }

    const numericValue =
      Number(value)

    if (
      Number.isNaN(
        numericValue
      )
    ) {
      return null
    }

    return numericValue
  }

  async function createAssessment() {
    if (!worker) {
      setError(
        'Worker information is missing.'
      )
      return
    }

    if (!assessmentDate) {
      setError(
        'Please select an assessment date.'
      )
      return
    }

    const numericPain =
      numberOrNull(painScore)

    if (
      numericPain !== null &&
      (
        numericPain < 0 ||
        numericPain > 10
      )
    ) {
      setError(
        'Pain score must be between 0 and 10.'
      )
      return
    }

    setSaving(true)
    setError(null)

    const {
      data: authData,
      error: authError,
    } =
      await supabase.auth.getUser()

    if (
      authError ||
      !authData.user
    ) {
      setError(
        authError?.message ||
          'Unable to identify the logged-in user.'
      )
      setSaving(false)
      return
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select(
        'organisation_id'
      )
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
          'Your organisation could not be identified.'
      )
      setSaving(false)
      return
    }

    if (
      isReassessment &&
      !rehabilitationCase
    ) {
      setError(
        'A reassessment must be linked to a rehabilitation case.'
      )
      setSaving(false)
      return
    }

    const {
      data: assessmentData,
      error: assessmentError,
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
          'fce',

        assessment_phase:
          isReassessment
            ? 'reassessment'
            : 'initial',

        rehabilitation_case_id:
          rehabilitationCase?.id ||
          null,

        assessment_date:
          assessmentDate,

        referral_reason:
          referralReason.trim() ||
          null,

        pain_score:
          numericPain,

        systolic_bp:
          numberOrNull(
            systolicBp
          ),

        diastolic_bp:
          numberOrNull(
            diastolicBp
          ),

        resting_hr:
          numberOrNull(
            restingHr
          ),

        height_cm:
          numberOrNull(
            heightCm
          ),

        weight_kg:
          numberOrNull(
            weightKg
          ),

        bmi:
          bmi
            ? Number(bmi)
            : null,

        pre_test_status:
          preTestStatus,

        assessment_status:
          'in_progress',
      })
      .select('id')
      .single()

    if (
      assessmentError ||
      !assessmentData
    ) {
      setError(
        assessmentError?.message ||
          'Unable to create assessment.'
      )
      setSaving(false)
      return
    }

    setSaving(false)

    navigate(
      `/assessments/${assessmentData.id}`
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading assessment...
        </p>
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="stack">

        <button
          className="secondary-button"
          onClick={() =>
            navigate('/workers')
          }
        >
          <ArrowLeft size={16} />
          Back to Workers
        </button>

        <div className="error-message">
          {error ||
            'Worker could not be loaded.'}
        </div>

      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>

          <button
            className="secondary-button"
            onClick={() => {
              if (
                rehabilitationCase
              ) {
                navigate(
                  `/rehabilitation/${rehabilitationCase.id}`
                )
                return
              }

              navigate(
                `/workers/${worker.id}`
              )
            }}
            style={{
              marginBottom: 14,
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <span className="eyebrow">
            {isReassessment
              ? 'POST-REHABILITATION FCE'
              : 'FUNCTIONAL CAPACITY EVALUATION'}
          </span>

          <h1>
            {isReassessment
              ? 'New Reassessment FCE'
              : 'New Assessment'}
          </h1>

          <p>
            {isReassessment
              ? 'Create a post-rehabilitation functional capacity reassessment linked to the worker’s rehabilitation case.'
              : 'Complete the pre-test screening before beginning the Functional Capacity Evaluation.'}
          </p>

        </div>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isReassessment &&
        rehabilitationCase && (
          <div className="panel">

            <div className="assessment-section-title">

              <div className="assessment-section-icon">
                <ClipboardCheck
                  size={20}
                />
              </div>

              <div>
                <h2>
                  Rehabilitation
                  Reassessment
                </h2>

                <p>
                  This FCE will be
                  permanently linked to
                  the rehabilitation
                  case below.
                </p>
              </div>

            </div>

            <div className="form-grid">

              <label>
                <span>
                  Rehabilitation Case
                </span>

                <input
                  value={
                    rehabilitationCase.case_number ||
                    `REH-${rehabilitationCase.id
                      .slice(0, 8)
                      .toUpperCase()}`
                  }
                  disabled
                />
              </label>

              <label>
                <span>
                  Case Status
                </span>

                <input
                  value={formatLabel(
                    rehabilitationCase.case_status
                  )}
                  disabled
                />
              </label>

              <label>
                <span>
                  Assessment Phase
                </span>

                <input
                  value="Reassessment"
                  disabled
                />
              </label>

            </div>

          </div>
        )}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Worker Information
            </h2>

            <p>
              Confirm the worker and
              occupational placement.
            </p>
          </div>

        </div>

        <div className="form-grid">

          <label>
            <span>Worker</span>

            <input
              value={`${worker.first_name} ${worker.last_name}`}
              disabled
            />
          </label>

          <label>
            <span>
              Employee Number
            </span>

            <input
              value={
                worker.employee_number
              }
              disabled
            />
          </label>

          <label>
            <span>
              Job Profile
            </span>

            <input
              value={
                jobProfile?.title ||
                'Not assigned'
              }
              disabled
            />
          </label>

        </div>

      </div>

      <div className="panel">

        <h2>
          Assessment Details
        </h2>

        <div className="form-grid">

          <label>
            <span>
              Assessment Type
            </span>

            <input
              value={
                isReassessment
                  ? 'FCE Reassessment'
                  : 'Functional Capacity Evaluation'
              }
              disabled
            />
          </label>

          <label>
            <span>
              Assessment Date
            </span>

            <input
              type="date"
              value={assessmentDate}
              onChange={(event) =>
                setAssessmentDate(
                  event.target.value
                )
              }
            />
          </label>

          <label>
            <span>
              Assessment Phase
            </span>

            <input
              value={
                isReassessment
                  ? 'Reassessment'
                  : 'Initial'
              }
              disabled
            />
          </label>

        </div>

        <label>
          <span>
            Referral Reason
          </span>

          <textarea
            rows={4}
            value={referralReason}
            onChange={(event) =>
              setReferralReason(
                event.target.value
              )
            }
            placeholder="Reason for assessment"
          />
        </label>

      </div>

      <div className="panel">

        <h2>
          Pre-Test Clinical Screening
        </h2>

        <p>
          Record baseline clinical
          observations before functional
          testing.
        </p>

        <div className="form-grid">

          <label>
            <span>
              Pain Score /10
            </span>

            <input
              type="number"
              min="0"
              max="10"
              value={painScore}
              onChange={(event) =>
                setPainScore(
                  event.target.value
                )
              }
            />
          </label>

          <label>
            <span>
              Systolic BP
            </span>

            <input
              type="number"
              value={systolicBp}
              onChange={(event) =>
                setSystolicBp(
                  event.target.value
                )
              }
              placeholder="mmHg"
            />
          </label>

          <label>
            <span>
              Diastolic BP
            </span>

            <input
              type="number"
              value={diastolicBp}
              onChange={(event) =>
                setDiastolicBp(
                  event.target.value
                )
              }
              placeholder="mmHg"
            />
          </label>

          <label>
            <span>
              Resting Heart Rate
            </span>

            <input
              type="number"
              value={restingHr}
              onChange={(event) =>
                setRestingHr(
                  event.target.value
                )
              }
              placeholder="bpm"
            />
          </label>

          <label>
            <span>
              Height
            </span>

            <input
              type="number"
              value={heightCm}
              onChange={(event) =>
                setHeightCm(
                  event.target.value
                )
              }
              placeholder="cm"
            />
          </label>

          <label>
            <span>
              Weight
            </span>

            <input
              type="number"
              value={weightKg}
              onChange={(event) =>
                setWeightKg(
                  event.target.value
                )
              }
              placeholder="kg"
            />
          </label>

          <label>
            <span>BMI</span>

            <input
              value={bmi}
              disabled
              placeholder="Calculated automatically"
            />
          </label>

          <label>
            <span>
              Pre-Test Status
            </span>

            <select
              value={preTestStatus}
              onChange={(event) =>
                setPreTestStatus(
                  event.target.value
                )
              }
            >
              <option value="cleared">
                Cleared
              </option>

              <option value="cleared_with_caution">
                Cleared with Caution
              </option>

              <option value="deferred">
                Deferred
              </option>

              <option value="not_cleared">
                Not Cleared
              </option>
            </select>
          </label>

        </div>

      </div>

      <div className="panel">

        <h2>
          Begin Functional Testing
        </h2>

        <p>
          Functional test findings should
          be interpreted together with the
          worker's clinical presentation,
          occupational demands and
          assessor observations. The
          platform supports clinical
          decision-making and does not
          independently certify fitness
          for work.
        </p>

        <button
          className="primary-button"
          onClick={createAssessment}
          disabled={saving}
          style={{
            marginTop: 20,
          }}
        >
          <Save size={17} />

          {saving
            ? 'Creating Assessment...'
            : isReassessment
              ? 'Create Reassessment & Start FCE'
              : 'Create Assessment & Start FCE'}
        </button>

      </div>

    </div>
  )
}
