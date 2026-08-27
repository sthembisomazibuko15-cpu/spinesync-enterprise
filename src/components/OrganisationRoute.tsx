import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function OrganisationRoute({
  children,
}: {
  children: ReactNode
}) {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [hasOrganisation, setHasOrganisation] =
    useState(false)

  useEffect(() => {
    async function checkOrganisation() {
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('organisation_id')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error(error)
      }

      setHasOrganisation(
        Boolean(data?.organisation_id)
      )

      setLoading(false)
    }

    checkOrganisation()
  }, [user])

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner" />
        <p>Loading organisation...</p>
      </div>
    )
  }

  if (!hasOrganisation) {
    return (
      <Navigate
        to="/onboarding"
        replace
      />
    )
  }

  return <>{children}</>
}
