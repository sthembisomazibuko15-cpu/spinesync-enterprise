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

type TestRow = {
  key: string
  category: string
  name: string
  side: string | null
  unit: string
  measured: string
  required: number | null
  notes: string
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

    let profile: JobProfile | null = null

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

    const mergedTests =
      baseTests.map((test) => {
        const existing =
          existingResults?.find(
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

          notes:
            existing.notes || '',
        }
      })

    setTests(mergedTests)
    setLoading(false)
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
        measured: '',
        required: null,
        notes: '',
      },

      {
        key: 'grip-left',
        category: 'strength',
        name: 'Grip Strength',
        side: 'left',
        unit: 'kg',
        measured: '',
        required: null,
        notes: '',
      },

      {
        key: 'floor-waist-lift',
        category: 'material_handling',
        name: 'Floor-to-Waist Lift',
        side: null,
        unit: 'kg',
        measured: '',
        required:
          profile?.lifting_required_kg ??
          null,
        notes: '',
      },

      {
        key: 'waist-shoulder-lift',
        category: 'material_handling',
        name: 'Waist-to-Shoulder Lift',
        side: null,
        unit: 'kg',
        measured: '',
        required:
          profile?.lifting_required_kg ??
          null,
        notes: '',
      },

      {
        key: 'carry',
        category: 'material_handling',
        name: 'Carry',
        side: null,
        unit: 'kg',
        measured: '',
        required:
          profile?.carrying_required_kg ??
          null,
        notes: '',
      },

      {
        key: 'push',
        category: 'material_handling',
        name: 'Push',
        side: null,
        unit: 'kg',
        measured: '',
        required:
          profile?.push_required_kg ??
          null,
        notes: '',
      },

      {
        key: 'pull',
        category: 'material_handling',
        name: 'Pull',
        side: null,
        unit: 'kg',
        measured: '',
        required:
          profile?.pull_required_kg ??
          null,
        notes: '',
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
        measured: '',
        required:
          profile.standing_required_minutes,
        notes: '',
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
        measured: '',
        required:
          profile.walking_required_minutes,
        notes: '',
      })
    }

    if (profile?.squatting_required) {
      rows.push({
        key: 'squat',
        category: 'postural',
        name: 'Squat',
        side: null,
        unit: 'score',
        measured: '',
        required: 1,
        notes: '',
      })
    }

    if (profile?.kneeling_required) {
      rows.push({
        key: 'kneeling',
        category: 'postural',
        name: 'Kneeling',
        side: null,
        unit: 'score',
        measured: '',
        required: 1,
        notes: '',
      })
    }

    if (
      profile?.stair_climbing_required
    ) {
      rows.push({
        key: 'stairs',
        category: 'mobility',
        name: 'Stair Climbing',
        side: null,
        unit: 'score',
        measured: '',
        required: 1,
        notes: '',
      })
    }

    if (
      profile?.ladder_climbing_required
    ) {
      rows.push({
        key: 'ladder',
        category: 'mobility',
        name: 'Ladder Climbing',
        side: null,
        unit: 'score',
        measured: '',
        required: 1,
        notes: '',
      })
    }

    if (profile?.crawling_required) {
      rows.push({
        key: 'crawling',
        category: 'postural',
        name: 'Crawling',
        side: null,
        unit: 'score',
        measured: '',
        required: 1,
        notes: '',
      })
    }

    if (
      profile?.overhead_work_required
    ) {
      rows.push({
        key: 'overhead-work',
        category: 'upper_limb',
        name: 'Overhead Work',
        side: null,
        unit: 'score',
        measured: '',
        required: 1,
        notes: '',
      })
    }

    if (
      profile
        ?.repetitive_upper_limb_required
    ) {
      rows.push({
        key: 'repetitive-upper-limb',
        category: 'upper_limb',
        name: 'Repetitive Upper-Limb Work',
        side: null,
        unit: 'score',
        measured: '',
        required: 1,
        notes: '',
      })
    }

    if (
      profile?.uneven_ground_required
    ) {
      rows.push({
        key: 'uneven-ground',
        category: 'mobility',
        name: 'Uneven Ground Mobility',
        side: null,
        unit: 'score',
        measured: '',
        required: 1,
        notes: '',
      })
    }

    if (
      profile?.confined_space_required
    ) {
      rows.push({
        key: 'confined-space',
        category: 'functional',
        name: 'Confined Space Mobility',
        side: null,
        unit: 'score',
        measured: '',
        required: 1,
        notes: '',
      })
    }

    return rows
  }

  function updateTest(
    key: string,
    field: 'measured' | 'notes',
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

  function classify(
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

  function numberOrNull(
    value: string
  ) {
    if (!value.trim()) {
      return null
    }

    const number =
      Number(value)

    return Number.isNaN(number)
      ? null
      : number
  }

  const summary = useMemo(() => {
    let pass = 0
    let borderline = 0
    let fail = 0
    let notTested = 0

    tests.forEach((test) => {
      const measured =
        numberOrNull(test.measured)

      const result =
        classify(
          measured,
          test.required
        )

      if (result === 'pass') {
        pass += 1
      } else if (
        result === 'borderline'
      ) {
        borderline += 1
      } else if (result === 'fail') {
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

    /*
      Replace the assessment's existing
      test rows with the current values.
    */

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
          numberOrNull(
            test.measured
          )

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
            test.required,

          unit:
            test.unit,

          result:
            classify(
              measured,
              test.required
            ),

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

  function formatDemandLevel(
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

  function categoryLabel(
    value: string
  ) {
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
            of the assigned job profile.
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

      {/* WORKER */}

      <div className="worker-summary-card">

        <div className="worker-avatar-large">
          <Activity size={24} />
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

      {/* JOB DEMAND */}

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
              The FCE requirements below
              are automatically generated
              from the worker's assigned
              job profile.
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
                {formatDemandLevel(
                  jobProfile
                    .physical_demand_level
                )}
              </h3>
            </div>

          </div>
        ) : (
          <div className="error-message">
            This worker does not currently
            have a job profile assigned.
            Tests can still be recorded,
            but job-demand comparisons
            will be limited.
          </div>
        )}

      </div>

      {/* SUMMARY */}

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

      {/* TESTS */}

      <div className="stack">

        {tests.map((test) => {
          const measured =
            numberOrNull(
              test.measured
            )

          const result =
            classify(
              measured,
              test.required
            )

          return (
            <div
              className="panel"
              key={test.key}
            >

              <div className="page-heading">

                <div>

                  <span className="eyebrow">
                    {categoryLabel(
                      test.category
                    )}
                  </span>

                  <h3>
                    {test.name}
                    {test.side
                      ? ` — ${categoryLabel(
                          test.side
                        )}`
                      : ''}
                  </h3>

                </div>

                <span
                  className={`badge ${result}`}
                >
                  {categoryLabel(result)}
                </span>

              </div>

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
                    onChange={(event) =>
                      updateTest(
                        test.key,
                        'measured',
                        event.target.value
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
                        ? test.required
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
                  value={test.notes}
                  onChange={(event) =>
                    updateTest(
                      test.key,
                      'notes',
                      event.target.value
                    )
                  }
                  placeholder="Pain, movement quality, compensations, symptoms or other observations"
                />
              </label>

            </div>
          )
        })}

      </div>

      <div className="panel">

        <p>
          <strong>Important:</strong>{' '}
          the displayed comparison is
          decision support only. Final
          interpretation and fitness
          determination remain the
          responsibility of the assessing
          professional.
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
