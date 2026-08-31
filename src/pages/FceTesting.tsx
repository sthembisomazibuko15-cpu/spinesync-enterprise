import {
  Activity,
  ArrowLeft,
  BriefcaseBusiness,
  Save,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import { supabase } from '../lib/supabase'

type Assessment = {
  id: string
  worker_id: string
  assessment_status: string
}

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
}

type TestMode =
  | 'numeric'
  | 'functional'

type TestRow = {
  key: string
  category: string
  name: string
  side: string | null
  unit: string
  mode: TestMode
  measured: string
  required: number | null
  repetitions: string
  durationSeconds: string
  movementQuality: string
  assistanceRequired: string
  symptomsReported: string
  assessorRating: string
  notes: string
}

type ExistingResult = {
  test_category: string
  test_name: string
  side: string | null
  measured_value: number | null
  required_value: number | null
  unit: string | null
  result: string | null
  repetitions: number | null
  duration_seconds: number | null
  movement_quality: string | null
  assistance_required: string | null
  symptoms_reported: string | null
  assessor_rating: string | null
  notes: string | null
}

export default function FceTesting() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [assessment, setAssessment] =
    useState<Assessment | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [jobProfile, setJobProfile] =
    useState<JobProfile | null>(null)

  const [tests, setTests] =
    useState<TestRow[]>([])

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadAssessment()
  }, [id])

  async function loadAssessment() {
    if (!id) {
      setError('Assessment not found.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const {
      data: assessmentData,
      error: assessmentError,
    } = await supabase
      .from('assessments')
      .select(`
        id,
        worker_id,
        assessment_status
      `)
      .eq('id', id)
      .single()

    if (assessmentError) {
      setError(assessmentError.message)
      setLoading(false)
      return
    }

    const typedAssessment =
      assessmentData as Assessment

    setAssessment(typedAssessment)

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
      .eq(
        'id',
        typedAssessment.worker_id
      )
      .single()

    if (workerError) {
      setError(workerError.message)
      setLoading(false)
      return
    }

    const typedWorker =
      workerData as Worker

    setWorker(typedWorker)

    let profile: JobProfile | null =
      null

    if (typedWorker.job_profile_id) {
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('job_profiles')
        .select(`
          id,
          title,
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
          confined_space_required
        `)
        .eq(
          'id',
          typedWorker.job_profile_id
        )
        .maybeSingle()

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      profile =
        profileData as JobProfile | null

      setJobProfile(profile)
    }

    const {
      data: existingResults,
      error: resultsError,
    } = await supabase
      .from('fce_results')
      .select(`
        test_category,
        test_name,
        side,
        measured_value,
        required_value,
        unit,
        result,
        repetitions,
        duration_seconds,
        movement_quality,
        assistance_required,
        symptoms_reported,
        assessor_rating,
        notes
      `)
      .eq(
        'assessment_id',
        typedAssessment.id
      )

    if (resultsError) {
      setError(resultsError.message)
      setLoading(false)
      return
    }

    const baseTests =
      buildTests(profile)

    const typedExisting =
      (existingResults ??
        []) as ExistingResult[]

    const mergedTests =
      baseTests.map((test) => {
        const existing =
          typedExisting.find(
            (result) =>
              result.test_name ===
                test.name &&
              (result.side || null) ===
                test.side
          )

        if (!existing) {
          return test
        }

        return {
          ...test,

          measured:
            existing.measured_value !==
            null
              ? String(
                  existing.measured_value
                )
              : '',

          repetitions:
            existing.repetitions !== null
              ? String(
                  existing.repetitions
                )
              : '',

          durationSeconds:
            existing.duration_seconds !==
            null
              ? String(
                  existing.duration_seconds
                )
              : '',

          movementQuality:
            existing.movement_quality ||
            '',

          assistanceRequired:
            existing
              .assistance_required || '',

          symptomsReported:
            existing
              .symptoms_reported || '',

          assessorRating:
            existing.assessor_rating ||
            existing.result ||
            '',

          notes:
            existing.notes || '',
        }
      })

    setTests(mergedTests)
    setLoading(false)
  }

  function emptyFunctionalFields() {
    return {
      repetitions: '',
      durationSeconds: '',
      movementQuality: '',
      assistanceRequired: '',
      symptomsReported: '',
      assessorRating: '',
      notes: '',
    }
  }

  function buildTests(
    profile: JobProfile | null
  ): TestRow[] {
    const rows: TestRow[] = [
      {
        key: 'grip-right',
        category: 'strength',
        name: 'Grip Strength',
        side: 'right',
        unit: 'kg',
        mode: 'numeric',
        measured: '',
        required: null,
        ...emptyFunctionalFields(),
      },

      {
        key: 'grip-left',
        category: 'strength',
        name: 'Grip Strength',
        side: 'left',
        unit: 'kg',
        mode: 'numeric',
        measured: '',
        required: null,
        ...emptyFunctionalFields(),
      },

      {
        key: 'floor-waist-lift',
        category: 'material_handling',
        name: 'Floor-to-Waist Lift',
        side: null,
        unit: 'kg',
        mode: 'numeric',
        measured: '',
        required:
          profile?.lifting_required_kg ??
          null,
        ...emptyFunctionalFields(),
      },

      {
        key: 'waist-shoulder-lift',
        category: 'material_handling',
        name: 'Waist-to-Shoulder Lift',
        side: null,
        unit: 'kg',
        mode: 'numeric',
        measured: '',
        required:
          profile?.lifting_required_kg ??
          null,
        ...emptyFunctionalFields(),
      },

      {
        key: 'carry',
        category: 'material_handling',
        name: 'Carry',
        side: null,
        unit: 'kg',
        mode: 'numeric',
        measured: '',
        required:
          profile?.carrying_required_kg ??
          null,
        ...emptyFunctionalFields(),
      },

      {
        key: 'push',
        category: 'material_handling',
        name: 'Push',
        side: null,
        unit: 'kg',
        mode: 'numeric',
        measured: '',
        required:
          profile?.push_required_kg ??
          null,
        ...emptyFunctionalFields(),
      },

      {
        key: 'pull',
        category: 'material_handling',
        name: 'Pull',
        side: null,
        unit: 'kg',
        mode: 'numeric',
        measured: '',
        required:
          profile?.pull_required_kg ??
          null,
        ...emptyFunctionalFields(),
      },
    ]

    if (
      profile?.standing_required_minutes !==
        null &&
      profile?.standing_required_minutes !==
        undefined
    ) {
      rows.push({
        key: 'standing',
        category: 'endurance',
        name: 'Standing Tolerance',
        side: null,
        unit: 'min',
        mode: 'numeric',
        measured: '',
        required:
          profile.standing_required_minutes,
        ...emptyFunctionalFields(),
      })
    }

    if (
      profile?.walking_required_minutes !==
        null &&
      profile?.walking_required_minutes !==
        undefined
    ) {
      rows.push({
        key: 'walking',
        category: 'endurance',
        name: 'Walking Tolerance',
        side: null,
        unit: 'min',
        mode: 'numeric',
        measured: '',
        required:
          profile.walking_required_minutes,
        ...emptyFunctionalFields(),
      })
    }

    function addFunctional(
      condition: boolean | null | undefined,
      key: string,
      category: string,
      name: string
    ) {
      if (!condition) {
        return
      }

      rows.push({
        key,
        category,
        name,
        side: null,
        unit: '',
        mode: 'functional',
        measured: '',
        required: null,
        ...emptyFunctionalFields(),
      })
    }

    addFunctional(
      profile?.squatting_required,
      'squat',
      'postural',
      'Squatting'
    )

    addFunctional(
      profile?.kneeling_required,
      'kneeling',
      'postural',
      'Kneeling'
    )

    addFunctional(
      profile?.stair_climbing_required,
      'stairs',
      'mobility',
      'Stair Climbing'
    )

    addFunctional(
      profile?.ladder_climbing_required,
      'ladder',
      'mobility',
      'Ladder Climbing'
    )

    addFunctional(
      profile?.crawling_required,
      'crawling',
      'postural',
      'Crawling'
    )

    addFunctional(
      profile?.overhead_work_required,
      'overhead-work',
      'upper_limb',
      'Overhead Work'
    )

    addFunctional(
      profile
        ?.repetitive_upper_limb_required,
      'repetitive-upper-limb',
      'upper_limb',
      'Repetitive Upper-Limb Work'
    )

    addFunctional(
      profile?.uneven_ground_required,
      'uneven-ground',
      'mobility',
      'Uneven Ground Mobility'
    )

    addFunctional(
      profile?.confined_space_required,
      'confined-space',
      'functional',
      'Confined Space Mobility'
    )

    return rows
  }

  function updateTest(
    key: string,
    field: keyof TestRow,
    value: string
  ) {
    setTests((current) =>
      current.map((test) =>
        test.key === key
          ? {
              ...test,
              [field]: value,
            }
          : test
      )
    )
  }

  function numberOrNull(
    value: string
  ) {
    if (!value.trim()) {
      return null
    }

    const number = Number(value)

    return Number.isNaN(number)
      ? null
      : number
  }

  function integerOrNull(
    value: string
  ) {
    if (!value.trim()) {
      return null
    }

    const number =
      parseInt(value, 10)

    return Number.isNaN(number)
      ? null
      : number
  }

  function classifyNumeric(
    measured: number | null,
    required: number | null
  ) {
    if (
      measured === null ||
      required === null ||
      required <= 0
    ) {
      return 'not_tested'
    }

    const ratio =
      measured / required

    if (ratio >= 1) {
      return 'pass'
    }

    if (ratio >= 0.85) {
      return 'borderline'
    }

    return 'fail'
  }

  function getTestResult(
    test: TestRow
  ) {
    if (test.mode === 'functional') {
      return (
        test.assessorRating ||
        'not_tested'
      )
    }

    return classifyNumeric(
      numberOrNull(test.measured),
      test.required
    )
  }

  const summary = useMemo(() => {
    let pass = 0
    let borderline = 0
    let fail = 0
    let notTested = 0

    tests.forEach((test) => {
      const result =
        getTestResult(test)

      if (result === 'pass') {
        pass += 1
      } else if (
        result === 'borderline'
      ) {
        borderline += 1
      } else if (
        result === 'fail'
      ) {
        fail += 1
      } else {
        notTested += 1
      }
    })

    return {
      pass,
      borderline,
      fail,
      notTested,
    }
  }, [tests])

  async function saveResults() {
    if (!assessment) {
      return
    }

    setSaving(true)
    setError(null)

    const {
      error: deleteError,
    } = await supabase
      .from('fce_results')
      .delete()
      .eq(
        'assessment_id',
        assessment.id
      )

    if (deleteError) {
      setError(deleteError.message)
      setSaving(false)
      return
    }

    const rows = tests.map(
      (test) => {
        const measured =
          test.mode === 'numeric'
            ? numberOrNull(
                test.measured
              )
            : null

        const result =
          getTestResult(test)

        return {
          assessment_id:
            assessment.id,

          test_category:
            test.category,

          test_name:
            test.name,

          side:
            test.side,

          measured_value:
            measured,

          required_value:
            test.mode === 'numeric'
              ? test.required
              : null,

          unit:
            test.mode === 'numeric'
              ? test.unit
              : null,

          result,

          repetitions:
            test.mode === 'functional'
              ? integerOrNull(
                  test.repetitions
                )
              : null,

          duration_seconds:
            test.mode === 'functional'
              ? numberOrNull(
                  test.durationSeconds
                )
              : null,

          movement_quality:
            test.mode === 'functional'
              ? test.movementQuality ||
                null
              : null,

          assistance_required:
            test.mode === 'functional'
              ? test
                  .assistanceRequired ||
                null
              : null,

          symptoms_reported:
            test.mode === 'functional'
              ? test.symptomsReported ||
                null
              : null,

          assessor_rating:
            test.mode === 'functional'
              ? result
              : null,

          notes:
            test.notes.trim() ||
            null,
        }
      }
    )

    const {
      error: insertError,
    } = await supabase
      .from('fce_results')
      .insert(rows)

    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }

    setSaving(false)

    navigate(
      `/assessments/${assessment.id}/outcome`
    )
  }

  function formatLabel(
    value: string | null
  ) {
    if (!value) {
      return 'Not specified'
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

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading FCE...
        </p>
      </div>
    )
  }

  if (
    error &&
    !assessment
  ) {
    return (
      <div className="stack">

        <div className="error-message">
          {error}
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate('/assessments')
          }
        >
          <ArrowLeft size={16} />
          Assessments
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
            FCE Testing
          </h1>

          <p>
            Record worker performance
            against the physical demands
            of the assigned job.
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

      <div className="worker-summary-card">

        <div className="worker-avatar-large">
          <Activity size={24} />
        </div>

        <div>
          <span>WORKER</span>

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

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <BriefcaseBusiness
              size={20}
            />
          </div>

          <div>
            <h3>
              Assigned Job Demand
            </h3>

            <p>
              Test requirements are based
              on the worker's assigned job
              profile.
            </p>
          </div>

        </div>

        {jobProfile ? (
          <div className="form-grid">

            <div>
              <span className="eyebrow">
                JOB PROFILE
              </span>

              <h3>
                {jobProfile.title}
              </h3>
            </div>

            <div>
              <span className="eyebrow">
                PHYSICAL DEMAND LEVEL
              </span>

              <h3>
                {formatLabel(
                  jobProfile
                    .physical_demand_level
                )}
              </h3>
            </div>

          </div>
        ) : (
          <div className="error-message">
            This worker has no assigned
            job profile. Numeric job-demand
            comparison will be limited.
          </div>
        )}

      </div>

      <div className="panel">

        <h3>
          Live Capacity Summary
        </h3>

        <div className="fce-summary-row">

          <div>
            <span>PASS</span>
            <strong>
              {summary.pass}
            </strong>
          </div>

          <div>
            <span>
              BORDERLINE
            </span>
            <strong>
              {summary.borderline}
            </strong>
          </div>

          <div>
            <span>FAIL</span>
            <strong>
              {summary.fail}
            </strong>
          </div>

          <div>
            <span>
              NOT TESTED
            </span>
            <strong>
              {summary.notTested}
            </strong>
          </div>

        </div>

      </div>

      <div className="stack">

        {tests.map((test) => {
          const result =
            getTestResult(test)

          return (
            <div
              className="panel"
              key={test.key}
            >

              <div className="page-heading">

                <div>
                  <span className="eyebrow">
                    {formatLabel(
                      test.category
                    )}
                  </span>

                  <h3>
                    {test.name}

                    {test.side
                      ? ` — ${formatLabel(
                          test.side
                        )}`
                      : ''}
                  </h3>
                </div>

                <span
                  className={`badge ${result}`}
                >
                  {formatLabel(result)}
                </span>

              </div>

              {test.mode ===
              'numeric' ? (
                <>
                  <div className="form-grid">

                    <label>
                      <span>
                        Worker Performance
                        ({test.unit})
                      </span>

                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={
                          test.measured
                        }
                        onChange={(
                          event
                        ) =>
                          updateTest(
                            test.key,
                            'measured',
                            event.target
                              .value
                          )
                        }
                        placeholder="Enter result"
                      />
                    </label>

                    <label>
                      <span>
                        Job Requirement
                        ({test.unit})
                      </span>

                      <input
                        type="text"
                        value={
                          test.required !==
                          null
                            ? String(
                                test.required
                              )
                            : 'Not specified'
                        }
                        disabled
                      />
                    </label>

                  </div>

                  <label>
                    <span>
                      Clinical Notes
                    </span>

                    <textarea
                      rows={2}
                      value={
                        test.notes
                      }
                      onChange={(
                        event
                      ) =>
                        updateTest(
                          test.key,
                          'notes',
                          event.target
                            .value
                        )
                      }
                      placeholder="Pain, symptoms, movement quality or observations"
                    />
                  </label>
                </>
              ) : (
                <>
                  <div className="form-grid">

                    <label>
                      <span>
                        Assessor Rating
                      </span>

                      <select
                        value={
                          test.assessorRating
                        }
                        onChange={(
                          event
                        ) =>
                          updateTest(
                            test.key,
                            'assessorRating',
                            event.target
                              .value
                          )
                        }
                      >
                        <option value="">
                          Not tested
                        </option>

                        <option value="pass">
                          Pass
                        </option>

                        <option value="borderline">
                          Borderline
                        </option>

                        <option value="fail">
                          Fail
                        </option>
                      </select>
                    </label>

                    <label>
                      <span>
                        Repetitions
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          test.repetitions
                        }
                        onChange={(
                          event
                        ) =>
                          updateTest(
                            test.key,
                            'repetitions',
                            event.target
                              .value
                          )
                        }
                        placeholder="e.g. 5"
                      />
                    </label>

                    <label>
                      <span>
                        Duration
                        (seconds)
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          test.durationSeconds
                        }
                        onChange={(
                          event
                        ) =>
                          updateTest(
                            test.key,
                            'durationSeconds',
                            event.target
                              .value
                          )
                        }
                        placeholder="e.g. 60"
                      />
                    </label>

                    <label>
                      <span>
                        Movement Quality
                      </span>

                      <select
                        value={
                          test.movementQuality
                        }
                        onChange={(
                          event
                        ) =>
                          updateTest(
                            test.key,
                            'movementQuality',
                            event.target
                              .value
                          )
                        }
                      >
                        <option value="">
                          Select
                        </option>

                        <option value="good">
                          Good
                        </option>

                        <option value="fair">
                          Fair
                        </option>

                        <option value="poor">
                          Poor
                        </option>

                        <option value="unable">
                          Unable
                        </option>
                      </select>
                    </label>

                    <label>
                      <span>
                        Assistance Required
                      </span>

                      <select
                        value={
                          test
                            .assistanceRequired
                        }
                        onChange={(
                          event
                        ) =>
                          updateTest(
                            test.key,
                            'assistanceRequired',
                            event.target
                              .value
                          )
                        }
                      >
                        <option value="">
                          Select
                        </option>

                        <option value="none">
                          None
                        </option>

                        <option value="supervision">
                          Supervision
                        </option>

                        <option value="minimal">
                          Minimal Assistance
                        </option>

                        <option value="moderate">
                          Moderate Assistance
                        </option>

                        <option value="maximum">
                          Maximum Assistance
                        </option>

                        <option value="unable">
                          Unable
                        </option>
                      </select>
                    </label>

                  </div>

                  <label>
                    <span>
                      Symptoms Reported
                    </span>

                    <textarea
                      rows={2}
                      value={
                        test.symptomsReported
                      }
                      onChange={(
                        event
                      ) =>
                        updateTest(
                          test.key,
                          'symptomsReported',
                          event.target
                            .value
                        )
                      }
                      placeholder="Pain, fatigue, dizziness, weakness or other symptoms"
                    />
                  </label>

                  <label>
                    <span>
                      Assessor Notes
                    </span>

                    <textarea
                      rows={2}
                      value={
                        test.notes
                      }
                      onChange={(
                        event
                      ) =>
                        updateTest(
                          test.key,
                          'notes',
                          event.target
                            .value
                        )
                      }
                      placeholder="Technique, compensations, safety concerns and clinical observations"
                    />
                  </label>
                </>
              )}

            </div>
          )
        })}

      </div>

      <div className="panel">

        <p>
          <strong>Clinical note:</strong>{' '}
          numeric material-handling tests
          are compared with recorded job
          requirements. Functional and
          postural tasks are rated by the
          assessor using the observed
          performance and clinical
          findings.
        </p>

        <button
          className="primary-button"
          onClick={saveResults}
          disabled={saving}
        >
          <Save size={16} />

          {saving
            ? 'Saving Results...'
            : 'Save & Review Outcome'}
        </button>

      </div>

    </div>
  )
}
