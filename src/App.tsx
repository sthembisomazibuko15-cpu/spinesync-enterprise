import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import AppShell from './components/AppShell'
import ProtectedRoute from './components/ProtectedRoute'

import Assessments from './pages/Assessments'
import Dashboard from './pages/Dashboard'
import JobProfiles from './pages/JobProfiles'
import Login from './pages/Login'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Workers from './pages/Workers'

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="dashboard"
          element={<Dashboard />}
        />

        <Route
          path="workers"
          element={<Workers />}
        />

        <Route
          path="assessments"
          element={<Assessments />}
        />

        <Route
          path="job-profiles"
          element={<JobProfiles />}
        />

        <Route
          path="reports"
          element={<Reports />}
        />

        <Route
          path="settings"
          element={<Settings />}
        />
      </Route>
    </Routes>
  )
}
