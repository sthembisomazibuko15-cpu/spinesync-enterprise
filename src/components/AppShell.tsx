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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            S
          </div>

          <div>
            <strong>SpineSync</strong>
            <span>Enterprise</span>
          </div>
        </div>

        <nav className="sidebar-nav">

          <NavLink
            to="/dashboard"
            className="sidebar-link"
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/workers"
            className="sidebar-link"
          >
            <Users size={18} />
            <span>Workers</span>
          </NavLink>

          <NavLink
            to="/assessments"
            className="sidebar-link"
          >
            <ClipboardCheck size={18} />
            <span>Assessments</span>
          </NavLink>

          <NavLink
            to="/rehabilitation"
            className="sidebar-link"
          >
            <Activity size={18} />
            <span>Rehabilitation</span>
          </NavLink>

          <NavLink
            to="/mining-structure"
            className="sidebar-link"
          >
            <Network size={18} />
            <span>Mining Structure</span>
          </NavLink>

          <NavLink
            to="/job-profiles"
            className="sidebar-link"
          >
            <BriefcaseBusiness size={18} />
            <span>Job Profiles</span>
          </NavLink>

          <NavLink
            to="/reports"
            className="sidebar-link"
          >
            <ClipboardCheck size={18} />
            <span>Reports</span>
          </NavLink>

          <NavLink
            to="/settings"
            className="sidebar-link"
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>

        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-link"
            onClick={signOut}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
