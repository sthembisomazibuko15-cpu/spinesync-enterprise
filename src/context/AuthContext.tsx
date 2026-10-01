import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type UserRole =
  | 'super_admin'
  | 'organisation_admin'
  | 'mine_admin'
  | 'clinician'
  | 'medical_officer'
  | 'manager'
  | 'viewer'

export type UserProfile = {
  id: string
  organisation_id: string | null
  full_name: string | null
  role: UserRole
}

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  role: UserRole | null
  organisationId: string | null
  loading: boolean
  profileLoading: boolean
  isOrganisationAdmin: boolean
  isMineAdmin: boolean
  isClinician: boolean
  isMedicalOfficer: boolean
  isManager: boolean
  isViewer: boolean
  canManageWorkforce: boolean
  canPerformClinicalWork: boolean
  canManageCampaigns: boolean
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
)

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)

  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  async function loadProfile(userId: string) {
    setProfileLoading(true)

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          organisation_id,
          full_name,
          role
        `)
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error(
          'Unable to load SpineSync user profile:',
          error
        )

        setProfile(null)
        return
      }

      if (!data) {
        setProfile(null)
        return
      }

      setProfile(data as UserProfile)
    } finally {
      setProfileLoading(false)
    }
  }

  async function refreshProfile() {
    const userId = session?.user?.id

    if (!userId) {
      setProfile(null)
      return
    }

    await loadProfile(userId)
  }

  useEffect(() => {
    let active = true

    async function initialiseAuth() {
      const { data } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      const nextSession = data.session

      setSession(nextSession)

      if (nextSession?.user?.id) {
        await loadProfile(nextSession.user.id)
      } else {
        setProfile(null)
      }

      if (active) {
        setLoading(false)
      }
    }

    void initialiseAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession)

        if (nextSession?.user?.id) {
          void loadProfile(nextSession.user.id)
        } else {
          setProfile(null)
          setProfileLoading(false)
        }

        setLoading(false)
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(
    email: string,
    password: string
  ) {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    return {
      error: error?.message ?? null,
    }
  }

  async function signUp(
    email: string,
    password: string
  ) {
    const { error } =
      await supabase.auth.signUp({
        email,
        password,
      })

    return {
      error: error?.message ?? null,
    }
  }

  async function signOut() {
    setProfile(null)
    await supabase.auth.signOut()
  }

  const role = profile?.role ?? null
  const organisationId = profile?.organisation_id ?? null

  const isOrganisationAdmin =
    role === 'organisation_admin' ||
    role === 'super_admin'

  const isMineAdmin =
    role === 'mine_admin'

  const isClinician =
    role === 'clinician'

  const isMedicalOfficer =
    role === 'medical_officer'

  const isManager =
    role === 'manager'

  const isViewer =
    role === 'viewer'

  const canManageWorkforce =
    role === 'super_admin' ||
    role === 'organisation_admin' ||
    role === 'mine_admin'

  const canPerformClinicalWork =
    role === 'super_admin' ||
    role === 'organisation_admin' ||
    role === 'clinician' ||
    role === 'medical_officer'

  const canManageCampaigns =
    role === 'super_admin' ||
    role === 'organisation_admin' ||
    role === 'mine_admin' ||
    role === 'clinician'

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        role,
        organisationId,
        loading,
        profileLoading,
        isOrganisationAdmin,
        isMineAdmin,
        isClinician,
        isMedicalOfficer,
        isManager,
        isViewer,
        canManageWorkforce,
        canPerformClinicalWork,
        canManageCampaigns,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}
