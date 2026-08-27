import {
  Activity,
  BriefcaseBusiness,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react'

import {
  NavLink,
  Outlet,
} from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/workers',
    label: 'Workers',
    icon: Users,
  },
  {
    to: '/assessments',
    label: 'Assessments',
    icon: ClipboardList,
  },
  {
    to: '/job-profiles',
    label: 'Job Profiles',
    icon: BriefcaseBusiness,
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: FileBarChart,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
  },
]

export default function AppShell() {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <Activity size={22} />
          </div>

          <div>
            <div className="brand-name">
              SpineSync
            </div>

            <div className="brand-subtitle">
              Enterprise
            </div>
          </div>
        </div>

        <nav className="nav">
          {navItems.map(
            ({
              to,
              label,
              icon: Icon,
            }) => (
              <NavLink
                key={to}
                to={to}
                className={({
                  isActive,
                }) =>
                  `nav-link ${
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

          <div className="small-label">
            Signed in
          </div>

          <strong>
            {user?.email}
          </strong>

          <button
            className="logout-button"
            onClick={signOut}
          >
            <LogOut size={16} />
            Sign out
          </button>

        </div>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <div>
            <h1>
              SpineSync Enterprise
            </h1>

            <p>
              Mining MSK, FCE and
              return-to-work intelligence
              platform
            </p>
          </div>

          <button className="profile-button">
            SM
          </button>
        </header>

        <section className="page">
          <Outlet />
        </section>

      </main>
    </div>
  )
}
