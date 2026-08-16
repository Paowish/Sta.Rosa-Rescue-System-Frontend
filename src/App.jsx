import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Auth Pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ResetPassword from "./pages/auth/ResetPassword.jsx";

// RESCUE TEAM LAYOUT
import DashboardLayout from "./components/layout/DashboardLayout";

// NEW Admin / Rescue Team Pages
import AdminOverview from './pages/admin/AdminOverview';
import UserAccount from './pages/admin/UserAccount';
import IncidentReports from './pages/admin/IncidentReport';
import SystemMaintenance from './pages/admin/SystemMaintenance';
import Units from './pages/rescueTeam/Units';
import SystemSettings from './pages/admin/SystemSettings';
import AdminLayout from "./pages/admin/AdminLayout";

// ✅ ADD THESE MISSING IMPORTS FOR THE RESCUE TEAM DASHBOARD
import Dashboard from "./pages/rescueTeam/Dashboard";
import IncidentManagement from "./pages/rescueTeam/IncidentManagement.jsx";

// ✅ FIXED: Separate Route for Volunteers
import VolunteerApproval from "./pages/rescueTeam/VolunteerApproval";

// Civilian Pages
import CivilianDashboard from "./pages/civilian/CivilianDashboard";
import Overview from "./pages/civilian/Overview";
import EditProfile from "./pages/civilian/EditProfile";

// ✅ Civilian Track Reports (You kept the civilian version, right?)
import TrackReports from "./pages/civilian/TrackReports";

// ✅ NEW: Unified Incident Reporting Flow
import ReportIncident from './pages/civilian/reportIncident/ReportIncident';
import SubmitSuccess from "./pages/civilian/reportIncident/Submit";

// Volunteer Pages
import VolunteerApplication from "./pages/rescueTeam/VolunteerApplication";
import VolunteerDashboard from "./pages/volunteer/VolunteerDashboard";

// ✅ NEW GUEST REPORT PAGE (Replaces GuestReportIncident)
import GuestReport from "./pages/guest/GuestReport";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ==================== PUBLIC ROUTES ==================== */}
          <Route path="/Login" element={<Login />} />
          <Route path="/Signup" element={<Signup />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/Volunteer-Application" element={<VolunteerApplication />} />

          {/* ==================== GUEST ROUTES ==================== */}
          {/* Entry point for Guest reporting - Only the form */}
          <Route path="/Guest" element={<GuestReport />} />
          <Route path="/Guest/Report" element={<GuestReport />} />

          {/* ==================== ADMIN DASHBOARD REDIRECT ==================== */}
          <Route
            path="/Admin"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <Navigate to="/Admin/Overview" replace />
              </ProtectedRoute>
            }
          />

          {/* ========================================================== */}
          {/* ✅ NEW ADMIN ROUTES                                        */}
          {/* ========================================================== */}
          <Route
            path="/Admin/Overview"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <AdminOverview />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Admin/UserAccounts"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserAccount />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Admin/IncidentReports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <IncidentReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Admin/SystemMaintenance"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemMaintenance />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Admin/SystemSettings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <SystemSettings />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* ✅ FIXED: Admin Profile uses civilian EditProfile */}
          <Route
            path="/Admin/Profile"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout>
                  <EditProfile />
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* ========================================================== */}
          {/* ✅ RESCUE TEAM ROUTES                                     */}
          {/* ========================================================== */}

          {/* ✅ FIXED: Rescue Team Dashboard */}
          <Route
            path="/Dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/Units"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <DashboardLayout>
                  <Units />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ✅ FIXED: Rescue Team Incident Management */}
          <Route
            path="/Incidents"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <DashboardLayout>
                  <IncidentManagement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/Volunteer-Approval"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <DashboardLayout>
                  <VolunteerApproval />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ✅ FIXED: Rescue Team Profile */}
          <Route
            path="/Profile"
            element={
              <ProtectedRoute allowedRoles={['admin', 'dispatcher', 'responder']}>
                <DashboardLayout>
                  <EditProfile />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* ==================== CIVILIAN ROUTES ==================== */}
          <Route
            path="/Civilian-Dashboard"
            element={
              <ProtectedRoute allowedRoles={['civilian']}>
                <CivilianDashboard>
                  <Overview />
                </CivilianDashboard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/Volunteer-Dashboard"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/Overview"
            element={
              <ProtectedRoute allowedRoles={['civilian']}>
                <CivilianDashboard>
                  <Overview />
                </CivilianDashboard>
              </ProtectedRoute>
            }
          />

          {/* ✅ Civilian uses the TRACK REPORTS component from civilian folder */}
          <Route
            path="/Track-Reports"
            element={
              <ProtectedRoute allowedRoles={['civilian']}>
                <CivilianDashboard>
                  <TrackReports />
                </CivilianDashboard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/Edit-Profile"
            element={
              <ProtectedRoute allowedRoles={['civilian']}>
                <CivilianDashboard>
                  <EditProfile />
                </CivilianDashboard>
              </ProtectedRoute>
            }
          />

          {/* ==================== INCIDENT REPORTING FLOW ==================== */}
          <Route
            path="/Report"
            element={
              <ProtectedRoute allowedRoles={['civilian']}>
                <CivilianDashboard>
                  <ReportIncident />
                </CivilianDashboard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/Submit"
            element={
              <CivilianDashboard>
                <SubmitSuccess />
              </CivilianDashboard>
            }
          />

          {/* ==================== DEFAULT REDIRECT ==================== */}
          <Route path="/" element={<Navigate to="/Login" replace />} />
          <Route path="*" element={<Navigate to="/Login" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;