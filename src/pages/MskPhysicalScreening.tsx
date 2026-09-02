import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Save,
  ShieldCheck,
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
}

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
}

type PhysicalFinding = {
  test_category: string
  test_name: string
  body_region: string
  side: string
  measured_value: string
  unit: string
  movement_quality: string
  pain_during_test: number | ''
  finding: string
  assessor_notes: string
}

const defaultTests: PhysicalFinding[] = [
  {
    test_category: 'mobility',
    test_name: 'Cervical active movement',
    body_region: 'neck',
    side: 'central',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'mobility',
    test_name: 'Thoracic movement',
    body_region: 'upper_back',
    side: 'central',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'mobility',
    test_name: 'Lumbar active movement',
    body_region: 'lower_back',
    side: 'central',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'upper_limb',
    test_name: 'Shoulder movement',
    body_region: 'shoulder_left',
    side: 'left',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'upper_limb',
    test_name: 'Shoulder movement',
    body_region: 'shoulder_right',
    side: 'right',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'upper_limb',
    test_name: 'Elbow / wrist functional movement',
    body_region: 'wrist_hand_left',
    side: 'left',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'upper_limb',
    test_name: 'Elbow / wrist functional movement',
    body_region: 'wrist_hand_right',
    side: 'right',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'lower_limb',
    test_name: 'Hip functional movement',
    body_region: 'hip_left',
    side: 'left',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'lower_limb',
    test_name: 'Hip functional movement',
    body_region: 'hip_right',
    side: 'right',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'lower_limb',
    test_name: 'Knee functional movement',
    body_region: 'knee_left',
    side: 'left',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'lower_limb',
    test_name: 'Knee functional movement',
    body_region: 'knee_right',
    side: 'right',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'lower_limb',
    test_name: 'Ankle / foot functional movement',
    body_region: 'ankle_foot_left',
    side: 'left',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'lower_limb',
    test_name: 'Ankle / foot functional movement',
    body_region: 'ankle_foot_right',
    side: 'right',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'functional',
    test_name: 'Squat',
    body_region: 'lower_back',
    side: 'bilateral',
    measured_value: '',
    unit: '',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
  {
    test_category: 'functional',
    test_name: 'Single-leg balance',
    body_region: 'lower_limb',
    side: 'bilateral',
    measured_value: '',
    unit: 'seconds',
    movement_quality: '',
    pain_during_test: '',
    finding: '',
    assessor_notes: '',
  },
]

export default function MskPhysicalScreening() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [screening, setScreening] =
    useState<Screening | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [findings, setFindings] =
    useState<PhysicalFinding[]>(
      defaultTests
    )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  async function loadData() {
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
        screening_status
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
      findingsResponse,
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
        .from('msk_physical_findings')
        .select(`
          test_category,
          test_name,
          body_region,
          side,
          measured_value,
          unit,
          movement_quality,
          pain_during_test,
          finding,
          assessor_notes
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

    if (findingsResponse.error) {
      setError(
        findingsResponse.error.message
      )
      setLoading(false)
      return
    }

    const existing =
      findingsResponse.data ?? []

    if (existing.length > 0) {
      setFindings(
        defaultTests.map(
          (defaultTest) => {
            const found =
              existing.find(
                (item) =>
                  item.test_name ===
                    defaultTest.test_name &&
                  item.body_region ===
                    defaultTest.body_region &&
                  item.side ===
                    defaultTest.side
              )

            if (!found) {
              return defaultTest
            }

            return {
              test_category:
                found.test_category ??
                defaultTest.test_category,

              test_name:
                found.test_name ??
                defaultTest.test_name,

              body_region:
                found.body_region ??
                defaultTest.body_region,

              side:
                found.side ??
                defaultTest.side,

              measured_value:
                found.measured_value ===
                  null ||
                found.measured_value ===
                  undefined
                  ? ''
                  : String(
                      found.measured_value
                    ),

              unit:
                found.unit ?? '',

              movement_quality:
                found.movement_quality ??
                '',

              pain_during_test:
                found.pain_during_test ??
                '',

              finding:
                found.finding ?? '',

              assessor_notes:
                found.assessor_notes ??
                '',
            }
          }
        )
      )
    }

    setLoading(false)
  }

  function updateFinding(
    index: number,
    updates: Partial<PhysicalFinding>
  ) {
    setFindings((current) =>
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

  const significantDeficits =
    useMemo(() => {
      return findings.filter(
        (item) =>
          item.finding ===
          'significant_deficit'
      ).length
    }, [findings])

  const moderateDeficits =
    useMemo(() => {
      return findings.filter(
        (item) =>
          item.finding ===
          'moderate_deficit'
      ).length
    }, [findings])

  const painDuringTesting =
    useMemo(() => {
      return findings.filter(
        (item) =>
          typeof item.pain_during_test ===
            'number' &&
          item.pain_during_test > 0
      ).length
    }, [findings])

  const poorMovement =
    useMemo(() => {
      return findings.filter(
        (item) =>
          item.movement_quality ===
            'poor' ||
          item.movement_quality ===
            'unable'
      ).length
    }, [findings])

  async function saveFindings() {
    if (!id) {
      return false
    }

    setSaving(true)
    setError(null)

    const {
      error: deleteError,
    } = await supabase
      .from(
        'msk_physical_findings'
      )
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
      return false
    }

    const rows = findings
      .filter(
        (item) =>
          item.finding ||
          item.movement_quality ||
          item.pain_during_test !==
            '' ||
          item.measured_value ||
          item.assessor_notes
      )
      .map((item) => ({
        screening_id: id,
        test_category:
          item.test_category,
        test_name:
          item.test_name,
        body_region:
          item.body_region,
        side:
          item.side,
        measured_value:
          item.measured_value
            ? Number(
                item.measured_value
              )
            : null,
        unit:
          item.unit || null,
        movement_quality:
          item.movement_quality ||
          null,
        pain_during_test:
          item.pain_during_test === ''
            ? null
            : Number(
                item.pain_during_test
              ),
        finding:
          item.finding || null,
        assessor_notes:
          item.assessor_notes ||
          null,
      }))

    if (rows.length > 0) {
      const {
        error: insertError,
      } = await supabase
        .from(
          'msk_physical_findings'
        )
        .insert(rows)

      if (insertError) {
        setError(
          insertError.message
        )
        setSaving(false)
        return false
      }
    }

    setSaving(false)
    return true
  }

  async function saveAndContinue() {
    const success =
      await saveFindings()

    if (!success) {
      return
    }

    navigate(
      `/msk-screenings/${id}/risk`
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
          Loading physical
          screening...
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
            Physical Screening
          </h1>

          <p>
            Capture observable
            movement, pain response
            and physical deficits to
            support preventive
            decision-making.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate(
              `/msk-screenings/${id}`
            )
          }
        >
          <ArrowLeft size={16} />
          Back to Symptoms
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="fce-summary-row">

        <div>
          <Activity size={18} />
          <span>WORKER</span>

          <strong>
            {worker
              ? `${worker.first_name} ${worker.last_name}`
              : 'Unknown'}
          </strong>
        </div>

        <div>
          <AlertTriangle size={18} />
          <span>
            SIGNIFICANT DEFICITS
          </span>

          <strong>
            {significantDeficits}
          </strong>
        </div>

        <div>
          <ShieldCheck size={18} />
          <span>
            MODERATE DEFICITS
          </span>

          <strong>
            {moderateDeficits}
          </strong>
        </div>

        <div>
          <Activity size={18} />
          <span>
            PAINFUL TESTS
          </span>

          <strong>
            {painDuringTesting}
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
              Current worker and
              screening information.
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
              Current Status
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
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Physical Findings
            </h2>

            <p>
              Only record findings
              that were actually
              assessed. Do not infer a
              deficit from symptoms
              alone.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gap: 16,
          }}
        >
          {findings.map(
            (
              finding,
              index
            ) => (
              <div
                key={`${finding.test_name}-${finding.body_region}-${finding.side}`}
                style={{
                  border:
                    '1px solid var(--border-color, #e5e7eb)',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div>
                  <strong>
                    {
                      finding.test_name
                    }
                  </strong>

                  <p
                    style={{
                      marginTop: 4,
                    }}
                  >
                    {formatLabel(
                      finding.body_region
                    )}
                    {' · '}
                    {formatLabel(
                      finding.side
                    )}
                  </p>
                </div>

                <div
                  className="form-grid"
                  style={{
                    marginTop: 14,
                  }}
                >

                  <label>
                    <span>
                      Finding
                    </span>

                    <select
                      value={
                        finding.finding
                      }
                      onChange={(
                        event
                      ) =>
                        updateFinding(
                          index,
                          {
                            finding:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                    >
                      <option value="">
                        Not recorded
                      </option>

                      <option value="normal">
                        Normal
                      </option>

                      <option value="mild_deficit">
                        Mild Deficit
                      </option>

                      <option value="moderate_deficit">
                        Moderate Deficit
                      </option>

                      <option value="significant_deficit">
                        Significant Deficit
                      </option>

                      <option value="not_tested">
                        Not Tested
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>
                      Movement Quality
                    </span>

                    <select
                      value={
                        finding.movement_quality
                      }
                      onChange={(
                        event
                      ) =>
                        updateFinding(
                          index,
                          {
                            movement_quality:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                    >
                      <option value="">
                        Not recorded
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
                      Pain During Test
                      (0–10)
                    </span>

                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={
                        finding.pain_during_test
                      }
                      onChange={(
                        event
                      ) =>
                        updateFinding(
                          index,
                          {
                            pain_during_test:
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
                      Measured Value
                    </span>

                    <input
                      type="number"
                      step="any"
                      value={
                        finding.measured_value
                      }
                      onChange={(
                        event
                      ) =>
                        updateFinding(
                          index,
                          {
                            measured_value:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder="Optional"
                    />
                  </label>

                  <label>
                    <span>
                      Unit
                    </span>

                    <input
                      value={
                        finding.unit
                      }
                      onChange={(
                        event
                      ) =>
                        updateFinding(
                          index,
                          {
                            unit:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder="e.g. degrees, seconds, cm"
                    />
                  </label>

                </div>

                <label
                  style={{
                    display: 'block',
                    marginTop: 14,
                  }}
                >
                  <span>
                    Assessor Notes
                  </span>

                  <textarea
                    rows={3}
                    value={
                      finding.assessor_notes
                    }
                    onChange={(
                      event
                    ) =>
                      updateFinding(
                        index,
                        {
                          assessor_notes:
                            event.target
                              .value,
                        }
                      )
                    }
                    placeholder="Movement pattern, compensation, asymmetry, limitation or other relevant finding"
                  />
                </label>
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
              Physical Screening Snapshot
            </h2>

            <p>
              Summary of findings
              recorded during this
              screen.
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
            <AlertTriangle size={18} />
            <span>
              SIGNIFICANT
            </span>

            <strong>
              {significantDeficits}
            </strong>
          </div>

          <div>
            <ShieldCheck size={18} />
            <span>
              MODERATE
            </span>

            <strong>
              {moderateDeficits}
            </strong>
          </div>

          <div>
            <Activity size={18} />
            <span>
              PAINFUL TESTS
            </span>

            <strong>
              {painDuringTesting}
            </strong>
          </div>

          <div>
            <Activity size={18} />
            <span>
              POOR / UNABLE
            </span>

            <strong>
              {poorMovement}
            </strong>
          </div>
        </div>

        <p
          style={{
            marginTop: 18,
            marginBottom: 0,
          }}
        >
          These findings support the
          preventive risk profile but
          should not be treated as an
          automated diagnosis or
          fitness determination.
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
              Save Physical Screen
            </h2>

            <p
              style={{
                marginBottom: 0,
              }}
            >
              Save objective findings
              and continue to risk
              profiling.
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
              onClick={
                saveFindings
              }
              disabled={saving}
            >
              <Save size={16} />

              {saving
                ? 'Saving...'
                : 'Save Findings'}
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
