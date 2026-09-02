import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  HeartPulse,
  Save,
  ShieldAlert,
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
  previous_msk_injury: boolean
  currently_receiving_treatment: boolean

  manual_handling_exposure: boolean
  repetitive_work_exposure: boolean
  awkward_posture_exposure: boolean
  prolonged_posture_exposure: boolean
  vibration_exposure: boolean
  overhead_work_exposure: boolean
  kneeling_squatting_exposure: boolean
  confined_space_exposure: boolean
  uneven_ground_exposure: boolean
  prolonged_walking_exposure: boolean
  prolonged_standing_exposure: boolean

  overall_risk_level: string | null
  risk_summary: string | null
  preventive_recommendations: string | null
  intervention_required: boolean
  reassessment_required: boolean
  recommended_rescreen_date: string | null
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
  job_code: string | null
  description: string | null
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

type Symptom = {
  body_region: string
  symptoms_present: boolean
  pain_score: number | null
  symptom_frequency: string | null
  work_related: boolean
  aggravated_by_work: boolean
  affects_work_performance: boolean
}

type PhysicalFinding = {
  body_region: string | null
  test_name: string
  movement_quality: string | null
  pain_during_test: number | null
  finding: string | null
}

type RiskLevel =
  | ''
  | 'low'
  | 'moderate'
  | 'high'
  | 'very_high'

export default function MskRiskProfile() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [screening, setScreening] =
    useState<Screening | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [jobProfile, setJobProfile] =
    useState<JobProfile | null>(null)

  const [symptoms, setSymptoms] =
    useState<Symptom[]>([])

  const [physicalFindings, setPhysicalFindings] =
    useState<PhysicalFinding[]>([])

  const [riskLevel, setRiskLevel] =
    useState<RiskLevel>('')

  const [riskSummary, setRiskSummary] =
    useState('')

  const [
    preventiveRecommendations,
    setPreventiveRecommendations,
  ] = useState('')

  const [
    interventionRequired,
    setInterventionRequired,
  ] = useState(false)

  const [
    reassessmentRequired,
    setReassessmentRequired,
  ] = useState(false)

  const [
    recommendedRescreenDate,
    setRecommendedRescreenDate,
  ] = useState('')

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
        worker_id,
        screening_date,
        screening_type,
        screening_status,
        current_msk_complaint,
        previous_msk_injury,
        currently_receiving_treatment,
        manual_handling_exposure,
        repetitive_work_exposure,
        awkward_posture_exposure,
        prolonged_posture_exposure,
        vibration_exposure,
        overhead_work_exposure,
        kneeling_squatting_exposure,
        confined_space_exposure,
        uneven_ground_exposure,
        prolonged_walking_exposure,
        prolonged_standing_exposure,
        overall_risk_level,
        risk_summary,
        preventive_recommendations,
        intervention_required,
        reassessment_required,
        recommended_rescreen_date
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

    setRiskLevel(
      (typedScreening.overall_risk_level ||
        '') as RiskLevel
    )

    setRiskSummary(
      typedScreening.risk_summary || ''
    )

    setPreventiveRecommendations(
      typedScreening.preventive_recommendations ||
        ''
    )

    setInterventionRequired(
      typedScreening.intervention_required
    )

    setReassessmentRequired(
      typedScreening.reassessment_required
    )

    setRecommendedRescreenDate(
      typedScreening.recommended_rescreen_date ||
        ''
    )

    const [
      workerResponse,
      symptomsResponse,
      physicalResponse,
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
        .eq(
          'id',
          typedScreening.worker_id
        )
        .single(),

      supabase
        .from('msk_symptoms')
        .select(`
          body_region,
          symptoms_present,
          pain_score,
          symptom_frequency,
          work_related,
          aggravated_by_work,
          affects_work_performance
        `)
        .eq(
          'screening_id',
          id
        ),

      supabase
        .from('msk_physical_findings')
        .select(`
          body_region,
          test_name,
          movement_quality,
          pain_during_test,
          finding
        `)
        .eq(
          'screening_id',
          id
        ),
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

    const typedWorker =
      workerResponse.data as Worker

    setWorker(typedWorker)

    if (symptomsResponse.error) {
      setError(
        symptomsResponse.error.message
      )
      setLoading(false)
      return
    }

    if (physicalResponse.error) {
      setError(
        physicalResponse.error.message
      )
      setLoading(false)
      return
    }

    setSymptoms(
      (symptomsResponse.data ??
        []) as Symptom[]
    )

    setPhysicalFindings(
      (physicalResponse.data ??
        []) as PhysicalFinding[]
    )

    if (typedWorker.job_profile_id) {
      const {
        data: jobData,
        error: jobError,
      } = await supabase
        .from('job_profiles')
        .select(`
          id,
          job_code,
          description,
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
        .single()

      if (!jobError && jobData) {
        setJobProfile(
          jobData as JobProfile
        )
      }
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

  const highPainRegions =
    useMemo(() => {
      return symptomaticRegions.filter(
        (item) =>
          (item.pain_score ?? 0) >= 7
      )
    }, [symptomaticRegions])

  const workAggravatedRegions =
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

  const moderatePhysicalDeficits =
    useMemo(() => {
      return physicalFindings.filter(
        (item) =>
          item.finding ===
          'moderate_deficit'
      )
    }, [physicalFindings])

  const significantPhysicalDeficits =
    useMemo(() => {
      return physicalFindings.filter(
        (item) =>
          item.finding ===
          'significant_deficit'
      )
    }, [physicalFindings])

  const poorMovementFindings =
    useMemo(() => {
      return physicalFindings.filter(
        (item) =>
          item.movement_quality ===
            'poor' ||
          item.movement_quality ===
            'unable'
      )
    }, [physicalFindings])

  const exposureFactors =
    useMemo(() => {
      if (!screening) {
        return []
      }

      return [
        {
          label: 'Manual handling',
          active:
            screening.manual_handling_exposure,
        },
        {
          label: 'Repetitive work',
          active:
            screening.repetitive_work_exposure,
        },
        {
          label: 'Awkward posture',
          active:
            screening.awkward_posture_exposure,
        },
        {
          label: 'Prolonged posture',
          active:
            screening.prolonged_posture_exposure,
        },
        {
          label: 'Vibration',
          active:
            screening.vibration_exposure,
        },
        {
          label: 'Overhead work',
          active:
            screening.overhead_work_exposure,
        },
        {
          label: 'Kneeling / squatting',
          active:
            screening.kneeling_squatting_exposure,
        },
        {
          label: 'Confined space',
          active:
            screening.confined_space_exposure,
        },
        {
          label: 'Uneven ground',
          active:
            screening.uneven_ground_exposure,
        },
        {
          label: 'Prolonged walking',
          active:
            screening.prolonged_walking_exposure,
        },
        {
          label: 'Prolonged standing',
          active:
            screening.prolonged_standing_exposure,
        },
      ].filter(
        (item) => item.active
      )
    }, [screening])

  const jobDemandFactors =
    useMemo(() => {
      if (!jobProfile) {
        return []
      }

      const factors: string[] = []

      if (
        (jobProfile.lifting_required_kg ??
          0) > 0
      ) {
        factors.push('Lifting')
      }

      if (
        (jobProfile.carrying_required_kg ??
          0) > 0
      ) {
        factors.push('Carrying')
      }

      if (
        (jobProfile.push_required_kg ??
          0) > 0
      ) {
        factors.push('Pushing')
      }

      if (
        (jobProfile.pull_required_kg ??
          0) > 0
      ) {
        factors.push('Pulling')
      }

      if (
        (jobProfile.standing_required_minutes ??
          0) > 0
      ) {
        factors.push(
          'Standing demand'
        )
      }

      if (
        (jobProfile.walking_required_minutes ??
          0) > 0
      ) {
        factors.push(
          'Walking demand'
        )
      }

      if (
        jobProfile.stair_climbing_required
      ) {
        factors.push(
          'Stair climbing'
        )
      }

      if (
        jobProfile.ladder_climbing_required
      ) {
        factors.push(
          'Ladder climbing'
        )
      }

      if (
        jobProfile.squatting_required
      ) {
        factors.push('Squatting')
      }

      if (
        jobProfile.kneeling_required
      ) {
        factors.push('Kneeling')
      }

      if (
        jobProfile.crawling_required
      ) {
        factors.push('Crawling')
      }

      if (
        jobProfile.overhead_work_required
      ) {
        factors.push(
          'Overhead work'
        )
      }

      if (
        jobProfile.repetitive_upper_limb_required
      ) {
        factors.push(
          'Repetitive upper limb work'
        )
      }

      if (
        jobProfile.uneven_ground_required
      ) {
        factors.push(
          'Uneven ground'
        )
      }

      if (
        jobProfile.confined_space_required
      ) {
        factors.push(
          'Confined space'
        )
      }

      return factors
    }, [jobProfile])

  /*
    These component scores are an internal
    screening indicator system.

    They are intentionally transparent and
    must NOT be presented as a validated
    injury-prediction model.
  */

  const symptomScore =
    useMemo(() => {
      let score = 0

      score +=
        symptomaticRegions.length

      score +=
        highPainRegions.length * 2

      score +=
        workAggravatedRegions.length

      score +=
        workImpactRegions.length * 2

      return score
    }, [
      symptomaticRegions,
      highPainRegions,
      workAggravatedRegions,
      workImpactRegions,
    ])

  const physicalScore =
    useMemo(() => {
      let score = 0

      score +=
        moderatePhysicalDeficits.length *
        2

      score +=
        significantPhysicalDeficits.length *
        3

      score +=
        poorMovementFindings.length * 2

      return score
    }, [
      moderatePhysicalDeficits,
      significantPhysicalDeficits,
      poorMovementFindings,
    ])

  const exposureScore =
    exposureFactors.length

  const jobDemandScore =
    jobDemandFactors.length

  const totalIndicatorScore =
    symptomScore +
    physicalScore +
    exposureScore +
    jobDemandScore

  const suggestedPriority =
    useMemo<RiskLevel>(() => {
      if (
        significantPhysicalDeficits.length >
          0 ||
        workImpactRegions.length >= 2
      ) {
        return 'very_high'
      }

      if (
        highPainRegions.length > 0 ||
        moderatePhysicalDeficits.length >=
          2 ||
        (
          symptomaticRegions.length >=
            2 &&
          workAggravatedRegions.length >
            0
        )
      ) {
        return 'high'
      }

      if (
        symptomaticRegions.length > 0 ||
        moderatePhysicalDeficits.length >
          0 ||
        poorMovementFindings.length > 0
      ) {
        return 'moderate'
      }

      return 'low'
    }, [
      significantPhysicalDeficits,
      workImpactRegions,
      highPainRegions,
      moderatePhysicalDeficits,
      symptomaticRegions,
      workAggravatedRegions,
      poorMovementFindings,
    ])

  function applySuggestedPriority() {
    setRiskLevel(
      suggestedPriority
    )

    if (
      suggestedPriority ===
        'high' ||
      suggestedPriority ===
        'very_high'
    ) {
      setInterventionRequired(true)
      setReassessmentRequired(true)
    }
  }

  function generateDraftSummary() {
    const parts: string[] = []

    if (
      symptomaticRegions.length === 0
    ) {
      parts.push(
        'No current symptomatic body regions were identified.'
      )
    } else {
      parts.push(
        `${symptomaticRegions.length} symptomatic body region(s) were identified.`
      )
    }

    if (
      workAggravatedRegions.length > 0
    ) {
      parts.push(
        `${workAggravatedRegions.length} region(s) were reported as work-related or aggravated by work.`
      )
    }

    if (
      workImpactRegions.length > 0
    ) {
      parts.push(
        `${workImpactRegions.length} region(s) were reported to affect work performance.`
      )
    }

    if (
      significantPhysicalDeficits.length >
      0
    ) {
      parts.push(
        `${significantPhysicalDeficits.length} significant physical deficit(s) were recorded.`
      )
    }

    if (
      moderatePhysicalDeficits.length >
      0
    ) {
      parts.push(
        `${moderatePhysicalDeficits.length} moderate physical deficit(s) were recorded.`
      )
    }

    if (
      exposureFactors.length > 0
    ) {
      parts.push(
        `${exposureFactors.length} occupational exposure factor(s) were identified.`
      )
    }

    setRiskSummary(
      parts.join(' ')
    )
  }

  function generateDraftRecommendations() {
    const recommendations: string[] =
      []

    if (
      symptomaticRegions.length > 0
    ) {
      recommendations.push(
        'Address symptomatic body regions with targeted preventive exercise, education and monitoring as clinically appropriate.'
      )
    }

    if (
      workAggravatedRegions.length > 0
    ) {
      recommendations.push(
        'Review relevant work tasks and aggravating exposures to identify practical ergonomic or task-modification opportunities.'
      )
    }

    if (
      moderatePhysicalDeficits.length >
        0 ||
      significantPhysicalDeficits.length >
        0 ||
      poorMovementFindings.length > 0
    ) {
      recommendations.push(
        'Implement targeted corrective intervention for documented movement or physical deficits and reassess response.'
      )
    }

    if (
      exposureFactors.length > 0
    ) {
      recommendations.push(
        'Reinforce exposure-control strategies relevant to the worker’s task demands.'
      )
    }

    if (
      suggestedPriority ===
        'high' ||
      suggestedPriority ===
        'very_high'
    ) {
      recommendations.push(
        'Consider earlier clinical review and closer follow-up based on the assessor’s professional judgement.'
      )
    }

    if (
      recommendations.length === 0
    ) {
      recommendations.push(
        'Continue routine preventive education and periodic MSK surveillance.'
      )
    }

    setPreventiveRecommendations(
      recommendations.join(' ')
    )
  }

  async function saveRiskProfile(
    completeScreening = false
  ) {
    if (
      !id ||
      !screening
    ) {
      return false
    }

    if (!riskLevel) {
      setError(
        'Please select the final screening priority before saving.'
      )
      return false
    }

    setSaving(true)
    setError(null)
    setSavedMessage(null)

    const contributingFactors = [
      ...symptomaticRegions.map(
        (item) =>
          `Symptom: ${formatLabel(
            item.body_region
          )}`
      ),
      ...significantPhysicalDeficits.map(
        (item) =>
          `Significant deficit: ${item.test_name}`
      ),
      ...moderatePhysicalDeficits.map(
        (item) =>
          `Moderate deficit: ${item.test_name}`
      ),
      ...exposureFactors.map(
        (item) =>
          `Exposure: ${item.label}`
      ),
      ...jobDemandFactors.map(
        (item) =>
          `Job demand: ${item}`
      ),
    ]

    const {
      error: deleteRiskError,
    } = await supabase
      .from('msk_risk_results')
      .delete()
      .eq(
        'screening_id',
        id
      )
      .eq(
        'body_region',
        'overall'
      )

    if (deleteRiskError) {
      setError(
        deleteRiskError.message
      )
      setSaving(false)
      return false
    }

    const {
      error: riskInsertError,
    } = await supabase
      .from('msk_risk_results')
      .insert({
        screening_id: id,
        body_region: 'overall',
        symptom_score:
          symptomScore,
        physical_score:
          physicalScore,
        exposure_score:
          exposureScore,
        job_demand_score:
          jobDemandScore,
        total_risk_score:
          totalIndicatorScore,
        risk_level:
          riskLevel,
        contributing_factors:
          contributingFactors.join(
            '; '
          ) || null,
        recommended_action:
          preventiveRecommendations ||
          null,
      })

    if (riskInsertError) {
      setError(
        riskInsertError.message
      )
      setSaving(false)
      return false
    }

    const {
      error: screeningUpdateError,
    } = await supabase
      .from('msk_screenings')
      .update({
        overall_risk_level:
          riskLevel,

        risk_summary:
          riskSummary || null,

        preventive_recommendations:
          preventiveRecommendations ||
          null,

        intervention_required:
          interventionRequired,

        reassessment_required:
          reassessmentRequired,

        recommended_rescreen_date:
          recommendedRescreenDate ||
          null,

        screening_status:
          completeScreening
            ? 'completed'
            : 'in_progress',

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        id
      )

    if (screeningUpdateError) {
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
              overall_risk_level:
                riskLevel,
              risk_summary:
                riskSummary,
              preventive_recommendations:
                preventiveRecommendations,
              intervention_required:
                interventionRequired,
              reassessment_required:
                reassessmentRequired,
              recommended_rescreen_date:
                recommendedRescreenDate ||
                null,
              screening_status:
                completeScreening
                  ? 'completed'
                  : 'in_progress',
            }
          : current
    )

    setSaving(false)

    setSavedMessage(
      completeScreening
        ? 'MSK screening completed successfully.'
        : 'Risk profile saved successfully.'
    )

    return true
  }

  async function completeScreening() {
    const success =
      await saveRiskProfile(true)

    if (!success) {
      return
    }

    navigate(
      '/msk-screenings'
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
          Building MSK risk
          profile...
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
            'Screening could not be loaded.'}
        </div>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            MSK RISK INTELLIGENCE
          </span>

          <h1>
            MSK Risk Profile
          </h1>

          <p>
            Combine symptoms,
            physical findings,
            occupational exposure
            and expected job demands
            to guide preventive
            action.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate(
              `/msk-screenings/${id}/physical`
            )
          }
        >
          <ArrowLeft size={16} />
          Physical Screen
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
            borderRadius: 8,
            border:
              '1px solid #d1d5db',
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
          <Activity size={18} />

          <span>
            PHYSICAL DEFICITS
          </span>

          <strong>
            {moderatePhysicalDeficits.length +
              significantPhysicalDeficits.length}
          </strong>
        </div>

        <div>
          <BriefcaseBusiness
            size={18}
          />

          <span>
            EXPOSURES
          </span>

          <strong>
            {
              exposureFactors.length
            }
          </strong>
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
            <h2>
              Worker & Job Context
            </h2>

            <p>
              Expected job demands
              provide context but are
              not assumed to equal the
              worker's actual exposure.
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
              Job Profile
            </strong>

            <p>
              {jobProfile
                ?.description ||
                'Not assigned'}
            </p>
          </div>

          <div>
            <strong>
              Job Code
            </strong>

            <p>
              {jobProfile?.job_code ||
                'Not recorded'}
            </p>
          </div>

          <div>
            <strong>
              Physical Demand Level
            </strong>

            <p>
              {jobProfile
                ?.physical_demand_level ||
                'Not recorded'}
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
              Symptom Indicators
            </h2>

            <p>
              Worker-reported MSK
              indicators captured
              during body-region
              screening.
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
              PAIN ≥ 7
            </span>

            <strong>
              {
                highPainRegions.length
              }
            </strong>
          </div>

          <div>
            <Activity size={18} />

            <span>
              WORK AGGRAVATED
            </span>

            <strong>
              {
                workAggravatedRegions.length
              }
            </strong>
          </div>

          <div>
            <ShieldAlert size={18} />

            <span>
              WORK IMPACT
            </span>

            <strong>
              {
                workImpactRegions.length
              }
            </strong>
          </div>
        </div>

        {symptomaticRegions.length >
          0 && (
          <div
            style={{
              marginTop: 18,
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {symptomaticRegions.map(
              (item) => (
                <span
                  key={
                    item.body_region
                  }
                  style={{
                    padding:
                      '7px 10px',
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
            )}
          </div>
        )}

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
              Objective findings that
              may warrant preventive
              attention.
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
            <ShieldCheck size={18} />

            <span>
              MODERATE
            </span>

            <strong>
              {
                moderatePhysicalDeficits.length
              }
            </strong>
          </div>

          <div>
            <AlertTriangle
              size={18}
            />

            <span>
              SIGNIFICANT
            </span>

            <strong>
              {
                significantPhysicalDeficits.length
              }
            </strong>
          </div>

          <div>
            <Activity size={18} />

            <span>
              POOR / UNABLE
            </span>

            <strong>
              {
                poorMovementFindings.length
              }
            </strong>
          </div>
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
            <h2>
              Exposure & Job Demand
              Context
            </h2>

            <p>
              Compare reported work
              exposure with expected
              job demands.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 18,
          }}
        >
          <div>
            <strong>
              Reported Occupational
              Exposure
            </strong>

            <div
              style={{
                marginTop: 12,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {exposureFactors.length >
              0 ? (
                exposureFactors.map(
                  (item) => (
                    <span
                      key={
                        item.label
                      }
                      style={{
                        padding:
                          '7px 10px',
                        border:
                          '1px solid #d1d5db',
                        borderRadius:
                          20,
                      }}
                    >
                      {item.label}
                    </span>
                  )
                )
              ) : (
                <p>
                  No exposure factors
                  recorded.
                </p>
              )}
            </div>
          </div>

          <div>
            <strong>
              Expected Job Demands
            </strong>

            <div
              style={{
                marginTop: 12,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {jobDemandFactors.length >
              0 ? (
                jobDemandFactors.map(
                  (item) => (
                    <span
                      key={item}
                      style={{
                        padding:
                          '7px 10px',
                        border:
                          '1px solid #d1d5db',
                        borderRadius:
                          20,
                      }}
                    >
                      {item}
                    </span>
                  )
                )
              ) : (
                <p>
                  No structured job
                  demands available.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">
          <div className="assessment-section-icon">
            <ShieldAlert size={20} />
          </div>

          <div>
            <h2>
              Explainable Screening
              Indicators
            </h2>

            <p>
              These values make the
              system's reasoning
              visible to the assessor.
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
              SYMPTOM SCORE
            </span>
            <strong>
              {symptomScore}
            </strong>
          </div>

          <div>
            <Activity size={18} />
            <span>
              PHYSICAL SCORE
            </span>
            <strong>
              {physicalScore}
            </strong>
          </div>

          <div>
            <BriefcaseBusiness
              size={18}
            />
            <span>
              EXPOSURE SCORE
            </span>
            <strong>
              {exposureScore}
            </strong>
          </div>

          <div>
            <ShieldCheck size={18} />
            <span>
              JOB DEMAND SCORE
            </span>
            <strong>
              {jobDemandScore}
            </strong>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            padding: 16,
            border:
              '1px solid #d1d5db',
            borderRadius: 10,
          }}
        >
          <strong>
            Total indicator burden:{' '}
            {totalIndicatorScore}
          </strong>

          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
            }}
          >
            This is an internal,
            transparent screening
            indicator system. It is
            not a validated injury
            prediction score and does
            not diagnose an MSK
            disorder or determine
            fitness for work.
          </p>
        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">
          <div className="assessment-section-icon">
            <ShieldAlert size={20} />
          </div>

          <div>
            <h2>
              Screening Priority
            </h2>

            <p>
              The system can suggest a
              prevention priority, but
              the assessor records the
              final classification.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 20,
            padding: 16,
            border:
              '1px solid #d1d5db',
            borderRadius: 10,
          }}
        >
          <span>
            SYSTEM SUGGESTION
          </span>

          <h2
            style={{
              marginTop: 6,
            }}
          >
            {formatLabel(
              suggestedPriority
            )}
          </h2>

          <p>
            Based on the currently
            recorded screening
            indicators.
          </p>

          <button
            className="secondary-button"
            onClick={
              applySuggestedPriority
            }
          >
            <CheckCircle2
              size={16}
            />
            Apply Suggestion
          </button>
        </div>

        <div
          className="form-grid"
          style={{
            marginTop: 20,
          }}
        >
          <label>
            <span>
              Final Screening Priority
            </span>

            <select
              value={riskLevel}
              onChange={(event) =>
                setRiskLevel(
                  event.target
                    .value as RiskLevel
                )
              }
            >
              <option value="">
                Select priority
              </option>

              <option value="low">
                Low
              </option>

              <option value="moderate">
                Moderate
              </option>

              <option value="high">
                High
              </option>

              <option value="very_high">
                Very High
              </option>
            </select>
          </label>

          <label>
            <span>
              Recommended Re-screen
              Date
            </span>

            <input
              type="date"
              value={
                recommendedRescreenDate
              }
              onChange={(event) =>
                setRecommendedRescreenDate(
                  event.target.value
                )
              }
            />
          </label>
        </div>

        <div
          style={{
            marginTop: 16,
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 12,
          }}
        >
          <BooleanCard
            label="Preventive intervention required"
            checked={
              interventionRequired
            }
            onChange={
              setInterventionRequired
            }
          />

          <BooleanCard
            label="Reassessment required"
            checked={
              reassessmentRequired
            }
            onChange={
              setReassessmentRequired
            }
          />
        </div>

      </div>

      <div className="panel">

        <div className="assessment-section-title">
          <div className="assessment-section-icon">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2>
              Prevention Plan
            </h2>

            <p>
              Record the assessor's
              interpretation and
              preventive actions.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <button
            className="secondary-button"
            onClick={
              generateDraftSummary
            }
          >
            Generate Draft Summary
          </button>

          <button
            className="secondary-button"
            onClick={
              generateDraftRecommendations
            }
          >
            Generate Draft
            Recommendations
          </button>
        </div>

        <label
          style={{
            display: 'block',
            marginTop: 18,
          }}
        >
          <span>
            Risk / Prevention Summary
          </span>

          <textarea
            rows={5}
            value={riskSummary}
            onChange={(event) =>
              setRiskSummary(
                event.target.value
              )
            }
            placeholder="Summarise the important symptom, physical and occupational factors."
          />
        </label>

        <label
          style={{
            display: 'block',
            marginTop: 18,
          }}
        >
          <span>
            Preventive
            Recommendations
          </span>

          <textarea
            rows={6}
            value={
              preventiveRecommendations
            }
            onChange={(event) =>
              setPreventiveRecommendations(
                event.target.value
              )
            }
            placeholder="Preventive exercise, education, exposure control, ergonomic review, follow-up or referral recommendations."
          />
        </label>

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
              Finalise Screening
            </h2>

            <p
              style={{
                marginBottom: 0,
              }}
            >
              Save the risk profile or
              complete the screening
              and return to the MSK
              register.
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
              disabled={saving}
              onClick={() =>
                saveRiskProfile(false)
              }
            >
              <Save size={16} />

              {saving
                ? 'Saving...'
                : 'Save Risk Profile'}
            </button>

            <button
              className="primary-button"
              disabled={saving}
              onClick={
                completeScreening
              }
            >
              <CheckCircle2
                size={16}
              />

              Complete Screening
            </button>
          </div>
        </div>

      </div>

    </div>
  )
}

type BooleanCardProps = {
  label: string
  checked: boolean
  onChange: (
    value: boolean
  ) => void
}

function BooleanCard({
  label,
  checked,
  onChange,
}: BooleanCardProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        border:
          '1px solid #d1d5db',
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
