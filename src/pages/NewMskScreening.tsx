import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  HeartPulse,
  Save,
  ShieldCheck,
  UserRound,
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
  operation_id: string | null
  site_id: string | null
  department_id: string | null
}

type JobProfile = {
  id: string
  job_code: string | null
  description: string | null
  physical_demand_level: string | null
}

type Operation = {
  id: string
  name: string
}

type Site = {
  id: string
  name: string
}

type Department = {
  id: string
  name: string
}

export default function NewMskScreening() {
  const navigate = useNavigate()

  const [searchParams] =
    useSearchParams()

  const workerFromUrl =
    searchParams.get('worker')

  const [workers, setWorkers] =
    useState<Worker[]>([])

  const [jobProfiles, setJobProfiles] =
    useState<JobProfile[]>([])

  const [operations, setOperations] =
    useState<Operation[]>([])

  const [sites, setSites] =
    useState<Site[]>([])

  const [departments, setDepartments] =
    useState<Department[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [workerId, setWorkerId] =
    useState(
      workerFromUrl || ''
    )

  const [screeningDate, setScreeningDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    )

  const [screeningType, setScreeningType] =
    useState('baseline')

  const [
    currentMskComplaint,
    setCurrentMskComplaint,
  ] = useState(false)

  const [
    previousMskInjury,
    setPreviousMskInjury,
  ] = useState(false)

  const [
    previousMskInjuryDetails,
    setPreviousMskInjuryDetails,
  ] = useState('')

  const [
    currentlyReceivingTreatment,
    setCurrentlyReceivingTreatment,
  ] = useState(false)

  const [
    treatmentDetails,
    setTreatmentDetails,
  ] = useState('')

  const [
    manualHandlingExposure,
    setManualHandlingExposure,
  ] = useState(false)

  const [
    repetitiveWorkExposure,
    setRepetitiveWorkExposure,
  ] = useState(false)

  const [
    awkwardPostureExposure,
    setAwkwardPostureExposure,
  ] = useState(false)

  const [
    prolongedPostureExposure,
    setProlongedPostureExposure,
  ] = useState(false)

  const [
    vibrationExposure,
    setVibrationExposure,
  ] = useState(false)

  const [
    overheadWorkExposure,
    setOverheadWorkExposure,
  ] = useState(false)

  const [
    kneelingSquattingExposure,
    setKneelingSquattingExposure,
  ] = useState(false)

  const [
    confinedSpaceExposure,
    setConfinedSpaceExposure,
  ] = useState(false)

  const [
    unevenGroundExposure,
    setUnevenGroundExposure,
  ] = useState(false)

  const [
    prolongedWalkingExposure,
    setProlongedWalkingExposure,
  ] = useState(false)

  const [
    prolongedStandingExposure,
    setProlongedStandingExposure,
  ] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    setError(null)

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser()

    if (
      userError ||
      !userData.user
    ) {
      setError(
        'Unable to identify the signed-in user.'
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
      .eq(
        'id',
        userData.user.id
      )
      .single()

    if (
      profileError ||
      !profileData?.organisation_id
    ) {
      setError(
        profileError?.message ||
          'Organisation could not be identified.'
      )
      setLoading(false)
      return
    }

    const organisationId =
      profileData.organisation_id

    const [
      workersResponse,
      jobProfilesResponse,
      operationsResponse,
      sitesResponse,
      departmentsResponse,
    ] = await Promise.all([
      supabase
        .from('workers')
        .select(`
          id,
          employee_number,
          first_name,
          last_name,
          job_profile_id,
          operation_id,
          site_id,
          department_id
        `)
        .eq(
          'organisation_id',
          organisationId
        )
        .order(
          'last_name',
          {
            ascending: true,
          }
        ),

      supabase
        .from('job_profiles')
        .select(`
          id,
          job_code,
          description,
          physical_demand_level
        `)
        .eq(
          'organisation_id',
          organisationId
        ),

      supabase
        .from('operations')
        .select('id,name')
        .eq(
          'organisation_id',
          organisationId
        ),

      supabase
        .from('sites')
        .select('id,name'),

      supabase
        .from('departments')
        .select('id,name'),
    ])

    if (workersResponse.error) {
      setError(
        workersResponse.error.message
      )
      setLoading(false)
      return
    }

    if (jobProfilesResponse.error) {
      setError(
        jobProfilesResponse.error.message
      )
      setLoading(false)
      return
    }

    if (operationsResponse.error) {
      setError(
        operationsResponse.error.message
      )
      setLoading(false)
      return
    }

    if (sitesResponse.error) {
      setError(
        sitesResponse.error.message
      )
      setLoading(false)
      return
    }

    if (departmentsResponse.error) {
      setError(
        departmentsResponse.error.message
      )
      setLoading(false)
      return
    }

    setWorkers(
      (workersResponse.data ??
        []) as Worker[]
    )

    setJobProfiles(
      (jobProfilesResponse.data ??
        []) as JobProfile[]
    )

    setOperations(
      (operationsResponse.data ??
        []) as Operation[]
    )

    setSites(
      (sitesResponse.data ??
        []) as Site[]
    )

    setDepartments(
      (departmentsResponse.data ??
        []) as Department[]
    )

    setLoading(false)
  }

  const selectedWorker =
    useMemo(() => {
      return (
        workers.find(
          (worker) =>
            worker.id === workerId
        ) || null
      )
    }, [
      workers,
      workerId,
    ])

  const selectedJobProfile =
    useMemo(() => {
      if (
        !selectedWorker?.job_profile_id
      ) {
        return null
      }

      return (
        jobProfiles.find(
          (profile) =>
            profile.id ===
            selectedWorker.job_profile_id
        ) || null
      )
    }, [
      selectedWorker,
      jobProfiles,
    ])

  const selectedOperation =
    useMemo(() => {
      if (
        !selectedWorker?.operation_id
      ) {
        return null
      }

      return (
        operations.find(
          (operation) =>
            operation.id ===
            selectedWorker.operation_id
        ) || null
      )
    }, [
      selectedWorker,
      operations,
    ])

  const selectedSite =
    useMemo(() => {
      if (!selectedWorker?.site_id) {
        return null
      }

      return (
        sites.find(
          (site) =>
            site.id ===
            selectedWorker.site_id
        ) || null
      )
    }, [
      selectedWorker,
      sites,
    ])

  const selectedDepartment =
    useMemo(() => {
      if (
        !selectedWorker?.department_id
      ) {
        return null
      }

      return (
        departments.find(
          (department) =>
            department.id ===
            selectedWorker.department_id
        ) || null
      )
    }, [
      selectedWorker,
      departments,
    ])

  const exposureCount =
    useMemo(() => {
      return [
        manualHandlingExposure,
        repetitiveWorkExposure,
        awkwardPostureExposure,
        prolongedPostureExposure,
        vibrationExposure,
        overheadWorkExposure,
        kneelingSquattingExposure,
        confinedSpaceExposure,
        unevenGroundExposure,
        prolongedWalkingExposure,
        prolongedStandingExposure,
      ].filter(Boolean).length
    }, [
      manualHandlingExposure,
      repetitiveWorkExposure,
      awkwardPostureExposure,
      prolongedPostureExposure,
      vibrationExposure,
      overheadWorkExposure,
      kneelingSquattingExposure,
      confinedSpaceExposure,
      unevenGroundExposure,
      prolongedWalkingExposure,
      prolongedStandingExposure,
    ])

  async function createScreening() {
    if (!workerId) {
      setError(
        'Please select a worker before starting the screening.'
      )
      return
    }

    setSaving(true)
    setError(null)

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser()

    if (
      userError ||
      !userData.user
    ) {
      setError(
        'Unable to identify the signed-in user.'
      )
      setSaving(false)
      return
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('organisation_id')
      .eq(
        'id',
        userData.user.id
      )
      .single()

    if (
      profileError ||
      !profileData?.organisation_id
    ) {
      setError(
        profileError?.message ||
          'Organisation could not be identified.'
      )
      setSaving(false)
      return
    }

    const {
      data: screeningData,
      error: screeningError,
    } = await supabase
      .from('msk_screenings')
      .insert({
        organisation_id:
          profileData.organisation_id,

        worker_id: workerId,

        screened_by:
          userData.user.id,

        screening_date:
          screeningDate,

        screening_type:
          screeningType,

        current_msk_complaint:
          currentMskComplaint,

        previous_msk_injury:
          previousMskInjury,

        previous_msk_injury_details:
          previousMskInjury
            ? previousMskInjuryDetails ||
              null
            : null,

        currently_receiving_treatment:
          currentlyReceivingTreatment,

        treatment_details:
          currentlyReceivingTreatment
            ? treatmentDetails || null
            : null,

        manual_handling_exposure:
          manualHandlingExposure,

        repetitive_work_exposure:
          repetitiveWorkExposure,

        awkward_posture_exposure:
          awkwardPostureExposure,

        prolonged_posture_exposure:
          prolongedPostureExposure,

        vibration_exposure:
          vibrationExposure,

        overhead_work_exposure:
          overheadWorkExposure,

        kneeling_squatting_exposure:
          kneelingSquattingExposure,

        confined_space_exposure:
          confinedSpaceExposure,

        uneven_ground_exposure:
          unevenGroundExposure,

        prolonged_walking_exposure:
          prolongedWalkingExposure,

        prolonged_standing_exposure:
          prolongedStandingExposure,

        screening_status:
          'in_progress',
      })
      .select('id')
      .single()

    if (
      screeningError ||
      !screeningData
    ) {
      setError(
        screeningError?.message ||
          'Unable to create MSK screening.'
      )
      setSaving(false)
      return
    }

    navigate(
      `/msk-screenings/${screeningData.id}`
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading MSK screening...
        </p>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            MSK PREVENTION
          </span>

          <h1>
            New MSK Screening
          </h1>

          <p>
            Start a preventive
            musculoskeletal screening
            and identify occupational
            exposure before functional
            problems progress.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate(
              '/msk-screenings'
            )
          }
        >
          <ArrowLeft size={16} />
          Back to Screenings
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <UserRound size={20} />
          </div>

          <div>
            <h2>
              Worker Selection
            </h2>

            <p>
              Select the worker who is
              being screened.
            </p>
          </div>

        </div>

        <div
          className="form-grid"
          style={{
            marginTop: 20,
          }}
        >

          <label>
            <span>
              Worker
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
                      worker.first_name
                    }{' '}
                    {
                      worker.last_name
                    } —{' '}
                    {
                      worker.employee_number
                    }
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>
              Screening Date
            </span>

            <input
              type="date"
              value={screeningDate}
              onChange={(event) =>
                setScreeningDate(
                  event.target.value
                )
              }
            />
          </label>

          <label>
            <span>
              Screening Type
            </span>

            <select
              value={screeningType}
              onChange={(event) =>
                setScreeningType(
                  event.target.value
                )
              }
            >
              <option value="baseline">
                Baseline
              </option>

              <option value="periodic">
                Periodic
              </option>

              <option value="targeted">
                Targeted
              </option>

              <option value="post_intervention">
                Post Intervention
              </option>

              <option value="return_to_work">
                Return to Work
              </option>
            </select>
          </label>

        </div>

      </div>

      {selectedWorker && (
        <div className="panel">

          <div className="assessment-section-title">

            <div className="assessment-section-icon">
              <BriefcaseBusiness
                size={20}
              />
            </div>

            <div>
              <h2>
                Occupational Context
              </h2>

              <p>
                Screening findings will
                later be interpreted
                against the worker's
                occupational demands.
              </p>
            </div>

          </div>

          <div
            className="fce-summary-row"
            style={{
              marginTop: 20,
            }}
          >

            <div>
              <UserRound size={18} />

              <span>
                EMPLOYEE
              </span>

              <strong>
                {
                  selectedWorker
                    .employee_number
                }
              </strong>
            </div>

            <div>
              <BriefcaseBusiness
                size={18}
              />

              <span>
                JOB
              </span>

              <strong>
                {selectedJobProfile
                  ?.description ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <Activity size={18} />

              <span>
                OPERATION
              </span>

              <strong>
                {selectedOperation
                  ?.name ||
                  'Not assigned'}
              </strong>
            </div>

            <div>
              <ShieldCheck size={18} />

              <span>
                DEMAND LEVEL
              </span>

              <strong>
                {selectedJobProfile
                  ?.physical_demand_level ||
                  'Not recorded'}
              </strong>
            </div>

          </div>

          <div
            style={{
              marginTop: 18,
            }}
          >
            <strong>
              Site/Shaft:
            </strong>{' '}
            {selectedSite?.name ||
              'Not assigned'}
            {' · '}

            <strong>
              Department:
            </strong>{' '}
            {selectedDepartment?.name ||
              'Not assigned'}
          </div>

        </div>
      )}

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <HeartPulse size={20} />
          </div>

          <div>
            <h2>
              Current MSK Status
            </h2>

            <p>
              Capture current symptoms,
              previous injuries and
              treatment status.
            </p>
          </div>

        </div>

        <div
          className="form-grid"
          style={{
            marginTop: 20,
          }}
        >

          <label>
            <span>
              Current MSK complaint?
            </span>

            <select
              value={
                currentMskComplaint
                  ? 'yes'
                  : 'no'
              }
              onChange={(event) =>
                setCurrentMskComplaint(
                  event.target.value ===
                    'yes'
                )
              }
            >
              <option value="no">
                No
              </option>

              <option value="yes">
                Yes
              </option>
            </select>
          </label>

          <label>
            <span>
              Previous MSK injury?
            </span>

            <select
              value={
                previousMskInjury
                  ? 'yes'
                  : 'no'
              }
              onChange={(event) =>
                setPreviousMskInjury(
                  event.target.value ===
                    'yes'
                )
              }
            >
              <option value="no">
                No
              </option>

              <option value="yes">
                Yes
              </option>
            </select>
          </label>

          <label>
            <span>
              Currently receiving
              treatment?
            </span>

            <select
              value={
                currentlyReceivingTreatment
                  ? 'yes'
                  : 'no'
              }
              onChange={(event) =>
                setCurrentlyReceivingTreatment(
                  event.target.value ===
                    'yes'
                )
              }
            >
              <option value="no">
                No
              </option>

              <option value="yes">
                Yes
              </option>
            </select>
          </label>

        </div>

        {previousMskInjury && (
          <label
            style={{
              display: 'block',
              marginTop: 18,
            }}
          >
            <span>
              Previous Injury Details
            </span>

            <textarea
              value={
                previousMskInjuryDetails
              }
              onChange={(event) =>
                setPreviousMskInjuryDetails(
                  event.target.value
                )
              }
              placeholder="Previous injury, body region, approximate date and relevant history"
              rows={4}
            />
          </label>
        )}

        {currentlyReceivingTreatment && (
          <label
            style={{
              display: 'block',
              marginTop: 18,
            }}
          >
            <span>
              Current Treatment Details
            </span>

            <textarea
              value={treatmentDetails}
              onChange={(event) =>
                setTreatmentDetails(
                  event.target.value
                )
              }
              placeholder="Type of treatment, provider and reason for treatment"
              rows={4}
            />
          </label>
        )}

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Occupational Exposure
            </h2>

            <p>
              Select the physical work
              exposures that are
              routinely relevant to the
              worker's job.
            </p>
          </div>

        </div>

        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
          }}
        >

          <ExposureToggle
            label="Manual handling / lifting"
            checked={
              manualHandlingExposure
            }
            onChange={
              setManualHandlingExposure
            }
          />

          <ExposureToggle
            label="Repetitive work"
            checked={
              repetitiveWorkExposure
            }
            onChange={
              setRepetitiveWorkExposure
            }
          />

          <ExposureToggle
            label="Awkward postures"
            checked={
              awkwardPostureExposure
            }
            onChange={
              setAwkwardPostureExposure
            }
          />

          <ExposureToggle
            label="Prolonged static postures"
            checked={
              prolongedPostureExposure
            }
            onChange={
              setProlongedPostureExposure
            }
          />

          <ExposureToggle
            label="Vibration exposure"
            checked={
              vibrationExposure
            }
            onChange={
              setVibrationExposure
            }
          />

          <ExposureToggle
            label="Overhead work"
            checked={
              overheadWorkExposure
            }
            onChange={
              setOverheadWorkExposure
            }
          />

          <ExposureToggle
            label="Kneeling / squatting"
            checked={
              kneelingSquattingExposure
            }
            onChange={
              setKneelingSquattingExposure
            }
          />

          <ExposureToggle
            label="Confined-space work"
            checked={
              confinedSpaceExposure
            }
            onChange={
              setConfinedSpaceExposure
            }
          />

          <ExposureToggle
            label="Uneven ground"
            checked={
              unevenGroundExposure
            }
            onChange={
              setUnevenGroundExposure
            }
          />

          <ExposureToggle
            label="Prolonged walking"
            checked={
              prolongedWalkingExposure
            }
            onChange={
              setProlongedWalkingExposure
            }
          />

          <ExposureToggle
            label="Prolonged standing"
            checked={
              prolongedStandingExposure
            }
            onChange={
              setProlongedStandingExposure
            }
          />

        </div>

        <div
          style={{
            marginTop: 20,
            padding: 16,
            border:
              '1px solid var(--border-color, #e5e7eb)',
            borderRadius: 8,
          }}
        >
          <strong>
            Exposure factors selected:{' '}
            {exposureCount}
          </strong>

          <p
            style={{
              marginBottom: 0,
              marginTop: 6,
            }}
          >
            These exposures are not
            being used as a standalone
            diagnosis or prediction.
            They will form one part of
            the later MSK risk profile
            together with symptoms,
            physical findings and job
            demands.
          </p>
        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <h2>
              Start Screening
            </h2>

            <p>
              Save this baseline
              information and continue
              to the body-region and
              physical screening.
            </p>
          </div>

        </div>

        <div
          style={{
            marginTop: 20,
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >

          <button
            className="primary-button"
            onClick={createScreening}
            disabled={
              saving ||
              !workerId
            }
          >
            {saving ? (
              <>
                <Save size={16} />
                Creating...
              </>
            ) : (
              <>
                <ClipboardPlus
                  size={16}
                />
                Create Screening &
                Continue
              </>
            )}
          </button>

          <button
            className="secondary-button"
            onClick={() =>
              navigate(
                '/msk-screenings'
              )
            }
          >
            Cancel
          </button>

        </div>

      </div>

    </div>
  )
}

type ExposureToggleProps = {
  label: string
  checked: boolean
  onChange: (
    value: boolean
  ) => void
}

function ExposureToggle({
  label,
  checked,
  onChange,
}: ExposureToggleProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        border:
          '1px solid var(--border-color, #e5e7eb)',
        borderRadius: 8,
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
      />

      <span>
        {label}
      </span>
    </label>
  )
}
