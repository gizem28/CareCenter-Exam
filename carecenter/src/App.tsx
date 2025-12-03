import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/shared/ProtectedRoute";
import Navbar from "./components/shared/Navbar";
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
import "./css/Footer.css";

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

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
      {/* Enhanced Global Footer */}
      <footer
        className={`border-top bg-light ${isLoginPage ? "login-footer" : ""}`}
      >
        <div className="container py-4">
          <div className="row">
            {/* Company Info */}
            <div className="col-lg-4 col-md-6 mb-4">
              <h5 className="fw-bold text-primary">TrioCareCenter</h5>
              <p className="text-muted small mb-3">
                Providing quality healthcare services with compassion and
                expertise. Your trusted partner in health and wellness.
              </p>
              <p className="text-muted small mb-1">
                <strong>Emergency:</strong> 144 (24/7)
              </p>
            </div>

            {/* Contact Information */}
            <div className="col-lg-4 col-md-6 mb-4">
              <h6 className="fw-bold text-dark mb-3">Contact Us</h6>
              <div className="text-muted small">
                <p className="mb-2">
                  <i className="bi bi-geo-alt-fill me-2"></i>
                  Karl Johans Gate 1<br />
                  <span className="ms-3">0154 Oslo, Norway</span>
                </p>
                <p className="mb-2">
                  <i className="bi bi-telephone-fill me-2"></i>
                  +47 22 20 00 00
                </p>
                <p className="mb-2">
                  <i className="bi bi-envelope-fill me-2"></i>
                  info@triocarecenter.no
                </p>
                <p className="mb-0">
                  <i className="bi bi-clock-fill me-2"></i>
                  Mon-Fri: 08:00-18:00
                  <br />
                  <span className="ms-3">Sat-Sun: Emergency only</span>
                </p>
              </div>
            </div>

            {/* Services & Links */}
            <div className="col-lg-4 col-md-12 mb-4">
              <h6 className="fw-bold text-dark mb-3">Services</h6>
              <div className="row">
                <div className="col-6">
                  <ul className="list-unstyled text-muted small">
                    <li className="mb-1">Medical Care</li>
                    <li className="mb-1">Medication Delivery</li>
                    <li className="mb-1">Companionship</li>
                    <li className="mb-1">Personal Care</li>
                  </ul>
                </div>
                <div className="col-6">
                  <ul className="list-unstyled text-muted small">
                    <li className="mb-1">Health Monitoring</li>
                    <li className="mb-1">Rehabilitation</li>
                    <li className="mb-1">Nutrition Planning</li>
                    <li className="mb-1">Mental Health</li>
                  </ul>
                </div>
              </div>

              {/* Social Links */}
              <div className="mt-3">
                <h6 className="fw-bold text-dark mb-2">Follow Us</h6>
                <div className="d-flex gap-2">
                  <a href="#" className="text-muted" title="Facebook">
                    <i className="bi bi-facebook"></i>
                  </a>
                  <a href="#" className="text-muted" title="Twitter">
                    <i className="bi bi-twitter"></i>
                  </a>
                  <a href="#" className="text-muted" title="LinkedIn">
                    <i className="bi bi-linkedin"></i>
                  </a>
                  <a href="#" className="text-muted" title="Instagram">
                    <i className="bi bi-instagram"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <hr className="my-4" />
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start">
              <p className="text-muted small mb-0">
                © 2025 TrioCareCenter. All rights reserved.
              </p>
            </div>
            <div className="col-md-6 text-center text-md-end">
              <div className="text-muted small">
                <a href="#" className="text-muted text-decoration-none me-3">
                  Privacy Policy
                </a>
                <a href="#" className="text-muted text-decoration-none me-3">
                  Terms of Service
                </a>
                <a href="#" className="text-muted text-decoration-none">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="text-center mt-3">
            <p className="text-muted small mb-0">
              <i className="bi bi-shield-check me-1"></i>
              Your health information is protected under Norwegian health data
              regulations.
            </p>
          </div>
        </div>
      </footer>
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
