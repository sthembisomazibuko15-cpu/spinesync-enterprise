import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
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
  screening_type: string
  screening_status: string
  overall_risk_level: string | null
  current_msk_complaint: boolean
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
}

type Symptom = {
  screening_id: string
  body_region: string
  symptoms_present: boolean
  pain_score: number | null
  work_related: boolean
  aggravated_by_work: boolean
  affects_work_performance: boolean
}

type PhysicalFinding = {
  screening_id: string
  body_region: string | null
  test_name: string
  finding: string | null
  movement_quality: string | null
  pain_during_test: number | null
}

type RiskResult = {
  screening_id: string
  symptom_score: number
  physical_score: number
  exposure_score: number
  job_demand_score: number
  total_risk_score: number
  risk_level: string | null
}

type ComparisonStatus =
  | 'improved'
  | 'stable'
  | 'worsened'
  | 'not_available'

export default function MskRescreen() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [currentScreening, setCurrentScreening] =
    useState<Screening | null>(null)

  const [previousScreening, setPreviousScreening] =
    useState<Screening | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [currentSymptoms, setCurrentSymptoms] =
    useState<Symptom[]>([])

  const [previousSymptoms, setPreviousSymptoms] =
    useState<Symptom[]>([])

  const [
    currentPhysicalFindings,
    setCurrentPhysicalFindings,
  ] = useState<PhysicalFinding[]>([])

  const [
    previousPhysicalFindings,
    setPreviousPhysicalFindings,
  ] = useState<PhysicalFinding[]>([])

  const [currentRisk, setCurrentRisk] =
    useState<RiskResult | null>(null)

  const [previousRisk, setPreviousRisk] =
    useState<RiskResult | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadComparison()
    }
  }, [id])

  async function loadComparison() {
    if (!id) {
      return
    }

    setLoading(true)
    setError(null)

    const {
      data: currentData,
      error: currentError,
    } = await supabase
      .from('msk_screenings')
      .select(`
        id,
        organisation_id,
        worker_id,
        screening_date,
        screening_type,
        screening_status,
        overall_risk_level,
        current_msk_complaint,
        risk_summary,
        preventive_recommendations,
        intervention_required,
        reassessment_required,
        recommended_rescreen_date
      `)
      .eq('id', id)
      .single()

    if (
      currentError ||
      !currentData
    ) {
      setError(
        currentError?.message ||
          'Current screening could not be loaded.'
      )
      setLoading(false)
      return
    }

    const typedCurrent =
      currentData as Screening

    setCurrentScreening(
      typedCurrent
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
        last_name
      `)
      .eq(
        'id',
        typedCurrent.worker_id
      )
      .single()

    if (
      workerError ||
      !workerData
    ) {
      setError(
        workerError?.message ||
          'Worker could not be loaded.'
      )
      setLoading(false)
      return
    }

    setWorker(
      workerData as Worker
    )

    const {
      data: previousData,
      error: previousError,
    } = await supabase
      .from('msk_screenings')
      .select(`
        id,
        organisation_id,
        worker_id,
        screening_date,
        screening_type,
        screening_status,
        overall_risk_level,
        current_msk_complaint,
        risk_summary,
        preventive_recommendations,
        intervention_required,
        reassessment_required,
        recommended_rescreen_date
      `)
      .eq(
        'worker_id',
        typedCurrent.worker_id
      )
      .neq(
        'id',
        typedCurrent.id
      )
      .lt(
        'screening_date',
        typedCurrent.screening_date
      )
      .order(
        'screening_date',
        {
          ascending: false,
        }
      )
      .limit(1)
      .maybeSingle()

    if (previousError) {
      setError(
        previousError.message
      )
      setLoading(false)
      return
    }

    const typedPrevious =
      previousData
        ? (previousData as Screening)
        : null

    setPreviousScreening(
      typedPrevious
    )

    const currentQueries =
      await Promise.all([
        supabase
          .from('msk_symptoms')
          .select(`
            screening_id,
            body_region,
            symptoms_present,
            pain_score,
            work_related,
            aggravated_by_work,
            affects_work_performance
          `)
          .eq(
            'screening_id',
            typedCurrent.id
          ),

        supabase
          .from('msk_physical_findings')
          .select(`
            screening_id,
            body_region,
            test_name,
            finding,
            movement_quality,
            pain_during_test
          `)
          .eq(
            'screening_id',
            typedCurrent.id
          ),

        supabase
          .from('msk_risk_results')
          .select(`
            screening_id,
            symptom_score,
            physical_score,
            exposure_score,
            job_demand_score,
            total_risk_score,
            risk_level
          `)
          .eq(
            'screening_id',
            typedCurrent.id
          )
          .eq(
            'body_region',
            'overall'
          )
          .maybeSingle(),
      ])

    const [
      currentSymptomsResponse,
      currentPhysicalResponse,
      currentRiskResponse,
    ] = currentQueries

    if (
      currentSymptomsResponse.error
    ) {
      setError(
        currentSymptomsResponse.error
          .message
      )
      setLoading(false)
      return
    }

    if (
      currentPhysicalResponse.error
    ) {
      setError(
        currentPhysicalResponse.error
          .message
      )
      setLoading(false)
      return
    }

    if (
      currentRiskResponse.error
    ) {
      setError(
        currentRiskResponse.error
          .message
      )
      setLoading(false)
      return
    }

    setCurrentSymptoms(
      (currentSymptomsResponse.data ??
        []) as Symptom[]
    )

    setCurrentPhysicalFindings(
      (currentPhysicalResponse.data ??
        []) as PhysicalFinding[]
    )

    if (currentRiskResponse.data) {
      setCurrentRisk(
        currentRiskResponse.data as RiskResult
      )
    }

    if (typedPrevious) {
      const previousQueries =
        await Promise.all([
          supabase
            .from('msk_symptoms')
            .select(`
              screening_id,
              body_region,
              symptoms_present,
              pain_score,
              work_related,
              aggravated_by_work,
              affects_work_performance
            `)
            .eq(
              'screening_id',
              typedPrevious.id
            ),

          supabase
            .from('msk_physical_findings')
            .select(`
              screening_id,
              body_region,
              test_name,
              finding,
              movement_quality,
              pain_during_test
            `)
            .eq(
              'screening_id',
              typedPrevious.id
            ),

          supabase
            .from('msk_risk_results')
            .select(`
              screening_id,
              symptom_score,
              physical_score,
              exposure_score,
              job_demand_score,
              total_risk_score,
              risk_level
            `)
            .eq(
              'screening_id',
              typedPrevious.id
            )
            .eq(
              'body_region',
              'overall'
            )
            .maybeSingle(),
        ])

      const [
        previousSymptomsResponse,
        previousPhysicalResponse,
        previousRiskResponse,
      ] = previousQueries

      if (
        previousSymptomsResponse.error
      ) {
        setError(
          previousSymptomsResponse.error
            .message
        )
        setLoading(false)
        return
      }

      if (
        previousPhysicalResponse.error
      ) {
        setError(
          previousPhysicalResponse.error
            .message
        )
        setLoading(false)
        return
      }

      if (
        previousRiskResponse.error
      ) {
        setError(
          previousRiskResponse.error
            .message
        )
        setLoading(false)
        return
      }

      setPreviousSymptoms(
        (previousSymptomsResponse.data ??
          []) as Symptom[]
      )

      setPreviousPhysicalFindings(
        (previousPhysicalResponse.data ??
          []) as PhysicalFinding[]
      )

      if (previousRiskResponse.data) {
        setPreviousRisk(
          previousRiskResponse.data as RiskResult
        )
      }
    }

    setLoading(false)
  }

  const currentSymptomaticCount =
    useMemo(() => {
      return currentSymptoms.filter(
        (item) =>
          item.symptoms_present
      ).length
    }, [currentSymptoms])

  const previousSymptomaticCount =
    useMemo(() => {
      return previousSymptoms.filter(
        (item) =>
          item.symptoms_present
      ).length
    }, [previousSymptoms])

  const currentHighPainCount =
    useMemo(() => {
      return currentSymptoms.filter(
        (item) =>
          item.symptoms_present &&
          (item.pain_score ?? 0) >= 7
      ).length
    }, [currentSymptoms])

  const previousHighPainCount =
    useMemo(() => {
      return previousSymptoms.filter(
        (item) =>
          item.symptoms_present &&
          (item.pain_score ?? 0) >= 7
      ).length
    }, [previousSymptoms])

  const currentDeficitCount =
    useMemo(() => {
      return currentPhysicalFindings.filter(
        (item) =>
          item.finding ===
            'moderate_deficit' ||
          item.finding ===
            'significant_deficit'
      ).length
    }, [currentPhysicalFindings])

  const previousDeficitCount =
    useMemo(() => {
      return previousPhysicalFindings.filter(
        (item) =>
          item.finding ===
            'moderate_deficit' ||
          item.finding ===
            'significant_deficit'
      ).length
    }, [previousPhysicalFindings])

  const currentWorkImpactCount =
    useMemo(() => {
      return currentSymptoms.filter(
        (item) =>
          item.symptoms_present &&
          item.affects_work_performance
      ).length
    }, [currentSymptoms])

  const previousWorkImpactCount =
    useMemo(() => {
      return previousSymptoms.filter(
        (item) =>
          item.symptoms_present &&
          item.affects_work_performance
      ).length
    }, [previousSymptoms])

  const comparisonStatus =
    useMemo<ComparisonStatus>(() => {
      if (!previousScreening) {
        return 'not_available'
      }

      if (
        currentRisk &&
        previousRisk
      ) {
        if (
          currentRisk.total_risk_score <
          previousRisk.total_risk_score
        ) {
          return 'improved'
        }

        if (
          currentRisk.total_risk_score >
          previousRisk.total_risk_score
        ) {
          return 'worsened'
        }

        return 'stable'
      }

      const currentBurden =
        currentSymptomaticCount +
        currentHighPainCount +
        currentDeficitCount +
        currentWorkImpactCount

      const previousBurden =
        previousSymptomaticCount +
        previousHighPainCount +
        previousDeficitCount +
        previousWorkImpactCount

      if (
        currentBurden <
        previousBurden
      ) {
        return 'improved'
      }

      if (
        currentBurden >
        previousBurden
      ) {
        return 'worsened'
      }

      return 'stable'
    }, [
      previousScreening,
      currentRisk,
      previousRisk,
      currentSymptomaticCount,
      previousSymptomaticCount,
      currentHighPainCount,
      previousHighPainCount,
      currentDeficitCount,
      previousDeficitCount,
      currentWorkImpactCount,
      previousWorkImpactCount,
    ])

  const resolvedRegions =
    useMemo(() => {
      return previousSymptoms
        .filter(
          (previous) =>
            previous.symptoms_present
        )
        .filter((previous) => {
          const current =
            currentSymptoms.find(
              (item) =>
                item.body_region ===
                previous.body_region
            )

          return (
            !current ||
            !current.symptoms_present
          )
        })
        .map(
          (item) =>
            item.body_region
        )
    }, [
      previousSymptoms,
      currentSymptoms,
    ])

  const newSymptomaticRegions =
    useMemo(() => {
      return currentSymptoms
        .filter(
          (current) =>
            current.symptoms_present
        )
        .filter((current) => {
          const previous =
            previousSymptoms.find(
              (item) =>
                item.body_region ===
                current.body_region
            )

          return (
            !previous ||
            !previous.symptoms_present
          )
        })
        .map(
          (item) =>
            item.body_region
        )
    }, [
      currentSymptoms,
      previousSymptoms,
    ])

  function statusLabel() {
    if (
      comparisonStatus ===
      'improved'
    ) {
      return 'Improved'
    }

    if (
      comparisonStatus ===
      'worsened'
    ) {
      return 'Worsened'
    }

    if (
      comparisonStatus ===
      'stable'
    ) {
      return 'Stable'
    }

    return 'No Previous Screening'
  }

  function statusIcon() {
    if (
      comparisonStatus ===
      'improved'
    ) {
      return (
        <TrendingDown
          size={20}
        />
      )
    }

    if (
      comparisonStatus ===
      'worsened'
    ) {
      return (
        <TrendingUp
          size={20}
        />
      )
    }

    return (
      <Activity size={20} />
    )
  }

  function formatLabel(
    value:
      | string
      | null
      | undefined
  ) {
    if (!value) {
      return 'Not assessed'
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

  function formatDate(
    value:
      | string
      | null
      | undefined
  ) {
    if (!value) {
      return 'Not available'
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString(
      'en-ZA',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Comparing MSK screenings...
        </p>
      </div>
    )
  }

  if (
    !currentScreening ||
    !worker
  ) {
    return (
      <div className="stack">
        <div className="error-message">
          {error ||
            'Screening comparison could not be loaded.'}
        </div>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            MSK TREND MONITORING
          </span>

          <h1>
            Re-screen Comparison
          </h1>

          <p>
            Compare the worker&apos;s
            current screening against
            the most recent earlier
            screening to evaluate
            change over time.
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
          <CalendarDays size={18} />

          <span>
            CURRENT SCREEN
          </span>

          <strong>
            {formatDate(
              currentScreening.screening_date
            )}
          </strong>
        </div>

        <div>
          <CalendarDays size={18} />

          <span>
            PREVIOUS SCREEN
          </span>

          <strong>
            {previousScreening
              ? formatDate(
                  previousScreening.screening_date
                )
              : 'None'}
          </strong>
        </div>

        <div>
          {statusIcon()}

          <span>
            TREND
          </span>

          <strong>
            {statusLabel()}
          </strong>
        </div>

      </div>

      {!previousScreening ? (
        <div className="panel">

          <div className="assessment-section-title">

            <div className="assessment-section-icon">
              <RefreshCw size={20} />
            </div>

            <div>
              <h2>
                Baseline Established
              </h2>

              <p>
                This worker does not yet
                have an earlier MSK
                screening available for
                comparison.
              </p>
            </div>

          </div>

          <p
            style={{
              marginTop: 18,
            }}
          >
            This screening can serve as
            the worker&apos;s reference
            point. Once another baseline,
            periodic, targeted or
            post-intervention screening
            is completed, SpineSync will
            be able to compare the two.
          </p>

        </div>
      ) : (
        <>
          <div className="panel">

            <div className="assessment-section-title">

              <div className="assessment-section-icon">
                {statusIcon()}
              </div>

              <div>
                <h2>
                  Overall Change
                </h2>

                <p>
                  Screening indicators
                  are compared over time
                  to support preventive
                  follow-up.
                </p>
              </div>

            </div>

            <div
              style={{
                marginTop: 20,
                padding: 18,
                border:
                  '1px solid #d1d5db',
                borderRadius: 10,
              }}
            >
              <strong>
                {statusLabel()}
              </strong>

              <p
                style={{
                  marginTop: 8,
                  marginBottom: 0,
                }}
              >
                {comparisonStatus ===
                'improved'
                  ? 'The current screening shows a lower overall indicator burden than the previous screening.'
                  : comparisonStatus ===
                    'worsened'
                  ? 'The current screening shows a higher overall indicator burden than the previous screening and may warrant earlier preventive review.'
                  : 'The overall screening indicator burden is broadly unchanged from the previous screening.'}
              </p>
            </div>

          </div>

          <div className="panel">

            <div className="assessment-section-title">

              <div className="assessment-section-icon">
                <Activity size={20} />
              </div>

              <div>
                <h2>
                  Before / After Indicators
                </h2>

                <p>
                  Compare symptom,
                  functional and work
                  impact indicators.
                </p>
              </div>

            </div>

            <div className="fce-report-table-wrap">

              <table className="fce-report-table">

                <thead>
                  <tr>
                    <th>
                      Indicator
                    </th>

                    <th>
                      Previous
                    </th>

                    <th>
                      Current
                    </th>

                    <th>
                      Change
                    </th>
                  </tr>
                </thead>

                <tbody>

                  <ComparisonRow
                    label="Symptomatic Regions"
                    previous={
                      previousSymptomaticCount
                    }
                    current={
                      currentSymptomaticCount
                    }
                  />

                  <ComparisonRow
                    label="Pain ≥ 7 Regions"
                    previous={
                      previousHighPainCount
                    }
                    current={
                      currentHighPainCount
                    }
                  />

                  <ComparisonRow
                    label="Moderate / Significant Deficits"
                    previous={
                      previousDeficitCount
                    }
                    current={
                      currentDeficitCount
                    }
                  />

                  <ComparisonRow
                    label="Regions Affecting Work"
                    previous={
                      previousWorkImpactCount
                    }
                    current={
                      currentWorkImpactCount
                    }
                  />

                  <ComparisonRow
                    label="Total Indicator Score"
                    previous={
                      previousRisk
                        ?.total_risk_score ??
                      null
                    }
                    current={
                      currentRisk
                        ?.total_risk_score ??
                      null
                    }
                  />

                </tbody>

              </table>

            </div>

          </div>

          <div className="panel">

            <div className="assessment-section-title">

              <div className="assessment-section-icon">
                <ShieldCheck size={20} />
              </div>

              <div>
                <h2>
                  Risk Priority Change
                </h2>

                <p>
                  Compare assessor-recorded
                  screening priority between
                  the two screenings.
                </p>
              </div>

            </div>

            <div
              style={{
                marginTop: 20,
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
              }}
            >

              <div
                style={{
                  padding: 16,
                  border:
                    '1px solid #d1d5db',
                  borderRadius: 10,
                }}
              >
                <span>
                  PREVIOUS PRIORITY
                </span>

                <h2>
                  {formatLabel(
                    previousScreening.overall_risk_level
                  )}
                </h2>
              </div>

              <div
                style={{
                  padding: 16,
                  border:
                    '1px solid #d1d5db',
                  borderRadius: 10,
                }}
              >
                <span>
                  CURRENT PRIORITY
                </span>

                <h2>
                  {formatLabel(
                    currentScreening.overall_risk_level
                  )}
                </h2>
              </div>

            </div>

          </div>

          <div className="panel">

            <div className="assessment-section-title">

              <div className="assessment-section-icon">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <h2>
                  Body-Region Change
                </h2>

                <p>
                  Identify resolved and
                  newly symptomatic body
                  regions.
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
                  Resolved Regions
                </strong>

                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  {resolvedRegions.length >
                  0 ? (
                    resolvedRegions.map(
                      (region) => (
                        <span
                          key={region}
                          style={{
                            padding:
                              '7px 10px',
                            border:
                              '1px solid #d1d5db',
                            borderRadius: 20,
                          }}
                        >
                          {formatLabel(
                            region
                          )}
                        </span>
                      )
                    )
                  ) : (
                    <p>
                      No previously
                      symptomatic regions
                      have resolved.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <strong>
                  New Symptomatic Regions
                </strong>

                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  {newSymptomaticRegions.length >
                  0 ? (
                    newSymptomaticRegions.map(
                      (region) => (
                        <span
                          key={region}
                          style={{
                            padding:
                              '7px 10px',
                            border:
                              '1px solid #d1d5db',
                            borderRadius: 20,
                          }}
                        >
                          {formatLabel(
                            region
                          )}
                        </span>
                      )
                    )
                  ) : (
                    <p>
                      No new symptomatic
                      regions identified.
                    </p>
                  )}
                </div>
              </div>

            </div>

          </div>

          <div className="panel">

            <div className="assessment-section-title">

              <div className="assessment-section-icon">
                <AlertTriangle size={20} />
              </div>

              <div>
                <h2>
                  Interpretation
                </h2>

                <p>
                  Trend information
                  supports clinical and
                  preventive decision-making.
                </p>
              </div>

            </div>

            <p
              style={{
                marginTop: 18,
              }}
            >
              A change in SpineSync
              screening indicators should
              not be interpreted by itself
              as proof that an intervention
              caused improvement or
              deterioration. Changes may
              also reflect work exposure,
              health status, reporting,
              timing and other factors.
            </p>

          </div>
        </>
      )}

    </div>
  )
}

type ComparisonRowProps = {
  label: string
  previous: number | null
  current: number | null
}

function ComparisonRow({
  label,
  previous,
  current,
}: ComparisonRowProps) {
  let change = 'Not available'

  if (
    previous !== null &&
    current !== null
  ) {
    if (current < previous) {
      change = 'Improved'
    } else if (
      current > previous
    ) {
      change = 'Worsened'
    } else {
      change = 'Stable'
    }
  }

  return (
    <tr>
      <td>
        <strong>
          {label}
        </strong>
      </td>

      <td>
        {previous ??
          'Not available'}
      </td>

      <td>
        {current ??
          'Not available'}
      </td>

      <td>
        {change}
      </td>
    </tr>
  )
}
