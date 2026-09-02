import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import AppShell from './components/AppShell'
import OrganisationRoute from './components/OrganisationRoute'
import ProtectedRoute from './components/ProtectedRoute'

import Assessments from './pages/Assessments'
import AuditTrail from './pages/AuditTrail'
import Dashboard from './pages/Dashboard'
import FceOutcome from './pages/FceOutcome'
import FceRecord from './pages/FceRecord'
import FceTesting from './pages/FceTesting'
import JobProfiles from './pages/JobProfiles'
import Login from './pages/Login'
import MiningStructure from './pages/MiningStructure'
import MskScreenings from './pages/MskScreenings'
import NewAssessment from './pages/NewAssessment'
import NewRehabCase from './pages/NewRehabCase'
import NewRehabSession from './pages/NewRehabSession'
import Onboarding from './pages/Onboarding'
import RehabCase from './pages/RehabCase'
import RehabComparison from './pages/RehabComparison'
import RehabDischarge from './pages/RehabDischarge'
import RehabDischargeReport from './pages/RehabDischargeReport'
import RehabReassessment from './pages/RehabReassessment'
import Rehabilitation from './pages/Rehabilitation'
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
          path="msk-screenings"
          element={<MskScreenings />}
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
          path="assessments/:id/outcome"
          element={<FceOutcome />}
        />

        <Route
          path="assessments/:id/record"
          element={<FceRecord />}
        />

        <Route
          path="rehabilitation"
          element={<Rehabilitation />}
        />

        <Route
          path="rehabilitation/new"
          element={<NewRehabCase />}
        />

        <Route
          path="rehabilitation/:id"
          element={<RehabCase />}
        />

        <Route
          path="rehabilitation/:id/sessions/new"
          element={<NewRehabSession />}
        />

        <Route
          path="rehabilitation/:id/reassessment"
          element={<RehabReassessment />}
        />

        <Route
          path="rehabilitation/:id/comparison"
          element={<RehabComparison />}
        />

        <Route
          path="rehabilitation/:id/discharge"
          element={<RehabDischarge />}
        />

        <Route
          path="rehabilitation/:id/report"
          element={<RehabDischargeReport />}
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
          path="audit-trail"
          element={<AuditTrail />}
        />

        <Route
          path="settings"
          element={<Settings />}
        />

      </Route>

    </Routes>
  )
}
