import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import Navbar from "./components/shared/Navbar";
import Footer from "./components/shared/Footer";
import Home from "./pages/homepage/Home";
import Login from "./pages/login/Login";
import SignUp from "./pages/login/SignUp";
import ForgotPassword from "./pages/login/ForgotPassword";
import ManagerDashboard from "./pages/dashboards/ManagerDashboard";
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import WorkerDashboard from "./pages/dashboards/WorkerDashboard";
import EditPatient from "./pages/patients/EditPatient";
import PatientsList from "./pages/patients/PatientsList";
import CreateWorker from "./pages/workers/CreateWorker";
import EditWorker from "./pages/workers/EditWorker";
import WorkersList from "./pages/workers/WorkersList";
import ServiceRequestsApproval from "./pages/admin/ServiceRequestsApproval";
import "./App.css";

function AppContent() {

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="Admin">
              <ManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/service-requests"
          element={
            <ProtectedRoute requiredRole="Admin">
              <ServiceRequestsApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients"
          element={
            <ProtectedRoute requiredRole="Admin">
              <PatientsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patients/:id"
          element={
            <ProtectedRoute requiredRole="Admin">
              <EditPatient />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workers"
          element={
            <ProtectedRoute requiredRole="Admin">
              <WorkersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workers/create"
          element={
            <ProtectedRoute requiredRole="Admin">
              <CreateWorker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workers/:id"
          element={
            <ProtectedRoute requiredRole="Admin">
              <EditWorker />
            </ProtectedRoute>
          }
        />
        <Route
          path="/healthcare/dashboard"
          element={
            <ProtectedRoute>
              <WorkerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/dashboard"
          element={
            <ProtectedRoute>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
