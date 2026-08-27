import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Gauge,
  Hand,
  Save,
  Scale,
  StepForward,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'

import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import { supabase } from '../lib/supabase'

type Assessment = {
  id: string
  worker_id: string
  organisation_id: string
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
  lifting_required_kg: number | null
  carrying_required_kg: number | null
  push_required_kg: number | null
  pull_required_kg: number | null
}

type TestRow = {
  key: string
  category: string
  name: string
  side: string
  measured: string
  required: string
  unit: string
  painBefore: string
  painAfter: string
  notes: string
}

const baseTests: TestRow[] = [
  {
    key: 'grip_right',
    category: 'Strength',
    name: 'Grip Strength',
    side: 'Right',
    measured: '',
    required: '',
    unit: 'kg',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
  {
    key: 'grip_left',
    category: 'Strength',
    name: 'Grip Strength',
    side: 'Left',
    measured: '',
    required: '',
    unit: 'kg',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
  {
    key: 'floor_waist_lift',
    category: 'Material Handling',
    name: 'Floor-to-Waist Lift',
    side: '',
    measured: '',
    required: '',
    unit: 'kg',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
  {
    key: 'waist_shoulder_lift',
    category: 'Material Handling',
    name: 'Waist-to-Shoulder Lift',
    side: '',
    measured: '',
    required: '',
    unit: 'kg',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
  {
    key: 'carry',
    category: 'Material Handling',
    name: 'Carry',
    side: '',
    measured: '',
    required: '',
    unit: 'kg',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
  {
    key: 'push',
    category: 'Material Handling',
    name: 'Push',
    side: '',
    measured: '',
    required: '',
    unit: 'kg',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
  {
    key: 'pull',
    category: 'Material Handling',
    name: 'Pull',
    side: '',
    measured: '',
    required: '',
    unit: 'kg',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
  {
    key: 'squat',
    category: 'Functional Movement',
    name: 'Squat',
    side: '',
    measured: '',
    required: '1',
    unit: 'score',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
  {
    key: 'kneeling',
    category: 'Functional Movement',
    name: 'Kneeling',
    side: '',
    measured: '',
    required: '1',
    unit: 'score',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
  {
    key: 'balance',
    category: 'Functional Movement',
    name: 'Single-Leg Balance',
    side: '',
    measured: '',
    required: '30',
    unit: 'sec',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
  {
    key: 'step_climb',
    category: 'Functional Movement',
    name: 'Step / Climb',
    side: '',
    measured: '',
    required: '1',
    unit: 'score',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
  {
    key: 'endurance',
    category: 'Endurance',
    name: 'Functional Endurance',
    side: '',
    measured: '',
    required: '',
    unit: 'min',
    painBefore: '0',
    painAfter: '0',
    notes: '',
  },
]

export default function FceTesting() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [assessment, setAssessment] =
    useState<Assessment | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [job, setJob] =
    useState<JobProfile | null>(null)

  const [tests, setTests] =
    useState<TestRow[]>(baseTests)

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

    const {
      data: assessmentData,
      error: assessmentError,
    } = await supabase
      .from('assessments')
      .select(
        'id,worker_id,organisation_id'
      )
      .eq('id', id)
      .single()

    if (assessmentError) {
      setError(assessmentError.message)
      setLoading(false)
      return
    }

    setAssessment(
      assessmentData as Assessment
    )

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
        assessmentData.worker_id
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

    if (typedWorker.job_profile_id) {
      const {
        data: jobData,
        error: jobError,
      } = await supabase
        .from('job_profiles')
        .select(`
          id,
          title,
          lifting_required_kg,
          carrying_required_kg,
          push_required_kg,
          pull_required_kg
        `)
        .eq(
          'id',
          typedWorker.job_profile_id
        )
        .maybeSingle()

      if (jobError) {
        setError(jobError.message)
        setLoading(false)
        return
      }

      if (jobData) {
        setJob(
          jobData as JobProfile
        )

        setTests(
          baseTests.map((test) => {
            if (
              test.key ===
              'floor_waist_lift'
            ) {
              return {
                ...test,
                required:
                  jobData.lifting_required_kg?.toString() ??
                  '',
              }
            }

            if (
              test.key ===
              'waist_shoulder_lift'
            ) {
              return {
                ...test,
                required:
                  jobData.lifting_required_kg?.toString() ??
                  '',
              }
            }

            if (
              test.key === 'carry'
            ) {
              return {
                ...test,
                required:
                  jobData.carrying_required_kg?.toString() ??
                  '',
              }
            }

            if (
              test.key === 'push'
            ) {
              return {
                ...test,
                required:
                  jobData.push_required_kg?.toString() ??
                  '',
              }
            }

            if (
              test.key === 'pull'
            ) {
              return {
                ...test,
                required:
                  jobData.pull_required_kg?.toString() ??
                  '',
              }
            }

            return test
          })
        )
      }
    }

    setLoading(false)
  }

  function updateTest(
    key: string,
    field: keyof TestRow,
    value: string
  ) {
    setTests(
      tests.map((test) =>
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
    measured: string,
    required: string
  ) {
    const measuredValue =
      Number(measured)

    const requiredValue =
      Number(required)

    if (
      !measured ||
      !required ||
      requiredValue <= 0
    ) {
      return 'not_tested'
    }

    const ratio =
      measuredValue /
      requiredValue

    if (ratio >= 1) {
      return 'pass'
    }

    if (ratio >= 0.85) {
      return 'borderline'
    }

    return 'fail'
  }

  const summary = useMemo(() => {
    const results =
      tests.map((test) =>
        classify(
          test.measured,
          test.required
        )
      )

    return {
      pass:
        results.filter(
          (result) =>
            result === 'pass'
        ).length,

      borderline:
        results.filter(
          (result) =>
            result ===
            'borderline'
        ).length,

      fail:
        results.filter(
          (result) =>
            result === 'fail'
        ).length,
    }
  }, [tests])

  async function saveResults(
    event: FormEvent
  ) {
    event.preventDefault()

    if (!assessment)
      return

    setSaving(true)
    setError(null)

    await supabase
      .from('fce_results')
      .delete()
      .eq(
        'assessment_id',
        assessment.id
      )

    const rows = tests
      .filter(
        (test) =>
          test.measured ||
          test.notes
      )
      .map((test) => ({
        assessment_id:
          assessment.id,

        test_category:
          test.category,

        test_name:
          test.name,

        side:
          test.side ||
          null,

        measured_value:
          test.measured
            ? Number(
                test.measured
              )
            : null,

        required_value:
          test.required
            ? Number(
                test.required
              )
            : null,

        unit:
          test.unit,

        result:
          classify(
            test.measured,
            test.required
          ),

        pain_before:
          test.painBefore
            ? Number(
                test.painBefore
              )
            : null,

        pain_after:
          test.painAfter
            ? Number(
                test.painAfter
              )
            : null,

        notes:
          test.notes.trim() ||
          null,
      }))

    if (rows.length > 0) {
      const {
        error: insertError,
      } = await supabase
        .from('fce_results')
        .insert(rows)

      if (insertError) {
        setError(
          insertError.message
        )

        setSaving(false)
        return
      }
    }

    navigate(
      `/assessments/${assessment.id}/outcome`
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading FCE testing...
        </p>
      </div>
    )
  }

  if (
    error ||
    !assessment ||
    !worker
  ) {
    return (
      <div className="stack">
        <div className="error-message">
          {error ||
            'Assessment not found.'}
        </div>
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
            Physical Testing
          </h2>

          <p>
            {worker.first_name}{' '}
            {worker.last_name}
            {' • '}
            {worker.employee_number}

            {job && (
              <>
                {' • '}
                {job.title}
              </>
            )}
          </p>
        </div>

        <div className="assessment-status">
          <Activity size={17} />
          FCE Testing
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="assessment-progress">
        <div className="progress-step">
          <span>1</span>
          Setup
        </div>

        <div className="progress-line" />

        <div className="progress-step">
          <span>2</span>
          Screening
        </div>

        <div className="progress-line" />

        <div className="progress-step active">
          <span>3</span>
          Testing
        </div>

        <div className="progress-line" />

        <div className="progress-step">
          <span>4</span>
          Outcome
        </div>
      </div>

      <div className="fce-summary-grid">
        <div className="worker-summary-card">
          <Gauge size={20} />
          <span>Passed</span>
          <strong>
            {summary.pass}
          </strong>
        </div>

        <div className="worker-summary-card">
          <Scale size={20} />
          <span>Borderline</span>
          <strong>
            {summary.borderline}
          </strong>
        </div>

        <div className="worker-summary-card">
          <Activity size={20} />
          <span>Failed</span>
          <strong>
            {summary.fail}
          </strong>
        </div>

        <div className="worker-summary-card">
          <Dumbbell size={20} />
          <span>Job</span>
          <strong>
            {job?.title ??
              'Not assigned'}
          </strong>
        </div>
      </div>

      <form
        className="stack"
        onSubmit={saveResults}
      >
        <section className="panel assessment-section">
          <div className="assessment-section-title">
            <div className="profile-card-icon">
              <Hand size={20} />
            </div>

            <div>
              <h3>
                Strength & Material
                Handling
              </h3>

              <p>
                Enter measured capacity
                and compare it with job
                demand.
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Side</th>
                  <th>Measured</th>
                  <th>Required</th>
                  <th>Unit</th>
                  <th>Result</th>
                  <th>Pain before</th>
                  <th>Pain after</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {tests.map((test) => {
                  const result =
                    classify(
                      test.measured,
                      test.required
                    )

                  return (
                    <tr key={test.key}>
                      <td>
                        <strong>
                          {test.name}
                        </strong>

                        <div className="test-category">
                          {test.category}
                        </div>
                      </td>

                      <td>
                        {test.side ||
                          '—'}
                      </td>

                      <td>
                        <input
                          className="fce-input"
                          type="number"
                          step="0.1"
                          value={
                            test.measured
                          }
                          onChange={(
                            event
                          ) =>
                            updateTest(
                              test.key,
                              'measured',
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="fce-input"
                          type="number"
                          step="0.1"
                          value={
                            test.required
                          }
                          onChange={(
                            event
                          ) =>
                            updateTest(
                              test.key,
                              'required',
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </td>

                      <td>
                        {test.unit}
                      </td>

                      <td>
                        <span
                          className={`badge ${result}`}
                        >
                          {result
                            .split('_')
                            .join(' ')}
                        </span>
                      </td>

                      <td>
                        <input
                          className="fce-input small"
                          type="number"
                          min="0"
                          max="10"
                          value={
                            test.painBefore
                          }
                          onChange={(
                            event
                          ) =>
                            updateTest(
                              test.key,
                              'painBefore',
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="fce-input small"
                          type="number"
                          min="0"
                          max="10"
                          value={
                            test.painAfter
                          }
                          onChange={(
                            event
                          ) =>
                            updateTest(
                              test.key,
                              'painAfter',
                              event
                                .target
                                .value
                            )
                          }
                        />
                      </td>

                      <td>
                        <input
                          className="fce-notes-input"
                          value={
                            test.notes
                          }
                          onChange={(
                            event
                          ) =>
                            updateTest(
                              test.key,
                              'notes',
                              event
                                .target
                                .value
                            )
                          }
                          placeholder="Optional"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
            Exit
          </button>

          <button
            className="primary-button"
            disabled={saving}
          >
            {saving ? (
              <>
                <Save size={16} />
                Saving...
              </>
            ) : (
              <>
                <StepForward size={16} />
                Save & Continue
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
