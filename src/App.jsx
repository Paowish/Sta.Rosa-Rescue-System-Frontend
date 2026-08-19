import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// =============================================================
// ✅ PUBLIC LANDING PAGE IMPORTS
// =============================================================
import PublicLayout from "./components/layout/PublicLayout";
import LandingHome from './pages/landing/LandingHome';
// Add these pages later as you create them:


import HowItWorks from './pages/landing/HowItWorks';
import Mission from './pages/landing/Mission';
import Services from './pages/landing/Services';
import FileReport from './pages/landing/FileReport';

// =============================================================
// ✅ AUTH PAGES
// =============================================================
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ResetPassword from "./pages/auth/ResetPassword.jsx";

// =============================================================
// ✅ RESCUE TEAM / ADMIN LAYOUT
// =============================================================
import DashboardLayout from "./components/layout/DashboardLayout";

// NEW Admin / Rescue Team Pages
import AdminOverview from './pages/admin/AdminOverview';
import UserAccount from './pages/admin/UserAccount';
import IncidentReports from './pages/admin/IncidentReport';
import SystemMaintenance from './pages/admin/SystemMaintenance';
import Units from './pages/rescueTeam/Units';
import SystemSettings from './pages/admin/SystemSettings';
import AdminLayout from "./pages/admin/AdminLayout";

// Rescue Team Dashboard Pages
import Dashboard from "./pages/rescueTeam/Dashboard";
import IncidentManagement from "./pages/rescueTeam/IncidentManagement.jsx";
import VolunteerApproval from "./pages/rescueTeam/VolunteerApproval";

// =============================================================
// ✅ CIVILIAN PAGES
// =============================================================
import CivilianDashboard from "./pages/civilian/CivilianDashboard";
import Overview from "./pages/civilian/Overview";
import EditProfile from "./pages/civilian/EditProfile";
import TrackReports from "./pages/civilian/TrackReports";
import ReportIncident from './pages/civilian/reportIncident/ReportIncident';
import SubmitSuccess from "./pages/civilian/reportIncident/Submit";

// =============================================================
// ✅ VOLUNTEER PAGES
// =============================================================
import VolunteerApplication from "./pages/rescueTeam/VolunteerApplication";
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard";

// =============================================================
// ✅ GUEST PAGES
// =============================================================
import GuestReport from "./pages/guest/GuestReport";

// =============================================================
// ✅ COMPONENTS
// =============================================================
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* ============================================================ */}
          {/* 🌐 PUBLIC LANDING ROUTES (NO AUTH REQUIRED)                   */}
          {/* ============================================================ */}
          <Route element={<PublicLayout />}>
            {/* Root URL goes to the Landing Page */}
            <Route index element={<LandingHome />} />
          </Route>

          {/* ============================================================ */}
          {/* 🔐 AUTH ROUTES                                                */}
          {/* ============================================================ */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* ============================================================ */}
          {/* 🚀 GUEST ROUTES                                               */}
          {/* ============================================================ */}
          <Route path="/guest" element={<GuestReport />} />
          <Route path="/guest/report" element={<GuestReport />} />

          {/* ============================================================ */}
          {/* 🏛️ ADMIN / RESCUE TEAM ROUTES                                 */}
          {/* ============================================================ */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/overview"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <AdminOverview />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/user-accounts"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserAccount />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/incident-reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <IncidentReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/system-maintenance"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemMaintenance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/system-settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <SystemSettings />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <EditProfile />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* 🚑 RESCUE TEAM ROUTES                                         */}
          {/* ============================================================ */}
          <Route
            path="/units"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <DashboardLayout>
                  <Units />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/incidents"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <DashboardLayout>
                  <IncidentManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/volunteer-approval"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <DashboardLayout>
                  <VolunteerApproval />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <DashboardLayout>
                  <EditProfile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* 🧍 CIVILIAN ROUTES                                            */}
          {/* ============================================================ */}
          <Route
            path="/civilian-dashboard"
            element={
              <ProtectedRoute allowedRoles={['civilian']}>
                <CivilianDashboard>
                  <Overview />
                </CivilianDashboard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/overview"
            element={
              <ProtectedRoute allowedRoles={['civilian']}>
                <CivilianDashboard>
                  <Overview />
                </CivilianDashboard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/track-reports"
            element={
              <ProtectedRoute allowedRoles={['civilian']}>
                <CivilianDashboard>
                  <TrackReports />
                </CivilianDashboard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute allowedRoles={['civilian']}>
                <CivilianDashboard>
                  <EditProfile />
                </CivilianDashboard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/report"
            element={
              <ProtectedRoute allowedRoles={['civilian']}>
                <CivilianDashboard>
                  <ReportIncident />
                </CivilianDashboard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/submit"
            element={
              <CivilianDashboard>
                <SubmitSuccess />
              </CivilianDashboard>
            }
          />

          {/* ============================================================ */}
          {/* 🦺 VOLUNTEER ROUTES                                          */}
          {/* ============================================================ */}
          <Route
            path="/volunteer-application"
            element={<VolunteerApplication />}
          />

          <Route
            path="/volunteer-dashboard"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />

          {/* ============================================================ */}
          {/* 🛑 FALLBACK ROUTE (If no route matches)                       */}
          {/* ============================================================ */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;