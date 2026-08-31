import {
  ArrowLeft,
  Activity,
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

export default function NewRehabCase() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const workerFromUrl =
    searchParams.get('worker')

  const assessmentFromUrl =
    searchParams.get('assessment')

  const [workers, setWorkers] =
    useState<Worker[]>([])

  const [jobProfiles, setJobProfiles] =
    useState<JobProfile[]>([])

  const [workerId, setWorkerId] =
    useState(workerFromUrl || '')

  const [referralDate, setReferralDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    )

  const [
    referralReason,
    setReferralReason,
  ] = useState('')

  const [
    primaryCondition,
    setPrimaryCondition,
  ] = useState('')

  const [
    affectedBodyRegion,
    setAffectedBodyRegion,
  ] = useState('')

  const [
    initialWorkStatus,
    setInitialWorkStatus,
  ] = useState('restricted_duty')

  const [
    restrictions,
    setRestrictions,
  ] = useState('')

  const [
    rehabilitationGoals,
    setRehabilitationGoals,
  ] = useState('')

  const [
    plannedSessions,
    setPlannedSessions,
  ] = useState('8')

  const [
    expectedReassessmentDate,
    setExpectedReassessmentDate,
  ] = useState('')

  const [saving, setSaving] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadPageData()
  }, [])

  async function loadPageData() {
    setLoading(true)
    setError(null)

    const [
      workerResponse,
      jobResponse,
    ] = await Promise.all([
      supabase
        .from('workers')
        .select(`
          id,
          employee_number,
          first_name,
          last_name,
          job_profile_id
        `)
        .order('first_name'),

      supabase
        .from('job_profiles')
        .select(`
          id,
          title
        `)
        .order('title'),
    ])

    if (workerResponse.error) {
      setError(
        workerResponse.error.message
      )
      setLoading(false)
      return
    }

    if (jobResponse.error) {
      setError(
        jobResponse.error.message
      )
      setLoading(false)
      return
    }

    setWorkers(
      (workerResponse.data ??
        []) as Worker[]
    )

    setJobProfiles(
      (jobResponse.data ??
        []) as JobProfile[]
    )

    setLoading(false)
  }

  const selectedWorker =
    useMemo(
      () =>
        workers.find(
          (worker) =>
            worker.id === workerId
        ) || null,
      [workers, workerId]
    )

  const selectedJob =
    useMemo(() => {
      if (
        !selectedWorker?.job_profile_id
      ) {
        return null
      }

      return (
        jobProfiles.find(
          (job) =>
            job.id ===
            selectedWorker.job_profile_id
        ) || null
      )
    }, [
      selectedWorker,
      jobProfiles,
    ])

  async function createCase() {
    if (!workerId) {
      setError(
        'Please select a worker.'
      )
      return
    }

    if (!referralDate) {
      setError(
        'Please enter the referral date.'
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
          'Unable to identify the signed-in user.'
      )
      setSaving(false)
      return
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('organisation_id')
      .eq('id', authData.user.id)
      .single()

    if (
      profileError ||
      !profile?.organisation_id
    ) {
      setError(
        profileError?.message ||
          'Your organisation could not be identified.'
      )
      setSaving(false)
      return
    }

    const {
      data: createdCase,
      error: insertError,
    } = await supabase
      .from('rehabilitation_cases')
      .insert({
        organisation_id:
          profile.organisation_id,

        worker_id: workerId,

        assessment_id:
          assessmentFromUrl || null,

        created_by:
          authData.user.id,

        referral_date:
          referralDate,

        referral_reason:
          referralReason.trim() ||
          null,

        primary_condition:
          primaryCondition.trim() ||
          null,

        affected_body_region:
          affectedBodyRegion.trim() ||
          null,

        initial_work_status:
          initialWorkStatus || null,

        current_work_status:
          initialWorkStatus || null,

        restrictions:
          restrictions.trim() ||
          null,

        rehabilitation_goals:
          rehabilitationGoals.trim() ||
          null,

        planned_sessions:
          plannedSessions
            ? Number(
                plannedSessions
              )
            : null,

        expected_reassessment_date:
          expectedReassessmentDate ||
          null,

        case_status: 'active',
      })
      .select('id')
      .single()

    if (
      insertError ||
      !createdCase
    ) {
      setError(
        insertError?.message ||
          'Unable to create the rehabilitation case.'
      )
      setSaving(false)
      return
    }

    const caseNumber =
      `REH-${createdCase.id
        .slice(0, 8)
        .toUpperCase()}`

    await supabase
      .from('rehabilitation_cases')
      .update({
        case_number:
          caseNumber,
      })
      .eq(
        'id',
        createdCase.id
      )

    navigate(
      `/rehabilitation/${createdCase.id}`
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading rehabilitation form...
        </p>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">

        <div>
          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                '/rehabilitation'
              )
            }
            style={{
              marginBottom: 14,
            }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <span className="eyebrow">
            RETURN-TO-WORK
          </span>

          <h1>
            New Rehabilitation Case
          </h1>

          <p>
            Open a structured
            rehabilitation and
            return-to-work case for a
            worker.
          </p>
        </div>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Worker
            </h2>

            <p>
              Select the worker entering
              rehabilitation.
            </p>
          </div>

        </div>

        <div className="form-grid">

          <label>
            <span>
              Worker *
            </span>

            <select
              value={workerId}
              onChange={(event) =>
                setWorkerId(
                  event.target.value
                )
              }
            >
              <option value="">
                Select worker
              </option>

              {workers.map(
                (worker) => (
                  <option
                    key={worker.id}
                    value={worker.id}
                  >
                    {
                      worker.employee_number
                    }{' '}
                    —{' '}
                    {
                      worker.first_name
                    }{' '}
                    {
                      worker.last_name
                    }
                  </option>
                )
              )}

            </select>
          </label>

          <label>
            <span>
              Job Profile
            </span>

            <input
              value={
                selectedJob?.title ||
                'Not assigned'
              }
              disabled
            />
          </label>

        </div>

      </div>

      <div className="panel">

        <h2>
          Referral Details
        </h2>

        <div className="form-grid">

          <label>
            <span>
              Referral Date *
            </span>

            <input
              type="date"
              value={referralDate}
              onChange={(event) =>
                setReferralDate(
                  event.target.value
                )
              }
            />
          </label>

          <label>
            <span>
              Affected Body Region
            </span>

            <select
              value={
                affectedBodyRegion
              }
              onChange={(event) =>
                setAffectedBodyRegion(
                  event.target.value
                )
              }
            >
              <option value="">
                Select region
              </option>

              <option value="low_back">
                Low Back
              </option>

              <option value="neck">
                Neck
              </option>

              <option value="shoulder">
                Shoulder
              </option>

              <option value="elbow">
                Elbow
              </option>

              <option value="wrist_hand">
                Wrist / Hand
              </option>

              <option value="hip">
                Hip
              </option>

              <option value="knee">
                Knee
              </option>

              <option value="ankle_foot">
                Ankle / Foot
              </option>

              <option value="multiple">
                Multiple Regions
              </option>

              <option value="other">
                Other
              </option>
            </select>
          </label>

          <label>
            <span>
              Primary Condition
            </span>

            <input
              value={
                primaryCondition
              }
              onChange={(event) =>
                setPrimaryCondition(
                  event.target.value
                )
              }
              placeholder="e.g. Mechanical low back pain"
            />
          </label>

          <label>
            <span>
              Initial Work Status
            </span>

            <select
              value={
                initialWorkStatus
              }
              onChange={(event) =>
                setInitialWorkStatus(
                  event.target.value
                )
              }
            >
              <option value="full_duty">
                Full Duty
              </option>

              <option value="modified_duty">
                Modified Duty
              </option>

              <option value="restricted_duty">
                Restricted Duty
              </option>

              <option value="off_work">
                Off Work
              </option>

              <option value="temporarily_unfit">
                Temporarily Unfit
              </option>
            </select>
          </label>

        </div>

        <label>
          <span>
            Referral Reason
          </span>

          <textarea
            rows={4}
            value={
              referralReason
            }
            onChange={(event) =>
              setReferralReason(
                event.target.value
              )
            }
            placeholder="Why is this worker being referred for rehabilitation?"
          />
        </label>

      </div>

      <div className="panel">

        <h2>
          Rehabilitation Plan
        </h2>

        <label>
          <span>
            Current Restrictions
          </span>

          <textarea
            rows={4}
            value={
              restrictions
            }
            onChange={(event) =>
              setRestrictions(
                event.target.value
              )
            }
            placeholder="e.g. No lifting above 15 kg, avoid prolonged kneeling"
          />
        </label>

        <label>
          <span>
            Rehabilitation Goals
          </span>

          <textarea
            rows={5}
            value={
              rehabilitationGoals
            }
            onChange={(event) =>
              setRehabilitationGoals(
                event.target.value
              )
            }
            placeholder="Describe the main rehabilitation and return-to-work goals"
          />
        </label>

        <div className="form-grid">

          <label>
            <span>
              Planned Sessions
            </span>

            <input
              type="number"
              min="1"
              value={
                plannedSessions
              }
              onChange={(event) =>
                setPlannedSessions(
                  event.target.value
                )
              }
            />
          </label>

          <label>
            <span>
              Expected Reassessment
            </span>

            <input
              type="date"
              value={
                expectedReassessmentDate
              }
              onChange={(event) =>
                setExpectedReassessmentDate(
                  event.target.value
                )
              }
            />
          </label>

        </div>

      </div>

      <div className="panel">

        <h2>
          Clinical Responsibility
        </h2>

        <p>
          Rehabilitation plans,
          restrictions, progression and
          return-to-work recommendations
          must be based on the worker's
          clinical presentation,
          functional findings and
          occupational demands.
        </p>

        <div
          style={{
            marginTop: 20,
          }}
        >
          <button
            className="primary-button"
            onClick={createCase}
            disabled={
              saving || !workerId
            }
          >
            <Save size={16} />

            {saving
              ? 'Creating Case...'
              : 'Create Rehabilitation Case'}
          </button>
        </div>

      </div>

    </div>
  )
}
