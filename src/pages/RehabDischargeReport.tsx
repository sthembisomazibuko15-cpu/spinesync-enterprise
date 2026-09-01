import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
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

type RehabCase = {
  id: string
  worker_id: string
  assessment_id: string | null
  case_number: string | null
  referral_date: string
  referral_reason: string | null
  primary_condition: string | null
  affected_body_region: string | null
  initial_work_status: string | null
  current_work_status: string | null
  restrictions: string | null
  rehabilitation_goals: string | null
  planned_sessions: number | null
  sessions_completed: number
  expected_reassessment_date: string | null
  actual_reassessment_date: string | null
  case_status: string
  discharge_outcome: string | null
  discharge_summary: string | null
  discharge_recommendations: string | null
  created_by: string | null
}

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  job_profile_id: string | null
  operation_id: string | null
  site_id: string | null
  department_id: string | null
  fitness_status: string | null
}

type Assessment = {
  id: string
  assessor_id: string | null
  assessment_date: string
  assessment_status: string
  assessment_phase: string
  final_outcome: string | null
  restrictions: string | null
  recommendations: string | null
  pain_score: number | null
  systolic_bp: number | null
  diastolic_bp: number | null
  resting_hr: number | null
}

type FceResult = {
  id: string
  assessment_id: string
  test_category: string
  test_name: string
  side: string | null
  measured_value: number | null
  required_value: number | null
  unit: string | null
  result: string | null
  assessor_rating: string | null
}

type RehabSession = {
  id: string
  therapist_id: string | null
  session_date: string
  session_number: number | null
  pain_score: number | null
  subjective_report: string | null
  objective_findings: string | null
  intervention: string | null
  exercise_progression: string | null
  functional_progress: string | null
  work_capacity_progress: string | null
  restrictions_review: string | null
  clinical_notes: string | null
  next_plan: string | null
}

type RehabGoal = {
  id: string
  goal_description: string
  baseline_value: number | null
  current_value: number | null
  target_value: number | null
  target_unit: string | null
  target_date: string | null
  goal_status: string
}

type JobProfile = {
  id: string
  title: string
  job_code: string | null
  physical_demand_level: string | null
}

type StructureItem = {
  id: string
  name: string
}

type AssessorProfile = {
  id: string
  full_name: string | null
  profession: string | null
  hpcsa_number: string | null
  practice_name: string | null
  phone: string | null
  email: string | null
  signature_url: string | null
}

type ComparisonRow = {
  key: string
  category: string
  name: string
  side: string | null
  preValue: number | null
  preRequired: number | null
  preUnit: string | null
  preRating: string | null
  postValue: number | null
  postRequired: number | null
  postUnit: string | null
  postRating: string | null
}

export default function RehabDischargeReport() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [rehabCase, setRehabCase] =
    useState<RehabCase | null>(null)

  const [worker, setWorker] =
    useState<Worker | null>(null)

  const [initialAssessment, setInitialAssessment] =
    useState<Assessment | null>(null)

  const [reassessment, setReassessment] =
    useState<Assessment | null>(null)

  const [initialResults, setInitialResults] =
    useState<FceResult[]>([])

  const [reassessmentResults, setReassessmentResults] =
    useState<FceResult[]>([])

  const [sessions, setSessions] =
    useState<RehabSession[]>([])

  const [goals, setGoals] =
    useState<RehabGoal[]>([])

  const [jobProfile, setJobProfile] =
    useState<JobProfile | null>(null)

  const [operation, setOperation] =
    useState<StructureItem | null>(null)

  const [site, setSite] =
    useState<StructureItem | null>(null)

  const [department, setDepartment] =
    useState<StructureItem | null>(null)

  const [assessor, setAssessor] =
    useState<AssessorProfile | null>(null)

  const [signatureUrl, setSignatureUrl] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  useEffect(() => {
    loadReport()
  }, [id])

  async function loadReport() {
    if (!id) {
      setError('Rehabilitation case ID is missing.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const {
      data: caseData,
      error: caseError,
    } = await supabase
      .from('rehabilitation_cases')
      .select(`
        id,
        worker_id,
        assessment_id,
        case_number,
        referral_date,
        referral_reason,
        primary_condition,
        affected_body_region,
        initial_work_status,
        current_work_status,
        restrictions,
        rehabilitation_goals,
        planned_sessions,
        sessions_completed,
        expected_reassessment_date,
        actual_reassessment_date,
        case_status,
        discharge_outcome,
        discharge_summary,
        discharge_recommendations,
        created_by
      `)
      .eq('id', id)
      .single()

    if (caseError) {
      setError(caseError.message)
      setLoading(false)
      return
    }

    const loadedCase = caseData as RehabCase
    setRehabCase(loadedCase)

    const [
      workerResponse,
      sessionResponse,
      goalResponse,
      reassessmentResponse,
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
          department_id,
          fitness_status
        `)
        .eq('id', loadedCase.worker_id)
        .single(),

      supabase
        .from('rehabilitation_sessions')
        .select(`
          id,
          therapist_id,
          session_date,
          session_number,
          pain_score,
          subjective_report,
          objective_findings,
          intervention,
          exercise_progression,
          functional_progress,
          work_capacity_progress,
          restrictions_review,
          clinical_notes,
          next_plan
        `)
        .eq('rehabilitation_case_id', loadedCase.id)
        .order('session_number', {
          ascending: true,
        }),

      supabase
        .from('rehabilitation_goals')
        .select(`
          id,
          goal_description,
          baseline_value,
          current_value,
          target_value,
          target_unit,
          target_date,
          goal_status
        `)
        .eq('rehabilitation_case_id', loadedCase.id)
        .order('created_at', {
          ascending: true,
        }),

      supabase
        .from('assessments')
        .select(`
          id,
          assessor_id,
          assessment_date,
          assessment_status,
          assessment_phase,
          final_outcome,
          restrictions,
          recommendations,
          pain_score,
          systolic_bp,
          diastolic_bp,
          resting_hr
        `)
        .eq('rehabilitation_case_id', loadedCase.id)
        .eq('assessment_phase', 'reassessment')
        .order('assessment_date', {
          ascending: false,
        })
        .order('created_at', {
          ascending: false,
        }),
    ])

    if (workerResponse.error) {
      setError(workerResponse.error.message)
      setLoading(false)
      return
    }

    if (sessionResponse.error) {
      setError(sessionResponse.error.message)
      setLoading(false)
      return
    }

    if (goalResponse.error) {
      setError(goalResponse.error.message)
      setLoading(false)
      return
    }

    if (reassessmentResponse.error) {
      setError(reassessmentResponse.error.message)
      setLoading(false)
      return
    }

    const loadedWorker =
      workerResponse.data as Worker

    setWorker(loadedWorker)

    setSessions(
      (sessionResponse.data ?? []) as RehabSession[]
    )

    setGoals(
      (goalResponse.data ?? []) as RehabGoal[]
    )

    const reassessments =
      (reassessmentResponse.data ?? []) as Assessment[]

    const selectedReassessment =
      reassessments.find(
        (item) =>
          item.assessment_status === 'completed'
      ) ||
      reassessments[0] ||
      null

    setReassessment(selectedReassessment)

    let loadedInitial:
      | Assessment
      | null = null

    if (loadedCase.assessment_id) {
      const {
        data,
        error,
      } = await supabase
        .from('assessments')
        .select(`
          id,
          assessor_id,
          assessment_date,
          assessment_status,
          assessment_phase,
          final_outcome,
          restrictions,
          recommendations,
          pain_score,
          systolic_bp,
          diastolic_bp,
          resting_hr
        `)
        .eq('id', loadedCase.assessment_id)
        .single()

      if (!error && data) {
        loadedInitial = data as Assessment
      }
    }

    setInitialAssessment(loadedInitial)

    const structureQueries: Promise<any>[] = []

    if (loadedWorker.job_profile_id) {
      structureQueries.push(
        Promise.resolve(
          supabase
            .from('job_profiles')
            .select(`
              id,
              title,
              job_code,
              physical_demand_level
            `)
            .eq('id', loadedWorker.job_profile_id)
            .single()
        )
      )
    } else {
      structureQueries.push(
        Promise.resolve({
          data: null,
          error: null,
        })
      )
    }

    if (loadedWorker.operation_id) {
      structureQueries.push(
        Promise.resolve(
          supabase
            .from('operations')
            .select('id, name')
            .eq('id', loadedWorker.operation_id)
            .single()
        )
      )
    } else {
      structureQueries.push(
        Promise.resolve({
          data: null,
          error: null,
        })
      )
    }

    if (loadedWorker.site_id) {
      structureQueries.push(
        Promise.resolve(
          supabase
            .from('sites')
            .select('id, name')
            .eq('id', loadedWorker.site_id)
            .single()
        )
      )
    } else {
      structureQueries.push(
        Promise.resolve({
          data: null,
          error: null,
        })
      )
    }

    if (loadedWorker.department_id) {
      structureQueries.push(
        Promise.resolve(
          supabase
            .from('departments')
            .select('id, name')
            .eq('id', loadedWorker.department_id)
            .single()
        )
      )
    } else {
      structureQueries.push(
        Promise.resolve({
          data: null,
          error: null,
        })
      )
    }

    const [
      jobResponse,
      operationResponse,
      siteResponse,
      departmentResponse,
    ] = await Promise.all(structureQueries)

    if (jobResponse?.data) {
      setJobProfile(
        jobResponse.data as JobProfile
      )
    }

    if (operationResponse?.data) {
      setOperation(
        operationResponse.data as StructureItem
      )
    }

    if (siteResponse?.data) {
      setSite(
        siteResponse.data as StructureItem
      )
    }

    if (departmentResponse?.data) {
      setDepartment(
        departmentResponse.data as StructureItem
      )
    }

    const resultQueries: Promise<any>[] = []

    if (loadedInitial) {
      resultQueries.push(
        Promise.resolve(
          supabase
            .from('fce_results')
            .select(`
              id,
              assessment_id,
              test_category,
              test_name,
              side,
              measured_value,
              required_value,
              unit,
              result,
              assessor_rating
            `)
            .eq(
              'assessment_id',
              loadedInitial.id
            )
        )
      )
    } else {
      resultQueries.push(
        Promise.resolve({
          data: [],
          error: null,
        })
      )
    }

    if (selectedReassessment) {
      resultQueries.push(
        Promise.resolve(
          supabase
            .from('fce_results')
            .select(`
              id,
              assessment_id,
              test_category,
              test_name,
              side,
              measured_value,
              required_value,
              unit,
              result,
              assessor_rating
            `)
            .eq(
              'assessment_id',
              selectedReassessment.id
            )
        )
      )
    } else {
      resultQueries.push(
        Promise.resolve({
          data: [],
          error: null,
        })
      )
    }

    const [
      initialResultResponse,
      reassessmentResultResponse,
    ] = await Promise.all(resultQueries)

    if (initialResultResponse.error) {
      setError(
        initialResultResponse.error.message
      )
      setLoading(false)
      return
    }

    if (reassessmentResultResponse.error) {
      setError(
        reassessmentResultResponse.error.message
      )
      setLoading(false)
      return
    }

    setInitialResults(
      (initialResultResponse.data ??
        []) as FceResult[]
    )

    setReassessmentResults(
      (reassessmentResultResponse.data ??
        []) as FceResult[]
    )

    const assessorId =
      selectedReassessment?.assessor_id ||
      loadedInitial?.assessor_id ||
      loadedCase.created_by

    if (assessorId) {
      const {
        data: assessorData,
        error: assessorError,
      } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          profession,
          hpcsa_number,
          practice_name,
          phone,
          email,
          signature_url
        `)
        .eq('id', assessorId)
        .single()

      if (!assessorError && assessorData) {
        const loadedAssessor =
          assessorData as AssessorProfile

        setAssessor(loadedAssessor)

        if (loadedAssessor.signature_url) {
          const {
            data: signedData,
            error: signedError,
          } = await supabase.storage
            .from('signatures')
            .createSignedUrl(
              loadedAssessor.signature_url,
              3600
            )

          if (
            !signedError &&
            signedData?.signedUrl
          ) {
            setSignatureUrl(
              signedData.signedUrl
            )
          }
        }
      }
    }

    setLoading(false)
  }

  const comparisonRows =
    useMemo<ComparisonRow[]>(() => {
      const map =
        new Map<string, ComparisonRow>()

      initialResults.forEach(
        (item) => {
          const key =
            `${item.test_category}|${item.test_name}|${item.side || ''}`

          map.set(key, {
            key,
            category:
              item.test_category,
            name: item.test_name,
            side: item.side,
            preValue:
              item.measured_value,
            preRequired:
              item.required_value,
            preUnit: item.unit,
            preRating:
              item.assessor_rating ||
              item.result,
            postValue: null,
            postRequired: null,
            postUnit: null,
            postRating: null,
          })
        }
      )

      reassessmentResults.forEach(
        (item) => {
          const key =
            `${item.test_category}|${item.test_name}|${item.side || ''}`

          const existing =
            map.get(key)

          if (existing) {
            existing.postValue =
              item.measured_value

            existing.postRequired =
              item.required_value

            existing.postUnit =
              item.unit

            existing.postRating =
              item.assessor_rating ||
              item.result

            map.set(key, existing)
          } else {
            map.set(key, {
              key,
              category:
                item.test_category,
              name: item.test_name,
              side: item.side,
              preValue: null,
              preRequired: null,
              preUnit: null,
              preRating: null,
              postValue:
                item.measured_value,
              postRequired:
                item.required_value,
              postUnit: item.unit,
              postRating:
                item.assessor_rating ||
                item.result,
            })
          }
        }
      )

      return Array.from(
        map.values()
      )
    }, [
      initialResults,
      reassessmentResults,
    ])

  const goalSummary =
    useMemo(() => {
      return {
        total: goals.length,

        achieved:
          goals.filter(
            (goal) =>
              goal.goal_status ===
              'achieved'
          ).length,

        partial:
          goals.filter(
            (goal) =>
              goal.goal_status ===
              'partially_achieved'
          ).length,

        notAchieved:
          goals.filter(
            (goal) =>
              goal.goal_status ===
              'not_achieved'
          ).length,
      }
    }, [goals])

  const postResultSummary =
    useMemo(() => {
      let pass = 0
      let borderline = 0
      let fail = 0
      let notTested = 0

      reassessmentResults.forEach(
        (item) => {
          const rating =
            item.assessor_rating ||
            item.result

          if (rating === 'pass') {
            pass += 1
          } else if (
            rating === 'borderline'
          ) {
            borderline += 1
          } else if (
            rating === 'fail'
          ) {
            fail += 1
          } else {
            notTested += 1
          }
        }
      )

      return {
        pass,
        borderline,
        fail,
        notTested,
      }
    }, [reassessmentResults])

  function formatLabel(
    value:
      | string
      | null
      | undefined
  ) {
    if (!value) {
      return 'Not recorded'
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
      return '—'
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

  function displayValue(
    value: number | null,
    unit: string | null
  ) {
    if (value === null) {
      return '—'
    }

    return `${value}${
      unit ? ` ${unit}` : ''
    }`
  }

  function comparisonChange(
    pre:
      | string
      | null,
    post:
      | string
      | null
  ) {
    const scores:
      Record<string, number> = {
        fail: 1,
        borderline: 2,
        pass: 3,
      }

    if (
      !pre ||
      !post ||
      scores[pre] === undefined ||
      scores[post] === undefined
    ) {
      return 'Not comparable'
    }

    if (
      scores[post] >
      scores[pre]
    ) {
      return 'Improved'
    }

    if (
      scores[post] <
      scores[pre]
    ) {
      return 'Declined'
    }

    return 'Unchanged'
  }

  function printReport() {
    window.print()
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Preparing rehabilitation
          discharge report...
        </p>
      </div>
    )
  }

  if (
    !rehabCase ||
    !worker
  ) {
    return (
      <div className="stack">
        <div className="error-message">
          {error ||
            'The rehabilitation report could not be loaded.'}
        </div>

        <button
          className="secondary-button"
          onClick={() =>
            navigate('/rehabilitation')
          }
        >
          <ArrowLeft size={16} />
          Back to Rehabilitation
        </button>
      </div>
    )
  }

  return (
    <div className="rehab-discharge-report">

      <style>
        {`
          .rehab-report-actions {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
            margin-bottom: 24px;
          }

          .rehab-report-actions-right {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          .rehab-report-page {
            background: white;
            color: #111827;
            max-width: 210mm;
            margin: 0 auto 28px;
            padding: 16mm;
            box-sizing: border-box;
            min-height: 297mm;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          }

          .rehab-report-header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            border-bottom: 2px solid #111827;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }

          .rehab-report-header h1 {
            font-size: 23px;
            line-height: 1.2;
            margin: 4px 0 5px;
            color: #111827;
          }

          .rehab-report-header p {
            margin: 0;
            color: #4b5563;
            font-size: 12px;
          }

          .rehab-report-kicker {
            font-size: 10px;
            letter-spacing: 0.12em;
            font-weight: 800;
            color: #4b5563;
          }

          .rehab-report-meta {
            text-align: right;
            font-size: 11px;
            color: #374151;
            min-width: 150px;
          }

          .rehab-report-section {
            margin-top: 18px;
            break-inside: avoid;
          }

          .rehab-report-section h2 {
            font-size: 14px;
            margin: 0 0 9px;
            padding-bottom: 5px;
            border-bottom: 1px solid #d1d5db;
            color: #111827;
          }

          .rehab-report-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 20px;
          }

          .rehab-report-field {
            display: grid;
            grid-template-columns: 145px 1fr;
            gap: 8px;
            font-size: 11px;
            align-items: start;
          }

          .rehab-report-label {
            font-weight: 700;
            color: #4b5563;
          }

          .rehab-report-value {
            color: #111827;
            word-break: break-word;
          }

          .rehab-report-summary {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 8px;
            margin-top: 10px;
          }

          .rehab-report-summary > div {
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 9px;
          }

          .rehab-report-summary span {
            display: block;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: 0.06em;
            color: #6b7280;
          }

          .rehab-report-summary strong {
            display: block;
            margin-top: 4px;
            font-size: 17px;
            color: #111827;
          }

          .rehab-report-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-top: 7px;
          }

          .rehab-report-table th,
          .rehab-report-table td {
            border: 1px solid #d1d5db;
            padding: 5px 6px;
            text-align: left;
            vertical-align: top;
          }

          .rehab-report-table th {
            background: #f3f4f6;
            font-weight: 800;
            color: #374151;
          }

          .rehab-report-paragraph {
            white-space: pre-wrap;
            font-size: 11px;
            line-height: 1.55;
            color: #111827;
            margin: 0;
          }

          .rehab-report-decision {
            border: 2px solid #111827;
            padding: 13px;
            margin-top: 8px;
            break-inside: avoid;
          }

          .rehab-report-decision strong {
            font-size: 15px;
          }

          .rehab-report-signature {
            display: grid;
            grid-template-columns: 1fr 180px;
            gap: 30px;
            margin-top: 28px;
            align-items: end;
          }

          .rehab-report-signature-image {
            max-width: 150px;
            max-height: 55px;
            object-fit: contain;
            display: block;
            margin-bottom: 4px;
          }

          .rehab-report-signature-line {
            border-top: 1px solid #111827;
            padding-top: 5px;
            font-size: 9px;
            color: #374151;
          }

          .rehab-report-footer {
            margin-top: 22px;
            padding-top: 8px;
            border-top: 1px solid #d1d5db;
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 8px;
            color: #6b7280;
          }

          .rehab-report-note {
            background: #f9fafb;
            border-left: 3px solid #6b7280;
            padding: 9px 11px;
            font-size: 9px;
            line-height: 1.5;
            color: #4b5563;
            margin-top: 14px;
          }

          @media print {
            @page {
              size: A4;
              margin: 0;
            }

            body {
              background: white !important;
            }

            .app-sidebar,
            .app-header,
            .rehab-report-actions {
              display: none !important;
            }

            .app-content,
            main {
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: none !important;
            }

            .rehab-discharge-report {
              margin: 0 !important;
              padding: 0 !important;
            }

            .rehab-report-page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 !important;
              padding: 14mm 15mm;
              box-shadow: none !important;
              page-break-after: always;
              break-after: page;
            }

            .rehab-report-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }

            .rehab-report-section,
            .rehab-report-decision,
            .rehab-report-signature {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      <div className="rehab-report-actions">
        <button
          className="secondary-button"
          onClick={() =>
            navigate(
              `/rehabilitation/${rehabCase.id}`
            )
          }
        >
          <ArrowLeft size={16} />
          Back to Case
        </button>

        <div className="rehab-report-actions-right">
          <button
            className="secondary-button"
            onClick={printReport}
          >
            <Printer size={16} />
            Print Report
          </button>

          <button
            className="primary-button"
            onClick={printReport}
          >
            <Download size={16} />
            Save as PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <section className="rehab-report-page">

        <header className="rehab-report-header">
          <div>
            <div className="rehab-report-kicker">
              SPINESYNC ENTERPRISE
            </div>

            <h1>
              Rehabilitation &
              Return-to-Work Report
            </h1>

            <p>
              Functional rehabilitation,
              reassessment and final
              return-to-work outcome
            </p>
          </div>

          <div className="rehab-report-meta">
            <strong>
              {rehabCase.case_number ||
                `REH-${rehabCase.id
                  .slice(0, 8)
                  .toUpperCase()}`}
            </strong>

            <br />

            Discharge:
            {' '}
            {formatDate(
              rehabCase.actual_reassessment_date
            )}
          </div>
        </header>

        <section className="rehab-report-section">
          <h2>
            1. Worker Identification
          </h2>

          <div className="rehab-report-grid">
            <ReportField
              label="Worker"
              value={`${worker.first_name} ${worker.last_name}`}
            />

            <ReportField
              label="Employee Number"
              value={worker.employee_number}
            />

            <ReportField
              label="Operation"
              value={operation?.name || 'Not assigned'}
            />

            <ReportField
              label="Site / Shaft"
              value={site?.name || 'Not assigned'}
            />

            <ReportField
              label="Department"
              value={department?.name || 'Not assigned'}
            />

            <ReportField
              label="Job Profile"
              value={
                jobProfile?.title ||
                'Not assigned'
              }
            />

            <ReportField
              label="Job Code"
              value={
                jobProfile?.job_code ||
                '—'
              }
            />

            <ReportField
              label="Physical Demand"
              value={formatLabel(
                jobProfile?.physical_demand_level
              )}
            />
          </div>
        </section>

        <section className="rehab-report-section">
          <h2>
            2. Rehabilitation Referral
          </h2>

          <div className="rehab-report-grid">
            <ReportField
              label="Referral Date"
              value={formatDate(
                rehabCase.referral_date
              )}
            />

            <ReportField
              label="Body Region"
              value={
                rehabCase.affected_body_region ||
                'Not recorded'
              }
            />

            <ReportField
              label="Primary Condition"
              value={
                rehabCase.primary_condition ||
                'Not recorded'
              }
            />

            <ReportField
              label="Initial Work Status"
              value={formatLabel(
                rehabCase.initial_work_status
              )}
            />

            <ReportField
              label="Sessions Completed"
              value={`${rehabCase.sessions_completed} / ${
                rehabCase.planned_sessions ??
                '—'
              }`}
            />

            <ReportField
              label="Final Work Status"
              value={formatLabel(
                rehabCase.current_work_status
              )}
            />
          </div>

          {rehabCase.referral_reason && (
            <div
              style={{
                marginTop: 10,
              }}
            >
              <div className="rehab-report-label">
                Referral Reason
              </div>

              <p className="rehab-report-paragraph">
                {rehabCase.referral_reason}
              </p>
            </div>
          )}

          {rehabCase.rehabilitation_goals && (
            <div
              style={{
                marginTop: 10,
              }}
            >
              <div className="rehab-report-label">
                Rehabilitation Goals
              </div>

              <p className="rehab-report-paragraph">
                {rehabCase.rehabilitation_goals}
              </p>
            </div>
          )}
        </section>

        <section className="rehab-report-section">
          <h2>
            3. Functional Capacity
            Assessment Summary
          </h2>

          <div className="rehab-report-grid">
            <ReportField
              label="Initial FCE"
              value={formatDate(
                initialAssessment?.assessment_date
              )}
            />

            <ReportField
              label="Initial Outcome"
              value={formatLabel(
                initialAssessment?.final_outcome
              )}
            />

            <ReportField
              label="Post-Rehab FCE"
              value={formatDate(
                reassessment?.assessment_date
              )}
            />

            <ReportField
              label="Post-Rehab Outcome"
              value={formatLabel(
                reassessment?.final_outcome
              )}
            />

            <ReportField
              label="Initial Pain"
              value={
                initialAssessment?.pain_score !==
                null &&
                initialAssessment?.pain_score !==
                undefined
                  ? `${initialAssessment.pain_score}/10`
                  : '—'
              }
            />

            <ReportField
              label="Post-Rehab Pain"
              value={
                reassessment?.pain_score !==
                null &&
                reassessment?.pain_score !==
                undefined
                  ? `${reassessment.pain_score}/10`
                  : '—'
              }
            />
          </div>

          <div className="rehab-report-summary">
            <div>
              <span>
                POST-FCE PASS
              </span>

              <strong>
                {postResultSummary.pass}
              </strong>
            </div>

            <div>
              <span>
                BORDERLINE
              </span>

              <strong>
                {postResultSummary.borderline}
              </strong>
            </div>

            <div>
              <span>
                FAILED
              </span>

              <strong>
                {postResultSummary.fail}
              </strong>
            </div>

            <div>
              <span>
                NOT TESTED
              </span>

              <strong>
                {postResultSummary.notTested}
              </strong>
            </div>
          </div>
        </section>

        <section className="rehab-report-section">
          <h2>
            4. Rehabilitation Goals
          </h2>

          {goals.length === 0 ? (
            <p className="rehab-report-paragraph">
              No measurable rehabilitation
              goals were recorded.
            </p>
          ) : (
            <>
              <div className="rehab-report-summary">
                <div>
                  <span>
                    TOTAL GOALS
                  </span>

                  <strong>
                    {goalSummary.total}
                  </strong>
                </div>

                <div>
                  <span>
                    ACHIEVED
                  </span>

                  <strong>
                    {goalSummary.achieved}
                  </strong>
                </div>

                <div>
                  <span>
                    PARTIAL
                  </span>

                  <strong>
                    {goalSummary.partial}
                  </strong>
                </div>

                <div>
                  <span>
                    NOT ACHIEVED
                  </span>

                  <strong>
                    {goalSummary.notAchieved}
                  </strong>
                </div>
              </div>

              <table className="rehab-report-table">
                <thead>
                  <tr>
                    <th>Goal</th>
                    <th>Baseline</th>
                    <th>Current</th>
                    <th>Target</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {goals.map(
                    (goal) => (
                      <tr key={goal.id}>
                        <td>
                          {goal.goal_description}
                        </td>

                        <td>
                          {displayValue(
                            goal.baseline_value,
                            goal.target_unit
                          )}
                        </td>

                        <td>
                          {displayValue(
                            goal.current_value,
                            goal.target_unit
                          )}
                        </td>

                        <td>
                          {displayValue(
                            goal.target_value,
                            goal.target_unit
                          )}
                        </td>

                        <td>
                          {formatLabel(
                            goal.goal_status
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </>
          )}
        </section>

        <footer className="rehab-report-footer">
          <span>
            SpineSync Enterprise —
            Rehabilitation & RTW Report
          </span>

          <span>
            Page 1
          </span>
        </footer>

      </section>

      <section className="rehab-report-page">

        <header className="rehab-report-header">
          <div>
            <div className="rehab-report-kicker">
              SPINESYNC ENTERPRISE
            </div>

            <h1>
              Functional Progress &
              Final Decision
            </h1>

            <p>
              {worker.first_name}{' '}
              {worker.last_name}
              {' • '}
              {worker.employee_number}
            </p>
          </div>

          <div className="rehab-report-meta">
            {rehabCase.case_number ||
              `REH-${rehabCase.id
                .slice(0, 8)
                .toUpperCase()}`}
          </div>
        </header>

        <section className="rehab-report-section">
          <h2>
            5. Initial vs
            Post-Rehabilitation FCE
          </h2>

          {comparisonRows.length === 0 ? (
            <p className="rehab-report-paragraph">
              No comparable FCE results
              are available.
            </p>
          ) : (
            <table className="rehab-report-table">
              <thead>
                <tr>
                  <th>Test</th>
                  <th>Initial</th>
                  <th>Initial Rating</th>
                  <th>Post-Rehab</th>
                  <th>Post Rating</th>
                  <th>Change</th>
                </tr>
              </thead>

              <tbody>
                {comparisonRows.map(
                  (row) => (
                    <tr key={row.key}>
                      <td>
                        <strong>
                          {row.name}
                        </strong>

                        {row.side && (
                          <>
                            <br />
                            {row.side}
                          </>
                        )}
                      </td>

                      <td>
                        {displayValue(
                          row.preValue,
                          row.preUnit
                        )}
                      </td>

                      <td>
                        {formatLabel(
                          row.preRating
                        )}
                      </td>

                      <td>
                        {displayValue(
                          row.postValue,
                          row.postUnit
                        )}
                      </td>

                      <td>
                        {formatLabel(
                          row.postRating
                        )}
                      </td>

                      <td>
                        {comparisonChange(
                          row.preRating,
                          row.postRating
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}

          <div className="rehab-report-note">
            Numerical values are shown
            where recorded. Improvement
            classification is based on
            the recorded pass,
            borderline or fail
            assessment ratings rather
            than numerical change alone.
          </div>
        </section>

        <section className="rehab-report-section">
          <h2>
            6. Rehabilitation Session
            Progress
          </h2>

          {sessions.length === 0 ? (
            <p className="rehab-report-paragraph">
              No rehabilitation sessions
              were recorded.
            </p>
          ) : (
            <table className="rehab-report-table">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Date</th>
                  <th>Pain</th>
                  <th>Functional Progress</th>
                  <th>Work Capacity Progress</th>
                </tr>
              </thead>

              <tbody>
                {sessions.map(
                  (session) => (
                    <tr key={session.id}>
                      <td>
                        {session.session_number ??
                          '—'}
                      </td>

                      <td>
                        {formatDate(
                          session.session_date
                        )}
                      </td>

                      <td>
                        {session.pain_score !==
                        null
                          ? `${session.pain_score}/10`
                          : '—'}
                      </td>

                      <td>
                        {session.functional_progress ||
                          '—'}
                      </td>

                      <td>
                        {session.work_capacity_progress ||
                          '—'}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </section>

        <section className="rehab-report-section">
          <h2>
            7. Final Return-to-Work
            Decision
          </h2>

          <div className="rehab-report-decision">
            <div className="rehab-report-label">
              Final RTW Outcome
            </div>

            <strong>
              {formatLabel(
                rehabCase.discharge_outcome
              )}
            </strong>

            <div
              style={{
                marginTop: 10,
              }}
            >
              <ReportField
                label="Final Work Status"
                value={formatLabel(
                  rehabCase.current_work_status
                )}
              />

              <ReportField
                label="Worker Fitness Status"
                value={formatLabel(
                  worker.fitness_status
                )}
              />

              <ReportField
                label="Reassessment Date"
                value={formatDate(
                  rehabCase.actual_reassessment_date
                )}
              />
            </div>
          </div>
        </section>

        <section className="rehab-report-section">
          <h2>
            8. Final Restrictions
          </h2>

          <p className="rehab-report-paragraph">
            {rehabCase.restrictions ||
              'No final restrictions recorded.'}
          </p>
        </section>

        <section className="rehab-report-section">
          <h2>
            9. Recommendations
          </h2>

          <p className="rehab-report-paragraph">
            {rehabCase.discharge_recommendations ||
              'No final recommendations recorded.'}
          </p>
        </section>

        <section className="rehab-report-section">
          <h2>
            10. Discharge Summary
          </h2>

          <p className="rehab-report-paragraph">
            {rehabCase.discharge_summary ||
              'No discharge summary recorded.'}
          </p>
        </section>

        <section className="rehab-report-section">
          <h2>
            11. Professional Declaration
          </h2>

          <p className="rehab-report-paragraph">
            This report records the
            worker's rehabilitation
            progress, functional
            reassessment findings and
            return-to-work decision.
            Functional capacity findings
            should be interpreted
            together with the worker's
            clinical presentation,
            occupational demands and
            applicable occupational
            health requirements. The
            final professional decision
            remains the responsibility
            of the appropriately
            registered practitioner.
          </p>

          <div className="rehab-report-signature">
            <div>
              {signatureUrl && (
                <img
                  src={signatureUrl}
                  alt="Assessor signature"
                  className="rehab-report-signature-image"
                />
              )}

              <div className="rehab-report-signature-line">
                Practitioner Signature
              </div>
            </div>

            <div>
              <strong>
                {assessor?.full_name ||
                  'Assessor'}
              </strong>

              <br />

              {assessor?.profession &&
                (
                  <>
                    {assessor.profession}
                    <br />
                  </>
                )}

              {assessor?.hpcsa_number &&
                (
                  <>
                    HPCSA:{' '}
                    {assessor.hpcsa_number}
                    <br />
                  </>
                )}

              {assessor?.practice_name &&
                (
                  <>
                    {assessor.practice_name}
                  </>
                )}
            </div>
          </div>
        </section>

        <div className="rehab-report-note">
          Generated from recorded
          SpineSync rehabilitation and
          FCE data. This document is a
          clinical and occupational
          record and does not replace
          statutory medical surveillance
          or certifications required by
          applicable occupational-health
          legislation.
        </div>

        <footer className="rehab-report-footer">
          <span>
            SpineSync Enterprise —
            Rehabilitation & RTW Report
          </span>

          <span>
            Page 2
          </span>
        </footer>

      </section>

    </div>
  )
}

function ReportField({
  label,
  value,
}: {
  label: string
  value:
    | string
    | number
    | null
    | undefined
}) {
  return (
    <div className="rehab-report-field">
      <div className="rehab-report-label">
        {label}
      </div>

      <div className="rehab-report-value">
        {value === null ||
        value === undefined ||
        value === ''
          ? '—'
          : value}
      </div>
    </div>
  )
}
