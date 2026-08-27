import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import AppShell from './components/AppShell'
import OrganisationRoute from './components/OrganisationRoute'
import ProtectedRoute from './components/ProtectedRoute'

import Assessments from './pages/Assessments'
import Dashboard from './pages/Dashboard'
import FceTesting from './pages/FceTesting'
import JobProfiles from './pages/JobProfiles'
import Login from './pages/Login'
import MiningStructure from './pages/MiningStructure'
import NewAssessment from './pages/NewAssessment'
import Onboarding from './pages/Onboarding'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import WorkerProfile from './pages/WorkerProfile'
import Workers from './pages/Workers'

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <OrganisationRoute>
              <AppShell />
            </OrganisationRoute>
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
          path="workers/:id"
          element={<WorkerProfile />}
        />

        <Route
          path="assessments"
          element={<Assessments />}
        />

        <Route
          path="assessments/new"
          element={<NewAssessment />}
        />

        <Route
          path="assessments/:id"
          element={<FceTesting />}
        />

        <Route
          path="mining-structure"
          element={<MiningStructure />}
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
