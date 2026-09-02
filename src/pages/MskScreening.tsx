import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
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
  useParams,
} from 'react-router-dom'

import { supabase } from '../lib/supabase'

type Screening = {
  id: string
  worker_id: string
  screening_date: string
  screening_type: string
  screening_status: string
  current_msk_complaint: boolean
}

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
}

type SymptomRow = {
  body_region: string
  symptoms_present: boolean
  pain_score: number | ''
  symptom_frequency: string
  symptom_duration: string
  work_related: boolean
  aggravated_by_work: boolean
  affects_work_performance: boolean
  notes: string
}

const bodyRegions = [
  {
    key: 'neck',
    label: 'Neck',
  },
  {
    key: 'upper_back',
    label: 'Upper Back',
  },
  {
    key: 'lower_back',
    label: 'Lower Back',
  },
  {
    key: 'shoulder_left',
    label: 'Left Shoulder',
  },
  {
    key: 'shoulder_right',
    label: 'Right Shoulder',
  },
  {
    key: 'elbow_left',
    label: 'Left Elbow',
  },
  {
    key: 'elbow_right',
    label: 'Right Elbow',
  },
  {
    key: 'wrist_hand_left',
    label: 'Left Wrist / Hand',
  },
  {
    key: 'wrist_hand_right',
    label: 'Right Wrist / Hand',
  },
  {
    key: 'hip_left',
    label: 'Left Hip',
  },
  {
    key: 'hip_right',
    label: 'Right Hip',
  },
  {
    key: 'knee_left',
    label: 'Left Knee',
  },
  {
    key: 'knee_right',
    label: 'Right Knee',
  },
  {
    key: 'ankle_foot_left',
    label: 'Left Ankle / Foot',
  },
  {
    key: 'ankle_foot_right',
    label: 'Right Ankle / Foot',
  },
]

function emptySymptom(
  bodyRegion: string
): SymptomRow {
  return {
    body_region: bodyRegion,
    symptoms_present: false,
    pain_score: '',
    symptom_frequency: '',
    symptom_duration: '',
    work_related: false,
    aggravated_by_work: false,
    affects_work_performance: false,
    notes: '',
  }
}

export default function MskScreening() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [screening, setScreening] =
    useState<Screening | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [symptoms, setSymptoms] =
    useState<SymptomRow[]>(
      bodyRegions.map((region) =>
        emptySymptom(region.key)
      )
    )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadScreening()
    }
  }, [id])

  async function loadScreening() {
    if (!id) {
      return
    }

    setLoading(true)
    setError(null)

    const {
      data: screeningData,
      error: screeningError,
    } = await supabase
      .from('msk_screenings')
      .select(`
        id,
        worker_id,
        screening_date,
        screening_type,
        screening_status,
        current_msk_complaint
      `)
      .eq('id', id)
      .single()

    if (
      screeningError ||
      !screeningData
    ) {
      setError(
        screeningError?.message ||
          'MSK screening could not be loaded.'
      )
      setLoading(false)
      return
    }

    setScreening(
      screeningData as Screening
    )

    const [
      workerResponse,
      symptomsResponse,
    ] = await Promise.all([
      supabase
        .from('workers')
        .select(`
          id,
          employee_number,
          first_name,
          last_name
        `)
        .eq(
          'id',
          screeningData.worker_id
        )
        .single(),

      supabase
        .from('msk_symptoms')
        .select(`
          body_region,
          symptoms_present,
          pain_score,
          symptom_frequency,
          symptom_duration,
          work_related,
          aggravated_by_work,
          affects_work_performance,
          notes
        `)
        .eq(
          'screening_id',
          id
        ),
    ])

    if (workerResponse.error) {
      setError(
        workerResponse.error.message
      )
      setLoading(false)
      return
    }

    setWorker(
      workerResponse.data as Worker
    )

    if (symptomsResponse.error) {
      setError(
        symptomsResponse.error.message
      )
      setLoading(false)
      return
    }

    const existing =
      symptomsResponse.data ?? []

    if (existing.length > 0) {
      setSymptoms(
        bodyRegions.map(
          (region) => {
            const found =
              existing.find(
                (item) =>
                  item.body_region ===
                  region.key
              )

            if (!found) {
              return emptySymptom(
                region.key
              )
            }

            return {
              body_region:
                found.body_region,

              symptoms_present:
                found.symptoms_present,

              pain_score:
                found.pain_score ??
                '',

              symptom_frequency:
                found.symptom_frequency ??
                '',

              symptom_duration:
                found.symptom_duration ??
                '',

              work_related:
                found.work_related,

              aggravated_by_work:
                found.aggravated_by_work,

              affects_work_performance:
                found.affects_work_performance,

              notes:
                found.notes ?? '',
            }
          }
        )
      )
    }

    setLoading(false)
  }

  function updateSymptom(
    index: number,
    updates: Partial<SymptomRow>
  ) {
    setSymptoms((current) =>
      current.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                ...updates,
              }
            : item
      )
    )
  }

  const symptomaticCount =
    useMemo(() => {
      return symptoms.filter(
        (item) =>
          item.symptoms_present
      ).length
    }, [symptoms])

  const workRelatedCount =
    useMemo(() => {
      return symptoms.filter(
        (item) =>
          item.symptoms_present &&
          (
            item.work_related ||
            item.aggravated_by_work
          )
      ).length
    }, [symptoms])

  const workImpactCount =
    useMemo(() => {
      return symptoms.filter(
        (item) =>
          item.symptoms_present &&
          item.affects_work_performance
      ).length
    }, [symptoms])

  const highPainCount =
    useMemo(() => {
      return symptoms.filter(
        (item) =>
          item.symptoms_present &&
          typeof item.pain_score ===
            'number' &&
          item.pain_score >= 7
      ).length
    }, [symptoms])

  async function saveSymptoms() {
    if (!id) {
      return
    }

    setSaving(true)
    setError(null)

    const {
      error: deleteError,
    } = await supabase
      .from('msk_symptoms')
      .delete()
      .eq(
        'screening_id',
        id
      )

    if (deleteError) {
      setError(
        deleteError.message
      )
      setSaving(false)
      return
    }

    const rows = symptoms.map(
      (item) => ({
        screening_id: id,
        body_region:
          item.body_region,
        symptoms_present:
          item.symptoms_present,
        pain_score:
          item.symptoms_present &&
          item.pain_score !== ''
            ? Number(
                item.pain_score
              )
            : null,
        symptom_frequency:
          item.symptoms_present &&
          item.symptom_frequency
            ? item.symptom_frequency
            : null,
        symptom_duration:
          item.symptoms_present &&
          item.symptom_duration
            ? item.symptom_duration
            : null,
        work_related:
          item.symptoms_present
            ? item.work_related
            : false,
        aggravated_by_work:
          item.symptoms_present
            ? item.aggravated_by_work
            : false,
        affects_work_performance:
          item.symptoms_present
            ? item.affects_work_performance
            : false,
        notes:
          item.symptoms_present &&
          item.notes
            ? item.notes
            : null,
      })
    )

    const {
      error: insertError,
    } = await supabase
      .from('msk_symptoms')
      .insert(rows)

    if (insertError) {
      setError(
        insertError.message
      )
      setSaving(false)
      return
    }

    const {
      error: screeningError,
    } = await supabase
      .from('msk_screenings')
      .update({
        current_msk_complaint:
          symptomaticCount > 0,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        id
      )

    if (screeningError) {
      setError(
        screeningError.message
      )
      setSaving(false)
      return
    }

    setScreening(
      (current) =>
        current
          ? {
              ...current,
              current_msk_complaint:
                symptomaticCount > 0,
            }
          : current
    )

    setSaving(false)
  }

  async function saveAndContinue() {
    await saveSymptoms()
  }

  function regionLabel(
    regionKey: string
  ) {
    return (
      bodyRegions.find(
        (region) =>
          region.key === regionKey
      )?.label ||
      regionKey
        .split('_')
        .join(' ')
    )
  }

  function formatLabel(
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
          Loading MSK screening...
        </p>
      </div>
    )
  }

  if (!screening) {
    return (
      <div className="stack">
        <div className="error-message">
          {error ||
            'Screening not found.'}
        </div>
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
            Body-Region Screening
          </h1>

          <p>
            Identify early symptoms
            and work-related
            aggravating factors before
            they progress into more
            serious musculoskeletal
            problems.
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
          Screening Register
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="fce-summary-row">

        <div>
          <UserRound size={18} />

          <span>
            WORKER
          </span>

          <strong>
            {worker
              ? `${worker.first_name} ${worker.last_name}`
              : 'Unknown'}
          </strong>
        </div>

        <div>
          <HeartPulse size={18} />

          <span>
            SYMPTOMATIC REGIONS
          </span>

          <strong>
            {symptomaticCount}
          </strong>
        </div>

        <div>
          <Activity size={18} />

          <span>
            WORK RELATED
          </span>

          <strong>
            {workRelatedCount}
          </strong>
        </div>

        <div>
          <AlertTriangle size={18} />

          <span>
            WORK IMPACT
          </span>

          <strong>
            {workImpactCount}
          </strong>
        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2>
              Screening Context
            </h2>

            <p>
              Current screening
              information.
            </p>
          </div>

        </div>

        <div
          className="form-grid"
          style={{
            marginTop: 20,
          }}
        >

          <div>
            <strong>
              Employee Number
            </strong>

            <p>
              {worker
                ?.employee_number ||
                'Not recorded'}
            </p>
          </div>

          <div>
            <strong>
              Screening Type
            </strong>

            <p>
              {formatLabel(
                screening.screening_type
              )}
            </p>
          </div>

          <div>
            <strong>
              Screening Date
            </strong>

            <p>
              {
                screening.screening_date
              }
            </p>
          </div>

          <div>
            <strong>
              Screening Status
            </strong>

            <p>
              {formatLabel(
                screening.screening_status
              )}
            </p>
          </div>

        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <HeartPulse size={20} />
          </div>

          <div>
            <h2>
              Body-Region Symptoms
            </h2>

            <p>
              Record current
              discomfort, frequency,
              work aggravation and
              effect on work
              performance.
            </p>
          </div>

        </div>

        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gap: 14,
          }}
        >

          {symptoms.map(
            (
              symptom,
              index
            ) => (
              <div
                key={
                  symptom.body_region
                }
                style={{
                  border:
                    '1px solid var(--border-color, #e5e7eb)',
                  borderRadius: 10,
                  padding: 16,
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    gap: 12,
                    flexWrap:
                      'wrap',
                  }}
                >

                  <div>
                    <strong>
                      {regionLabel(
                        symptom.body_region
                      )}
                    </strong>

                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 4,
                      }}
                    >
                      Current symptoms
                      in this region
                    </div>
                  </div>

                  <label
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      gap: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        symptom.symptoms_present
                      }
                      onChange={(
                        event
                      ) =>
                        updateSymptom(
                          index,
                          {
                            symptoms_present:
                              event
                                .target
                                .checked,
                          }
                        )
                      }
                    />

                    Symptoms Present
                  </label>

                </div>

                {symptom.symptoms_present && (
                  <div
                    style={{
                      marginTop: 16,
                    }}
                  >

                    <div className="form-grid">

                      <label>
                        <span>
                          Pain /
                          Discomfort
                          (0–10)
                        </span>

                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={
                            symptom.pain_score
                          }
                          onChange={(
                            event
                          ) =>
                            updateSymptom(
                              index,
                              {
                                pain_score:
                                  event
                                    .target
                                    .value ===
                                  ''
                                    ? ''
                                    : Number(
                                        event
                                          .target
                                          .value
                                      ),
                              }
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>
                          Frequency
                        </span>

                        <select
                          value={
                            symptom.symptom_frequency
                          }
                          onChange={(
                            event
                          ) =>
                            updateSymptom(
                              index,
                              {
                                symptom_frequency:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                        >
                          <option value="">
                            Select
                          </option>

                          <option value="rare">
                            Rare
                          </option>

                          <option value="occasional">
                            Occasional
                          </option>

                          <option value="frequent">
                            Frequent
                          </option>

                          <option value="daily">
                            Daily
                          </option>

                          <option value="constant">
                            Constant
                          </option>
                        </select>
                      </label>

                      <label>
                        <span>
                          Symptom
                          Duration
                        </span>

                        <input
                          value={
                            symptom.symptom_duration
                          }
                          onChange={(
                            event
                          ) =>
                            updateSymptom(
                              index,
                              {
                                symptom_duration:
                                  event
                                    .target
                                    .value,
                              }
                            )
                          }
                          placeholder="e.g. 2 weeks, 3 months"
                        />
                      </label>

                    </div>

                    <div
                      style={{
                        marginTop: 14,
                        display:
                          'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 10,
                      }}
                    >

                      <BooleanToggle
                        label="Worker relates symptoms to work"
                        checked={
                          symptom.work_related
                        }
                        onChange={(
                          value
                        ) =>
                          updateSymptom(
                            index,
                            {
                              work_related:
                                value,
                            }
                          )
                        }
                      />

                      <BooleanToggle
                        label="Symptoms aggravated by work"
                        checked={
                          symptom.aggravated_by_work
                        }
                        onChange={(
                          value
                        ) =>
                          updateSymptom(
                            index,
                            {
                              aggravated_by_work:
                                value,
                            }
                          )
                        }
                      />

                      <BooleanToggle
                        label="Affects work performance"
                        checked={
                          symptom.affects_work_performance
                        }
                        onChange={(
                          value
                        ) =>
                          updateSymptom(
                            index,
                            {
                              affects_work_performance:
                                value,
                            }
                          )
                        }
                      />

                    </div>

                    <label
                      style={{
                        display:
                          'block',
                        marginTop: 14,
                      }}
                    >
                      <span>
                        Notes
                      </span>

                      <textarea
                        value={
                          symptom.notes
                        }
                        onChange={(
                          event
                        ) =>
                          updateSymptom(
                            index,
                            {
                              notes:
                                event
                                  .target
                                  .value,
                            }
                          )
                        }
                        rows={3}
                        placeholder="Aggravating activities, pattern, relevant observations or worker report"
                      />
                    </label>

                  </div>
                )}

              </div>
            )
          )}

        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <AlertTriangle size={20} />
          </div>

          <div>
            <h2>
              Screening Snapshot
            </h2>

            <p>
              Early symptom
              indicators identified
              during this screen.
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
            <HeartPulse size={18} />

            <span>
              SYMPTOMATIC
            </span>

            <strong>
              {symptomaticCount}
            </strong>
          </div>

          <div>
            <Activity size={18} />

            <span>
              WORK RELATED
            </span>

            <strong>
              {workRelatedCount}
            </strong>
          </div>

          <div>
            <AlertTriangle size={18} />

            <span>
              WORK IMPACT
            </span>

            <strong>
              {workImpactCount}
            </strong>
          </div>

          <div>
            <ShieldCheck size={18} />

            <span>
              PAIN ≥ 7
            </span>

            <strong>
              {highPainCount}
            </strong>
          </div>

        </div>

        <p
          style={{
            marginTop: 18,
            marginBottom: 0,
          }}
        >
          These counts are screening
          indicators only. They do not
          diagnose an injury or predict
          that an injury will occur.
          They help determine where
          further physical screening
          and preventive attention may
          be warranted.
        </p>

      </div>

      <div className="panel">

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >

          <div>
            <h2>
              Save Body-Region Screen
            </h2>

            <p
              style={{
                marginBottom: 0,
              }}
            >
              Save current symptom
              findings before moving
              to physical screening.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >

            <button
              className="secondary-button"
              onClick={saveSymptoms}
              disabled={saving}
            >
              <Save size={16} />

              {saving
                ? 'Saving...'
                : 'Save Symptoms'}
            </button>

            <button
              className="primary-button"
              onClick={
                saveAndContinue
              }
              disabled={saving}
            >
              <CheckCircle2
                size={16}
              />

              Save & Continue
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}

type BooleanToggleProps = {
  label: string
  checked: boolean
  onChange: (
    value: boolean
  ) => void
}

function BooleanToggle({
  label,
  checked,
  onChange,
}: BooleanToggleProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        border:
          '1px solid var(--border-color, #e5e7eb)',
        padding: 11,
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
