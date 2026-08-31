import {
  Activity,
  BriefcaseBusiness,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Network,
  Settings,
  Users,
} from 'lucide-react'

import {
  NavLink,
  Outlet,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

export default function AppShell() {
  const { signOut } = useAuth()

  const navigation = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Workers',
      path: '/workers',
      icon: Users,
    },
    {
      label: 'Assessments',
      path: '/assessments',
      icon: ClipboardCheck,
    },
    {
      label: 'Rehabilitation',
      path: '/rehabilitation',
      icon: Activity,
    },
    {
      label: 'Mining Structure',
      path: '/mining-structure',
      icon: Network,
    },
    {
      label: 'Job Profiles',
      path: '/job-profiles',
      icon: BriefcaseBusiness,
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: ClipboardCheck,
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            S
          </div>

          <div>
            <strong>
              SpineSync
            </strong>

            <span>
              Enterprise
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navigation.map(
            ({
              label,
              path,
              icon: Icon,
            }) => (
              <NavLink
                key={path}
                to={path}
                className={({
                  isActive,
                }) =>
                  `sidebar-link ${
                    isActive
                      ? 'active'
                      : ''
                  }`
                }
              >
                <Icon size={18} />
                <span>
                  {label}
                </span>
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-link"
            onClick={signOut}
          >
            <LogOut size={18} />

            <span>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
