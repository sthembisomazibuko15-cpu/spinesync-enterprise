import {
  Activity,
  FileCheck2,
  History,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { supabase } from '../lib/supabase'

type AuditEntry = {
  id: string
  organisation_id: string
  user_id: string | null
  record_type: string
  record_id: string
  action: string
  description: string | null
  previous_data: Record<
    string,
    unknown
  > | null
  new_data: Record<
    string,
    unknown
  > | null
  created_at: string
}

type Profile = {
  id: string
  full_name: string | null
  profession: string | null
  hpcsa_number: string | null
}

type Worker = {
  id: string
  employee_number: string
  first_name: string
  last_name: string
}

type DisplayEntry = AuditEntry & {
  practitioner: Profile | null
  worker: Worker | null
  reference: string
}

export default function AuditTrail() {
  const [entries, setEntries] =
    useState<AuditEntry[]>([])

  const [profiles, setProfiles] =
    useState<Profile[]>([])

  const [workers, setWorkers] =
    useState<Worker[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  const [search, setSearch] =
    useState('')

  const [recordFilter, setRecordFilter] =
    useState('all')

  useEffect(() => {
    loadAuditTrail()
  }, [])

  async function loadAuditTrail() {
    setLoading(true)
    setError(null)

    const {
      data: userData,
      error: userError,
    } = await supabase.auth.getUser()

    if (
      userError ||
      !userData.user
    ) {
      setError(
        'Unable to identify the signed-in user.'
      )
      setLoading(false)
      return
    }

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('organisation_id')
      .eq(
        'id',
        userData.user.id
      )
      .single()

    if (
      profileError ||
      !profileData?.organisation_id
    ) {
      setError(
        profileError?.message ||
          'Organisation could not be identified.'
      )
      setLoading(false)
      return
    }

    const organisationId =
      profileData.organisation_id

    const [
      auditResponse,
      profilesResponse,
      workersResponse,
    ] = await Promise.all([
      supabase
        .from('clinical_audit_log')
        .select(`
          id,
          organisation_id,
          user_id,
          record_type,
          record_id,
          action,
          description,
          previous_data,
          new_data,
          created_at
        `)
        .eq(
          'organisation_id',
          organisationId
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        ),

      supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          profession,
          hpcsa_number
        `)
        .eq(
          'organisation_id',
          organisationId
        ),

      supabase
        .from('workers')
        .select(`
          id,
          employee_number,
          first_name,
          last_name
        `)
        .eq(
          'organisation_id',
          organisationId
        ),
    ])

    if (auditResponse.error) {
      setError(
        auditResponse.error.message
      )
      setLoading(false)
      return
    }

    if (profilesResponse.error) {
      setError(
        profilesResponse.error.message
      )
      setLoading(false)
      return
    }

    if (workersResponse.error) {
      setError(
        workersResponse.error.message
      )
      setLoading(false)
      return
    }

    setEntries(
      (auditResponse.data ??
        []) as AuditEntry[]
    )

    setProfiles(
      (profilesResponse.data ??
        []) as Profile[]
    )

    setWorkers(
      (workersResponse.data ??
        []) as Worker[]
    )

    setLoading(false)
  }

  function getStringValue(
    data:
      | Record<string, unknown>
      | null,
    key: string
  ) {
    const value = data?.[key]

    return typeof value ===
      'string'
      ? value
      : null
  }

  const displayEntries =
    useMemo<DisplayEntry[]>(() => {
      return entries.map(
        (entry) => {
          const practitioner =
            profiles.find(
              (profile) =>
                profile.id ===
                entry.user_id
            ) || null

          const newWorkerId =
            getStringValue(
              entry.new_data,
              'worker_id'
            )

          const previousWorkerId =
            getStringValue(
              entry.previous_data,
              'worker_id'
            )

          const workerId =
            newWorkerId ||
            previousWorkerId

          const worker =
            workers.find(
              (item) =>
                item.id === workerId
            ) || null

          let reference =
            entry.record_id
              .slice(0, 8)
              .toUpperCase()

          if (
            entry.record_type ===
            'rehabilitation_case'
          ) {
            const caseNumber =
              getStringValue(
                entry.new_data,
                'case_number'
              ) ||
              getStringValue(
                entry.previous_data,
                'case_number'
              )

            reference =
              caseNumber ||
              `REH-${reference}`
          }

          if (
            entry.record_type ===
            'assessment'
          ) {
            reference =
              `FCE-${reference}`
          }

          return {
            ...entry,
            practitioner,
            worker,
            reference,
          }
        }
      )
    }, [
      entries,
      profiles,
      workers,
    ])

  const filteredEntries =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase()

      return displayEntries.filter(
        (entry) => {
          if (
            recordFilter !==
              'all' &&
            entry.record_type !==
              recordFilter
          ) {
            return false
          }

          if (!term) {
            return true
          }

          const searchable = [
            entry.reference,
            entry.record_type,
            entry.action,
            entry.description,
            entry.practitioner
              ?.full_name,
            entry.practitioner
              ?.profession,
            entry.worker
              ?.first_name,
            entry.worker
              ?.last_name,
            entry.worker
              ?.employee_number,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()

          return searchable.includes(
            term
          )
        }
      )
    }, [
      displayEntries,
      search,
      recordFilter,
    ])

  const summary =
    useMemo(() => {
      return {
        total: entries.length,

        assessments:
          entries.filter(
            (entry) =>
              entry.record_type ===
              'assessment'
          ).length,

        rehabilitation:
          entries.filter(
            (entry) =>
              entry.record_type ===
              'rehabilitation_case'
          ).length,

        completed:
          entries.filter(
            (entry) =>
              entry.action ===
              'completed'
          ).length,
      }
    }, [entries])

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

  function formatDateTime(
    value: string
  ) {
    return new Date(
      value
    ).toLocaleString(
      'en-ZA',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )
  }

  function practitionerName(
    entry: DisplayEntry
  ) {
    if (
      entry.practitioner
        ?.full_name
    ) {
      return entry.practitioner
        .full_name
    }

    if (entry.user_id) {
      return 'Authenticated User'
    }

    return 'System'
  }

  function recordIcon(
    recordType: string
  ) {
    if (
      recordType ===
      'assessment'
    ) {
      return (
        <FileCheck2 size={17} />
      )
    }

    if (
      recordType ===
      'rehabilitation_case'
    ) {
      return (
        <Activity size={17} />
      )
    }

    return (
      <History size={17} />
    )
  }

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />

        <p>
          Loading clinical audit
          trail...
        </p>
      </div>
    )
  }

  return (
    <div className="stack">

      <div className="page-heading">
        <div>
          <span className="eyebrow">
            CLINICAL GOVERNANCE
          </span>

          <h1>
            Clinical Audit Trail
          </h1>

          <p>
            Trace completed clinical
            records, responsible
            practitioners and record
            locking events.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={loadAuditTrail}
        >
          <History size={16} />
          Refresh Audit Trail
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="fce-summary-row">

        <div>
          <History size={18} />

          <span>
            AUDIT EVENTS
          </span>

          <strong>
            {summary.total}
          </strong>
        </div>

        <div>
          <FileCheck2 size={18} />

          <span>
            FCE RECORDS
          </span>

          <strong>
            {summary.assessments}
          </strong>
        </div>

        <div>
          <Activity size={18} />

          <span>
            REHAB RECORDS
          </span>

          <strong>
            {summary.rehabilitation}
          </strong>
        </div>

        <div>
          <LockKeyhole size={18} />

          <span>
            COMPLETION EVENTS
          </span>

          <strong>
            {summary.completed}
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
              Clinical Record History
            </h2>

            <p>
              Organisation-level audit
              history for completed FCE
              and rehabilitation
              records.
            </p>
          </div>

        </div>

        <div
          className="form-grid"
          style={{
            marginTop: 20,
            marginBottom: 20,
          }}
        >

          <label>
            <span>
              Search Audit Trail
            </span>

            <div
              style={{
                position: 'relative',
              }}
            >
              <Search
                size={16}
                style={{
                  position:
                    'absolute',
                  left: 12,
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  pointerEvents:
                    'none',
                }}
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Worker, employee number, practitioner or reference"
                style={{
                  paddingLeft: 38,
                }}
              />
            </div>
          </label>

          <label>
            <span>
              Record Type
            </span>

            <select
              value={recordFilter}
              onChange={(event) =>
                setRecordFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Records
              </option>

              <option value="assessment">
                Functional Capacity
                Evaluations
              </option>

              <option value="rehabilitation_case">
                Rehabilitation Cases
              </option>
            </select>
          </label>

        </div>

        {filteredEntries.length ===
        0 ? (
          <div
            style={{
              padding: '30px 0',
              textAlign: 'center',
            }}
          >
            <History
              size={32}
              style={{
                marginBottom: 10,
              }}
            />

            <h3>
              No audit events found
            </h3>

            <p>
              Completion events will
              appear here when FCE or
              rehabilitation records
              are completed.
            </p>
          </div>
        ) : (
          <div className="fce-report-table-wrap">

            <table className="fce-report-table">

              <thead>
                <tr>
                  <th>
                    Date & Time
                  </th>

                  <th>
                    Record
                  </th>

                  <th>
                    Worker
                  </th>

                  <th>
                    Action
                  </th>

                  <th>
                    Practitioner
                  </th>

                  <th>
                    Description
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredEntries.map(
                  (entry) => (
                    <tr
                      key={entry.id}
                    >
                      <td>
                        {formatDateTime(
                          entry.created_at
                        )}
                      </td>

                      <td>
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 8,
                            alignItems:
                              'center',
                          }}
                        >
                          {recordIcon(
                            entry.record_type
                          )}

                          <div>
                            <strong>
                              {
                                entry.reference
                              }
                            </strong>

                            <div
                              style={{
                                fontSize:
                                  12,
                              }}
                            >
                              {formatLabel(
                                entry.record_type
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        {entry.worker ? (
                          <>
                            <strong>
                              {
                                entry
                                  .worker
                                  .first_name
                              }{' '}
                              {
                                entry
                                  .worker
                                  .last_name
                              }
                            </strong>

                            <div
                              style={{
                                fontSize:
                                  12,
                              }}
                            >
                              {
                                entry
                                  .worker
                                  .employee_number
                              }
                            </div>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td>
                        <strong>
                          {formatLabel(
                            entry.action
                          )}
                        </strong>
                      </td>

                      <td>
                        <div
                          style={{
                            display:
                              'flex',
                            gap: 8,
                            alignItems:
                              'center',
                          }}
                        >
                          <UserRound
                            size={16}
                          />

                          <div>
                            <strong>
                              {practitionerName(
                                entry
                              )}
                            </strong>

                            {entry
                              .practitioner
                              ?.profession && (
                              <div
                                style={{
                                  fontSize:
                                    12,
                                }}
                              >
                                {
                                  entry
                                    .practitioner
                                    .profession
                                }
                              </div>
                            )}

                            {entry
                              .practitioner
                              ?.hpcsa_number && (
                              <div
                                style={{
                                  fontSize:
                                    11,
                                }}
                              >
                                HPCSA:{' '}
                                {
                                  entry
                                    .practitioner
                                    .hpcsa_number
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        {entry.description ||
                          '—'}
                      </td>
                    </tr>
                  )
                )}
              </tbody>

            </table>

          </div>
        )}

      </div>

      <div className="panel">

        <div className="assessment-section-title">

          <div className="assessment-section-icon">
            <LockKeyhole
              size={20}
            />
          </div>

          <div>
            <h2>
              Clinical Record
              Integrity
            </h2>

            <p>
              Audit records provide a
              traceable history of
              clinical completion
              events.
            </p>
          </div>

        </div>

        <p>
          Completed FCE and
          rehabilitation records are
          stamped with the practitioner
          responsible for completion
          and the completion time.
        </p>

        <p>
          The audit history is retained
          separately from the clinical
          record so that completion
          events remain traceable.
        </p>

        <div
          style={{
            marginTop: 18,
            padding: 15,
            border:
              '1px solid var(--border-color, #e5e7eb)',
            borderRadius: 8,
          }}
        >
          <strong>
            Important
          </strong>

          <p
            style={{
              marginBottom: 0,
              marginTop: 6,
            }}
          >
            The current phase records
            completion and locking
            information. Enforcement
            preventing edits to locked
            clinical records will be
            added separately so that
            amendments can be handled
            through a controlled
            clinical process rather
            than silently overwriting
            completed records.
          </p>
        </div>

      </div>

    </div>
  )
}
