import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Search,
  Target,
  Users,
} from 'lucide-react'

import { supabase } from '../lib/supabase'

type Profile = {
  organisation_id: string | null
}

type Operation = {
  id: string
  name: string
}

type Site = {
  id: string
  operation_id: string
  name: string
}

type Department = {
  id: string
  site_id: string
  name: string
}

type JobProfile = {
  id: string
  title: string | null
  job_code: string | null
}

type Worker = {
  id: string
  organisation_id: string
  operation_id: string | null
  site_id: string | null
  department_id: string | null
  job_profile_id: string | null
  employee_number: string | null
  first_name: string | null
  last_name: string | null
  employment_status: string | null
  fitness_status: string | null
}

function workerName(worker: Worker) {
  const name = [
    worker.first_name,
    worker.last_name,
  ]
    .filter(Boolean)
    .join(' ')

  return name || 'Unnamed worker'
}

function jobProfileLabel(profile: JobProfile) {
  if (profile.title && profile.job_code) {
    return `${profile.title} (${profile.job_code})`
  }

  return profile.title ?? profile.job_code ?? 'Unnamed job profile'
}

export default function NewMskCampaign() {
  const navigate = useNavigate()

  const [organisationId, setOrganisationId] =
    useState('')

  const [operations, setOperations] = useState<
    Operation[]
  >([])

  const [sites, setSites] = useState<Site[]>([])
  const [departments, setDepartments] = useState<
    Department[]
  >([])
  const [jobProfiles, setJobProfiles] = useState<
    JobProfile[]
  >([])
  const [workers, setWorkers] = useState<Worker[]>([])

  const [campaignName, setCampaignName] = useState('')
  const [campaignCode, setCampaignCode] = useState('')
  const [description, setDescription] = useState('')

  const [campaignType, setCampaignType] =
    useState('periodic')

  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [endDate, setEndDate] = useState('')

  const [operationId, setOperationId] = useState('')
  const [siteId, setSiteId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [jobProfileId, setJobProfileId] = useState('')

  const [selectedWorkers, setSelectedWorkers] = useState<
    string[]
  >([])

  const [workerSearch, setWorkerSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error('No authenticated user found.')
      }

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('organisation_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw profileError
      }

      const profile = profileData as Profile

      if (!profile.organisation_id) {
        throw new Error(
          'Your account is not linked to an organisation.'
        )
      }

      setOrganisationId(profile.organisation_id)

      const [
        operationsResult,
        sitesResult,
        jobProfilesResult,
        workersResult,
      ] = await Promise.all([
        supabase
          .from('operations')
          .select('id, name')
          .eq(
            'organisation_id',
            profile.organisation_id
          )
          .order('name'),

        supabase
          .from('sites')
          .select('id, operation_id, name')
          .order('name'),

        supabase
          .from('job_profiles')
          .select('id, title, job_code')
          .eq(
            'organisation_id',
            profile.organisation_id
          )
          .order('title'),

        supabase
          .from('workers')
          .select(`
            id,
            organisation_id,
            operation_id,
            site_id,
            department_id,
            job_profile_id,
            employee_number,
            first_name,
            last_name,
            employment_status,
            fitness_status
          `)
          .eq(
            'organisation_id',
            profile.organisation_id
          )
          .order('last_name'),
      ])

      if (operationsResult.error) {
        throw operationsResult.error
      }

      if (sitesResult.error) {
        throw sitesResult.error
      }

      if (jobProfilesResult.error) {
        throw jobProfilesResult.error
      }

      if (workersResult.error) {
        throw workersResult.error
      }

      const loadedSites =
        (sitesResult.data ?? []) as Site[]

      setOperations(
        (operationsResult.data ?? []) as Operation[]
      )

      setSites(loadedSites)

      setJobProfiles(
        (jobProfilesResult.data ?? []) as JobProfile[]
      )

      setWorkers(
        (workersResult.data ?? []) as Worker[]
      )

      const siteIds = loadedSites.map((site) => site.id)

      if (siteIds.length > 0) {
        const {
          data: departmentData,
          error: departmentError,
        } = await supabase
          .from('departments')
          .select('id, site_id, name')
          .in('site_id', siteIds)
          .order('name')

        if (departmentError) {
          throw departmentError
        }

        setDepartments(
          (departmentData ?? []) as Department[]
        )
      }
    } catch (err) {
      console.error('Campaign setup load error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load campaign setup.'
      )
    } finally {
      setLoading(false)
    }
  }

  const availableSites = useMemo(() => {
    if (!operationId) {
      return sites
    }

    return sites.filter(
      (site) => site.operation_id === operationId
    )
  }, [sites, operationId])

  const availableDepartments = useMemo(() => {
    if (!siteId) {
      return []
    }

    return departments.filter(
      (department) => department.site_id === siteId
    )
  }, [departments, siteId])

  const eligibleWorkers = useMemo(() => {
    const query = workerSearch.trim().toLowerCase()

    return workers.filter((worker) => {
      if (
        operationId &&
        worker.operation_id !== operationId
      ) {
        return false
      }

      if (
        siteId &&
        worker.site_id !== siteId
      ) {
        return false
      }

      if (
        departmentId &&
        worker.department_id !== departmentId
      ) {
        return false
      }

      if (
        jobProfileId &&
        worker.job_profile_id !== jobProfileId
      ) {
        return false
      }

      if (!query) {
        return true
      }

      const searchable = [
        worker.first_name ?? '',
        worker.last_name ?? '',
        worker.employee_number ?? '',
        worker.employment_status ?? '',
        worker.fitness_status ?? '',
      ]
        .join(' ')
        .toLowerCase()

      return searchable.includes(query)
    })
  }, [
    workers,
    operationId,
    siteId,
    departmentId,
    jobProfileId,
    workerSearch,
  ])

  const allEligibleSelected =
    eligibleWorkers.length > 0 &&
    eligibleWorkers.every((worker) =>
      selectedWorkers.includes(worker.id)
    )

  function handleOperationChange(value: string) {
    setOperationId(value)
    setSiteId('')
    setDepartmentId('')
  }

  function handleSiteChange(value: string) {
    setSiteId(value)
    setDepartmentId('')
  }

  function toggleWorker(workerId: string) {
    setSelectedWorkers((current) => {
      if (current.includes(workerId)) {
        return current.filter((id) => id !== workerId)
      }

      return [...current, workerId]
    })
  }

  function selectAllEligible() {
    const eligibleIds = eligibleWorkers.map(
      (worker) => worker.id
    )

    if (allEligibleSelected) {
      setSelectedWorkers((current) =>
        current.filter(
          (id) => !eligibleIds.includes(id)
        )
      )

      return
    }

    setSelectedWorkers((current) => [
      ...new Set([...current, ...eligibleIds]),
    ])
  }

  async function saveCampaign(
    status: 'draft' | 'active'
  ) {
    try {
      setError('')

      if (!campaignName.trim()) {
        setError('Campaign name is required.')
        return
      }

      if (!startDate) {
        setError('Campaign start date is required.')
        return
      }

      if (
        endDate &&
        new Date(endDate) < new Date(startDate)
      ) {
        setError(
          'Campaign end date cannot be before the start date.'
        )
        return
      }

      if (
        status === 'active' &&
        selectedWorkers.length === 0
      ) {
        setError(
          'Select at least one worker before activating the campaign.'
        )
        return
      }

      if (!organisationId) {
        setError(
          'Organisation information is unavailable.'
        )
        return
      }

      setSaving(true)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        throw new Error('No authenticated user found.')
      }

      const {
        data: campaignData,
        error: campaignError,
      } = await supabase
        .from('msk_screening_campaigns')
        .insert({
          organisation_id: organisationId,
          created_by: user.id,
          campaign_name: campaignName.trim(),
          campaign_code:
            campaignCode.trim() || null,
          description:
            description.trim() || null,
          campaign_type: campaignType,
          start_date: startDate,
          end_date: endDate || null,
          operation_id: operationId || null,
          site_id: siteId || null,
          department_id: departmentId || null,
          job_profile_id: jobProfileId || null,
          campaign_status: status,
          target_workers: selectedWorkers.length,
        })
        .select('id')
        .single()

      if (campaignError) {
        throw campaignError
      }

      if (!campaignData?.id) {
        throw new Error(
          'Campaign was created but no campaign ID was returned.'
        )
      }

      if (selectedWorkers.length > 0) {
        const assignments = selectedWorkers.map(
          (workerId) => ({
            campaign_id: campaignData.id,
            worker_id: workerId,
            assignment_status: 'pending',
          })
        )

        const { error: assignmentError } =
          await supabase
            .from('msk_campaign_workers')
            .insert(assignments)

        if (assignmentError) {
          /*
           * Remove the campaign if worker assignment fails,
           * preventing an incomplete campaign record.
           */
          await supabase
            .from('msk_screening_campaigns')
            .delete()
            .eq('id', campaignData.id)

          throw assignmentError
        }
      }

      navigate('/msk-campaigns')
    } catch (err) {
      console.error('Campaign save error:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create screening campaign.'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>New MSK Screening Campaign</h1>
            <p>Loading campaign setup...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/msk-campaigns')}
            style={{ marginBottom: '14px' }}
          >
            <ArrowLeft size={17} />
            Campaigns
          </button>

          <h1>New MSK Screening Campaign</h1>

          <p>
            Define the workforce group and assign workers
            for proactive musculoskeletal screening.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1fr) minmax(300px, 380px)',
          gap: '20px',
          alignItems: 'start',
        }}
      >
        <div
          style={{
            display: 'grid',
            gap: '20px',
          }}
        >
          <div className="card">
            <h2>Campaign Details</h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              <label>
                Campaign name *

                <input
                  type="text"
                  value={campaignName}
                  onChange={(event) =>
                    setCampaignName(event.target.value)
                  }
                  placeholder="e.g. Q4 Underground MSK Screening"
                />
              </label>

              <label>
                Campaign code

                <input
                  type="text"
                  value={campaignCode}
                  onChange={(event) =>
                    setCampaignCode(event.target.value)
                  }
                  placeholder="e.g. MSK-Q4-2026"
                />
              </label>

              <label>
                Screening type

                <select
                  value={campaignType}
                  onChange={(event) =>
                    setCampaignType(event.target.value)
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

              <label>
                Start date *

                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setStartDate(event.target.value)
                  }
                />
              </label>

              <label>
                End date

                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(event) =>
                    setEndDate(event.target.value)
                  }
                />
              </label>
            </div>

            <label
              style={{
                display: 'block',
                marginTop: '16px',
              }}
            >
              Description

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={3}
                placeholder="Purpose or scope of this screening campaign..."
                style={{ width: '100%' }}
              />
            </label>
          </div>

          <div className="card">
            <h2>Target Workforce</h2>

            <p>
              Narrow the worker population using the mining
              structure. Leaving a field blank keeps the
              campaign broader.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '16px',
              }}
            >
              <label>
                Operation

                <select
                  value={operationId}
                  onChange={(event) =>
                    handleOperationChange(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All operations
                  </option>

                  {operations.map((operation) => (
                    <option
                      key={operation.id}
                      value={operation.id}
                    >
                      {operation.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Site

                <select
                  value={siteId}
                  disabled={!operationId}
                  onChange={(event) =>
                    handleSiteChange(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All sites
                  </option>

                  {availableSites.map((site) => (
                    <option
                      key={site.id}
                      value={site.id}
                    >
                      {site.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Department

                <select
                  value={departmentId}
                  disabled={!siteId}
                  onChange={(event) =>
                    setDepartmentId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All departments
                  </option>

                  {availableDepartments.map(
                    (department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label>
                Job profile

                <select
                  value={jobProfileId}
                  onChange={(event) =>
                    setJobProfileId(
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    All job profiles
                  </option>

                  {jobProfiles.map((profile) => (
                    <option
                      key={profile.id}
                      value={profile.id}
                    >
                      {jobProfileLabel(profile)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <h2 style={{ marginBottom: '4px' }}>
                  Assign Workers
                </h2>

                <p style={{ margin: 0 }}>
                  {eligibleWorkers.length} workers match the
                  current filters.
                </p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={selectAllEligible}
                disabled={eligibleWorkers.length === 0}
              >
                <Check size={17} />

                {allEligibleSelected
                  ? 'Clear Matching'
                  : 'Select All Matching'}
              </button>
            </div>

            <div
              style={{
                position: 'relative',
                marginTop: '18px',
                marginBottom: '16px',
              }}
            >
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.55,
                }}
              />

              <input
                type="text"
                value={workerSearch}
                onChange={(event) =>
                  setWorkerSearch(event.target.value)
                }
                placeholder="Search worker name or employee number..."
                style={{
                  width: '100%',
                  paddingLeft: '42px',
                }}
              />
            </div>

            {eligibleWorkers.length === 0 ? (
              <div
                style={{
                  padding: '30px',
                  textAlign: 'center',
                  opacity: 0.7,
                }}
              >
                No workers match the selected criteria.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gap: '8px',
                  maxHeight: '460px',
                  overflowY: 'auto',
                }}
              >
                {eligibleWorkers.map((worker) => {
                  const selected =
                    selectedWorkers.includes(worker.id)

                  const profile = jobProfiles.find(
                    (item) =>
                      item.id === worker.job_profile_id
                  )

                  return (
                    <label
                      key={worker.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        border:
                          '1px solid rgba(15, 23, 42, 0.1)',
                        borderRadius: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleWorker(worker.id)
                        }
                      />

                      <div style={{ flex: 1 }}>
                        <strong>
                          {workerName(worker)}
                        </strong>

                        <div
                          style={{
                            marginTop: '3px',
                            fontSize: '13px',
                            opacity: 0.7,
                          }}
                        >
                          {worker.employee_number
                            ? `Employee ${worker.employee_number}`
                            : 'No employee number'}

                          {profile &&
                            ` • ${jobProfileLabel(
                              profile
                            )}`}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className="card"
          style={{
            position: 'sticky',
            top: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Target size={22} />
            <h2 style={{ margin: 0 }}>
              Campaign Summary
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '16px',
              marginTop: '22px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '13px',
                  opacity: 0.65,
                }}
              >
                Campaign
              </div>

              <strong>
                {campaignName || 'Not named yet'}
              </strong>
            </div>

            <div>
              <div
                style={{
                  fontSize: '13px',
                  opacity: 0.65,
                }}
              >
                Matching workers
              </div>

              <strong>
                {eligibleWorkers.length}
              </strong>
            </div>

            <div>
              <div
                style={{
                  fontSize: '13px',
                  opacity: 0.65,
                }}
              >
                Workers selected
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Users size={18} />

                <strong
                  style={{
                    fontSize: '24px',
                  }}
                >
                  {selectedWorkers.length}
                </strong>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: '13px',
                  opacity: 0.65,
                }}
              >
                Screening type
              </div>

              <strong>
                {campaignType
                  .split('_')
                  .join(' ')
                  .replace(
                    /\b\w/g,
                    (letter: string) =>
                      letter.toUpperCase()
                  )}
              </strong>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: '10px',
              marginTop: '26px',
            }}
          >
            <button
              type="button"
              className="primary-button"
              disabled={saving}
              onClick={() =>
                void saveCampaign('active')
              }
              style={{
                width: '100%',
                justifyContent: 'center',
              }}
            >
              {saving
                ? 'Creating...'
                : 'Create & Activate Campaign'}
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={saving}
              onClick={() =>
                void saveCampaign('draft')
              }
              style={{
                width: '100%',
                justifyContent: 'center',
              }}
            >
              Save as Draft
            </button>

            <button
              type="button"
              className="secondary-button"
              disabled={saving}
              onClick={() =>
                navigate('/msk-campaigns')
              }
              style={{
                width: '100%',
                justifyContent: 'center',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
