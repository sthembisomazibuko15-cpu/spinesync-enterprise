import {
  Activity,
  AlertTriangle,
  ArrowLeft,
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
  useParams,
} from 'react-router-dom'

import { supabase } from '../lib/supabase'

type Screening = {
  id: string
  organisation_id: string
  worker_id: string
  screening_date: string
  overall_risk_level: string | null
  risk_summary: string | null
  preventive_recommendations: string | null
  intervention_required: boolean
  reassessment_required: boolean
  recommended_rescreen_date: string | null
  screening_status: string
}

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
}

type RiskResult = {
  risk_level: string | null
  contributing_factors: string | null
  recommended_action: string | null
}

type Symptom = {
  body_region: string
  symptoms_present: boolean
  pain_score: number | null
  work_related: boolean
  aggravated_by_work: boolean
  affects_work_performance: boolean
}

type Intervention = {
  id: string
  intervention_type: string
  body_region: string | null
  intervention_description: string
  start_date: string
  target_completion_date: string | null
  intervention_status: string
  outcome_notes: string | null
}

const interventionTypes = [
  {
    value: 'preventive_exercise',
    label: 'Preventive Exercise Programme',
  },
  {
    value: 'ergonomic_review',
    label: 'Ergonomic Review',
  },
  {
    value: 'task_modification',
    label: 'Task Modification',
  },
  {
    value: 'worker_education',
    label: 'Worker Education',
  },
  {
    value: 'movement_training',
    label: 'Movement / Technique Training',
  },
  {
    value: 'workplace_control',
    label: 'Workplace Exposure Control',
  },
  {
    value: 'clinical_review',
    label: 'Clinical Review',
  },
  {
    value: 'monitoring',
    label: 'Monitoring / Re-screening',
  },
]

const bodyRegions = [
  {
    value: '',
    label: 'Whole Worker / General',
  },
  {
    value: 'neck',
    label: 'Neck',
  },
  {
    value: 'upper_back',
    label: 'Upper Back',
  },
  {
    value: 'lower_back',
    label: 'Lower Back',
  },
  {
    value: 'shoulder_left',
    label: 'Left Shoulder',
  },
  {
    value: 'shoulder_right',
    label: 'Right Shoulder',
  },
  {
    value: 'elbow_left',
    label: 'Left Elbow',
  },
  {
    value: 'elbow_right',
    label: 'Right Elbow',
  },
  {
    value: 'wrist_hand_left',
    label: 'Left Wrist / Hand',
  },
  {
    value: 'wrist_hand_right',
    label: 'Right Wrist / Hand',
  },
  {
    value: 'hip_left',
    label: 'Left Hip',
  },
  {
    value: 'hip_right',
    label: 'Right Hip',
  },
  {
    value: 'knee_left',
    label: 'Left Knee',
  },
  {
    value: 'knee_right',
    label: 'Right Knee',
  },
  {
    value: 'ankle_foot_left',
    label: 'Left Ankle / Foot',
  },
  {
    value: 'ankle_foot_right',
    label: 'Right Ankle / Foot',
  },
]

export default function MskIntervention() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [screening, setScreening] =
    useState<Screening | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [riskResult, setRiskResult] =
    useState<RiskResult | null>(null)

  const [symptoms, setSymptoms] =
    useState<Symptom[]>([])

  const [
    existingInterventionId,
    setExistingInterventionId,
  ] = useState<string | null>(null)

  const [
    interventionType,
    setInterventionType,
  ] = useState(
    'preventive_exercise'
  )

  const [bodyRegion, setBodyRegion] =
    useState('')

  const [
    interventionDescription,
    setInterventionDescription,
  ] = useState('')

  const [startDate, setStartDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 10)
    )

  const [
    targetCompletionDate,
    setTargetCompletionDate,
  ] = useState('')

  const [
    interventionStatus,
    setInterventionStatus,
  ] = useState('planned')

  const [outcomeNotes, setOutcomeNotes] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [savedMessage, setSavedMessage] =
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
        organisation_id,
        worker_id,
        screening_date,
        overall_risk_level,
        risk_summary,
        preventive_recommendations,
        intervention_required,
        reassessment_required,
        recommended_rescreen_date,
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

    const typedScreening =
      screeningData as Screening

    setScreening(typedScreening)

    const [
      workerResponse,
      riskResponse,
      symptomsResponse,
      interventionResponse,
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
          typedScreening.worker_id
        )
        .single(),

      supabase
        .from('msk_risk_results')
        .select(`
          risk_level,
          contributing_factors,
          recommended_action
        `)
        .eq(
          'screening_id',
          id
        )
        .eq(
          'body_region',
          'overall'
        )
        .maybeSingle(),

      supabase
        .from('msk_symptoms')
        .select(`
          body_region,
          symptoms_present,
          pain_score,
          work_related,
          aggravated_by_work,
          affects_work_performance
        `)
        .eq(
          'screening_id',
          id
        ),

      supabase
        .from('msk_interventions')
        .select(`
          id,
          intervention_type,
          body_region,
          intervention_description,
          start_date,
          target_completion_date,
          intervention_status,
          outcome_notes
        `)
        .eq(
          'screening_id',
          id
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle(),
    ])

    if (
      workerResponse.error ||
      !workerResponse.data
    ) {
      setError(
        workerResponse.error?.message ||
          'Worker could not be loaded.'
      )

      setLoading(false)
      return
    }

    setWorker(
      workerResponse.data as Worker
    )

    if (riskResponse.error) {
      setError(
        riskResponse.error.message
      )

      setLoading(false)
      return
    }

    if (riskResponse.data) {
      setRiskResult(
        riskResponse.data as RiskResult
      )
    }

    if (symptomsResponse.error) {
      setError(
        symptomsResponse.error.message
      )

      setLoading(false)
      return
    }

    setSymptoms(
      (symptomsResponse.data ??
        []) as Symptom[]
    )

    if (
      interventionResponse.error
    ) {
      setError(
        interventionResponse.error
          .message
      )

      setLoading(false)
      return
    }

    if (interventionResponse.data) {
      const existing =
        interventionResponse.data as Intervention

      setExistingInterventionId(
        existing.id
      )

      setInterventionType(
        existing.intervention_type
      )

      setBodyRegion(
        existing.body_region || ''
      )

      setInterventionDescription(
        existing.intervention_description ||
          ''
      )

      setStartDate(
        existing.start_date
      )

      setTargetCompletionDate(
        existing.target_completion_date ||
          ''
      )

      setInterventionStatus(
        existing.intervention_status
      )

      setOutcomeNotes(
        existing.outcome_notes || ''
      )
    }

    setLoading(false)
  }

  const symptomaticRegions =
    useMemo(() => {
      return symptoms.filter(
        (item) =>
          item.symptoms_present
      )
    }, [symptoms])

  const workRelatedRegions =
    useMemo(() => {
      return symptomaticRegions.filter(
        (item) =>
          item.work_related ||
          item.aggravated_by_work
      )
    }, [symptomaticRegions])

  const workImpactRegions =
    useMemo(() => {
      return symptomaticRegions.filter(
        (item) =>
          item.affects_work_performance
      )
    }, [symptomaticRegions])

  const highestPainScore =
    useMemo(() => {
      if (
        symptomaticRegions.length ===
        0
      ) {
        return 0
      }

      return Math.max(
        ...symptomaticRegions.map(
          (item) =>
            item.pain_score ?? 0
        )
      )
    }, [symptomaticRegions])

  function generateDraftPlan() {
    const parts: string[] = []

    if (
      symptomaticRegions.length > 0
    ) {
      parts.push(
        `Provide targeted preventive intervention for the worker's identified symptomatic region(s): ${symptomaticRegions
          .map((item) =>
            formatLabel(
              item.body_region
            )
          )
          .join(', ')}.`
      )
    }

    if (
      workRelatedRegions.length > 0
    ) {
      parts.push(
        'Review the work activities associated with symptom aggravation and identify practical exposure-reduction opportunities.'
      )
    }

    if (
      workImpactRegions.length > 0
    ) {
      parts.push(
        'Monitor the effect of symptoms on work performance and escalate for further clinical assessment if function deteriorates.'
      )
    }

    if (
      screening
        ?.preventive_recommendations
    ) {
      parts.push(
        screening.preventive_recommendations
      )
    }

    if (parts.length === 0) {
      parts.push(
        'Provide preventive MSK education, reinforce safe work practices and continue routine surveillance.'
      )
    }

    setInterventionDescription(
      parts.join(' ')
    )
  }

  async function saveIntervention() {
    if (
      !id ||
      !screening
    ) {
      return false
    }

    if (
      !interventionType
    ) {
      setError(
        'Please select an intervention type.'
      )
      return false
    }

    if (
      !interventionDescription.trim()
    ) {
      setError(
        'Please enter the intervention plan.'
      )
      return false
    }

    const {
      data: userData,
      error: userError,
    } =
      await supabase.auth.getUser()

    if (
      userError ||
      !userData.user
    ) {
      setError(
        userError?.message ||
          'Signed-in user could not be identified.'
      )
      return false
    }

    setSaving(true)
    setError(null)
    setSavedMessage(null)

    const payload = {
      organisation_id:
        screening.organisation_id,

      worker_id:
        screening.worker_id,

      screening_id: id,

      intervention_type:
        interventionType,

      body_region:
        bodyRegion || null,

      intervention_description:
        interventionDescription.trim(),

      start_date:
        startDate,

      target_completion_date:
        targetCompletionDate ||
        null,

      intervention_status:
        interventionStatus,

      outcome_notes:
        outcomeNotes.trim() ||
        null,

      updated_at:
        new Date().toISOString(),
    }

    if (
      existingInterventionId
    ) {
      const {
        error: updateError,
      } = await supabase
        .from('msk_interventions')
        .update(payload)
        .eq(
          'id',
          existingInterventionId
        )

      if (updateError) {
        setError(
          updateError.message
        )
        setSaving(false)
        return false
      }
    } else {
      const {
        data: createdData,
        error: insertError,
      } = await supabase
        .from('msk_interventions')
        .insert({
          ...payload,
          created_by:
            userData.user.id,
        })
        .select('id')
        .single()

      if (
        insertError ||
        !createdData
      ) {
        setError(
          insertError?.message ||
            'Intervention could not be created.'
        )

        setSaving(false)
        return false
      }

      setExistingInterventionId(
        createdData.id
      )
    }

    const {
      error:
        screeningUpdateError,
    } = await supabase
      .from('msk_screenings')
      .update({
        intervention_required: true,

        reassessment_required:
          true,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        id
      )

    if (
      screeningUpdateError
    ) {
      setError(
        screeningUpdateError.message
      )

      setSaving(false)
      return false
    }

    setScreening(
      (current) =>
        current
          ? {
              ...current,
              intervention_required:
                true,
              reassessment_required:
                true,
            }
          : current
    )

    setSavedMessage(
      'Preventive intervention saved successfully.'
    )

    setSaving(false)
    return true
  }

  async function saveAndReturn() {
    const success =
      await saveIntervention()

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
          Loading preventive
          intervention...
        </p>
      </div>
    )
  }

  if (
    !screening ||
    !worker
  ) {
    return (
      <div className="stack">
        <div className="error-message">
          {error ||
            'Intervention could not be loaded.'}
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
            Preventive Intervention
          </h1>

          <p>
            Convert identified MSK
            risk factors into a
            documented preventive
            action plan and follow-up
            pathway.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate(
              `/msk-screenings/${id}/risk`
            )
          }
        >
          <ArrowLeft size={16} />
          Risk Profile
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {savedMessage && (
        <div
          style={{
            padding: 14,
            border:
              '1px solid #d1d5db',
            borderRadius: 8,
          }}
        >
          <strong>
            {savedMessage}
          </strong>
        </div>
      )}

      <div className="fce-summary-row">

        <div>
          <UserRound size={18} />

          <span>
            WORKER
          </span>

          <strong>
            {worker.first_name}{' '}
            {worker.last_name}
          </strong>
        </div>

        <div>
          <ShieldCheck size={18} />

          <span>
            RISK PRIORITY
          </span>

          <strong>
            {screening.overall_risk_level
              ? formatLabel(
                  screening.overall_risk_level
                )
              : 'Not classified'}
          </strong>
        </div>

        <div>
          <HeartPulse size={18} />

          <span>
            SYMPTOM REGIONS
          </span>

          <strong>
            {
              symptomaticRegions.length
            }
          </strong>
        </div>

        <div>
          <AlertTriangle
            size={18}
          />

          <span>
            HIGHEST PAIN
          </span>

          <strong>
            {highestPainScore}/10
          </strong>
        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">
          <div className="assessment-section-icon">
            <Activity size={20} />
          </div>

          <div>
            <h2>
              Prevention Intelligence
            </h2>

            <p>
              Review the important
              findings before defining
              the intervention.
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
              {
                worker.employee_number
              }
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
              Work-related Regions
            </strong>

            <p>
              {
                workRelatedRegions.length
              }
            </p>
          </div>

          <div>
            <strong>
              Regions Affecting Work
            </strong>

            <p>
              {
                workImpactRegions.length
              }
            </p>
          </div>

        </div>

        {screening.risk_summary && (
          <div
            style={{
              marginTop: 18,
              padding: 16,
              border:
                '1px solid #d1d5db',
              borderRadius: 8,
            }}
          >
            <strong>
              Screening Summary
            </strong>

            <p
              style={{
                marginBottom: 0,
                marginTop: 8,
              }}
            >
              {
                screening.risk_summary
              }
            </p>
          </div>
        )}

        {riskResult
          ?.contributing_factors && (
          <div
            style={{
              marginTop: 14,
            }}
          >
            <strong>
              Contributing Factors
            </strong>

            <p>
              {
                riskResult.contributing_factors
              }
            </p>
          </div>
        )}

      </div>

      <div className="panel">

        <div className="assessment-section-title">
          <div className="assessment-section-icon">
            <HeartPulse size={20} />
          </div>

          <div>
            <h2>
              Symptomatic Regions
            </h2>

            <p>
              Target preventive
              attention to the
              worker's relevant body
              regions.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >

          {symptomaticRegions.length >
          0 ? (
            symptomaticRegions.map(
              (item) => (
                <span
                  key={
                    item.body_region
                  }
                  style={{
                    padding:
                      '8px 11px',
                    border:
                      '1px solid #d1d5db',
                    borderRadius: 20,
                  }}
                >
                  {formatLabel(
                    item.body_region
                  )}

                  {item.pain_score !==
                    null &&
                    ` · ${item.pain_score}/10`}
                </span>
              )
            )
          ) : (
            <p>
              No current symptomatic
              body regions were
              recorded.
            </p>
          )}

        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">
          <div className="assessment-section-icon">
            <ClipboardPlus
              size={20}
            />
          </div>

          <div>
            <h2>
              Intervention Plan
            </h2>

            <p>
              Define the preventive
              action to be delivered.
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
              Intervention Type
            </span>

            <select
              value={
                interventionType
              }
              onChange={(event) =>
                setInterventionType(
                  event.target.value
                )
              }
            >
              {interventionTypes.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>
              Body Region
            </span>

            <select
              value={bodyRegion}
              onChange={(event) =>
                setBodyRegion(
                  event.target.value
                )
              }
            >
              {bodyRegions.map(
                (item) => (
                  <option
                    key={
                      item.value ||
                      'general'
                    }
                    value={item.value}
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>
              Start Date
            </span>

            <input
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(
                  event.target.value
                )
              }
            />
          </label>

          <label>
            <span>
              Target Completion
              Date
            </span>

            <input
              type="date"
              value={
                targetCompletionDate
              }
              onChange={(event) =>
                setTargetCompletionDate(
                  event.target.value
                )
              }
            />
          </label>

          <label>
            <span>
              Intervention Status
            </span>

            <select
              value={
                interventionStatus
              }
              onChange={(event) =>
                setInterventionStatus(
                  event.target.value
                )
              }
            >
              <option value="planned">
                Planned
              </option>

              <option value="active">
                Active
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>
          </label>

        </div>

        <div
          style={{
            marginTop: 18,
          }}
        >
          <button
            className="secondary-button"
            onClick={
              generateDraftPlan
            }
          >
            Generate Draft Plan
          </button>
        </div>

        <label
          style={{
            display: 'block',
            marginTop: 18,
          }}
        >
          <span>
            Intervention Description
          </span>

          <textarea
            rows={7}
            value={
              interventionDescription
            }
            onChange={(event) =>
              setInterventionDescription(
                event.target.value
              )
            }
            placeholder="Describe the exercise, education, ergonomic, task modification or exposure-control intervention."
          />
        </label>

        <label
          style={{
            display: 'block',
            marginTop: 18,
          }}
        >
          <span>
            Outcome / Progress Notes
          </span>

          <textarea
            rows={4}
            value={outcomeNotes}
            onChange={(event) =>
              setOutcomeNotes(
                event.target.value
              )
            }
            placeholder="Complete later as the worker progresses through the intervention."
          />
        </label>

      </div>

      <div className="panel">

        <div className="assessment-section-title">
          <div className="assessment-section-icon">
            <CalendarDays size={20} />
          </div>

          <div>
            <h2>
              Follow-up
            </h2>

            <p>
              The intervention remains
              linked to the original
              MSK screening so future
              re-screening can measure
              change.
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
              Reassessment Required
            </strong>

            <p>
              {screening.reassessment_required
                ? 'Yes'
                : 'Will be activated when intervention is saved'}
            </p>
          </div>

          <div>
            <strong>
              Recommended Re-screen
            </strong>

            <p>
              {screening.recommended_rescreen_date ||
                'Not yet scheduled'}
            </p>
          </div>

        </div>

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
              Save Intervention
            </h2>

            <p
              style={{
                marginBottom: 0,
              }}
            >
              Save the preventive
              plan and link it to this
              worker's MSK screening.
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
                saveIntervention
              }
              disabled={saving}
            >
              <Save size={16} />

              {saving
                ? 'Saving...'
                : existingInterventionId
                ? 'Update Intervention'
                : 'Save Intervention'}
            </button>

            <button
              className="primary-button"
              onClick={
                saveAndReturn
              }
              disabled={saving}
            >
              <CheckCircle2
                size={16}
              />

              Save & Return to Risk
            </button>

          </div>

        </div>

      </div>

    </div>
  )
}
