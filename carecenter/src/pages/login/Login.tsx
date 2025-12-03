import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "../../css/Login.css";

type LoginType = "healthcare" | "patient";

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get("type");
  const initialLoginType: LoginType =
    typeParam === "patient"
      ? "patient"
      : typeParam === "healthcare"
      ? "healthcare"
      : "healthcare";

  const [loginType, setLoginType] = useState<LoginType>(initialLoginType);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDevInfo, setShowDevInfo] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");

  // Check for registration success message
  useEffect(() => {
    const registered = searchParams.get("registered");
    if (registered === "true") {
      setSuccessMessage("Account created successfully! Please log in.");
      // Clear the query parameter
      navigate("/login?type=patient", { replace: true });
    }
  }, [searchParams, navigate]);

  // Update login type if query parameter changes
  useEffect(() => {
    if (typeParam === "patient") {
      setLoginType("patient");
    } else if (typeParam === "healthcare") {
      setLoginType("healthcare");
    } else {
      // Default to healthcare if no type specified
      setLoginType("healthcare");
    }
  }, [typeParam]);

  // Development credentials (only shown in development)
  const devCredentials = {
    admin: { email: "admin@carecenter.com", password: "Admin123!" },
    worker: { email: "worker@carecenter.com", password: "Worker123!" },
    patient: { email: "patient@carecenter.com", password: "Patient123!" },
  };

  const fillCredentials = (type: "admin" | "worker" | "patient") => {
    const creds = devCredentials[type];
    setEmail(creds.email);
    setPassword(creds.password);
    if (type === "admin" || type === "worker") {
      setLoginType("healthcare");
    } else {
      setLoginType("patient");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);

      // Get user data from localStorage to check role
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);

        // Validate that user role matches the expected login type
        const isPatientRole = user.role === "Client" || user.role === "Patient";
        const isHealthcareRole =
          user.role === "Admin" || user.role === "Worker";

        // Check if the user is logging in with the correct login type
        if (loginType === "patient" && !isPatientRole) {
          // Patient login but user is not a patient
          setError(
            "Invalid credentials for patient login. Please use the staff login page, if you are a staff member."
          );
          logout(); // Clear the invalid login
          return;
        } else if (loginType === "healthcare" && !isHealthcareRole) {
          // Healthcare login but user is not healthcare personnel
          setError(
            "Invalid credentials for healthcare login. Please use the patient login page."
          );
          logout(); // Clear the invalid login
          return;
        }

        // Navigate based on role
        if (user.role === "Admin") {
          navigate("/admin/dashboard");
        } else if (user.role === "Worker") {
          navigate("/healthcare/dashboard");
        } else if (user.role === "Client" || user.role === "Patient") {
          navigate("/patient/dashboard");
        } else {
          // Fallback based on login type
          if (loginType === "healthcare") {
            navigate("/healthcare/dashboard");
          } else {
            navigate("/patient/dashboard");
          }
        }
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pb-4">
      <section className="section">
        <div className="container" style={{ maxWidth: "580px" }}>
          <h2 className="mb-1">
            {loginType === "healthcare"
              ? "Healthcare personnel login"
              : "Patient login"}
          </h2>
          <p className="text-secondary mb-1">
            {loginType === "healthcare"
              ? "Please sign in with your staff credentials."
              : "Please sign in with your patient credentials."}
          </p>

          <form onSubmit={handleSubmit}>
            {successMessage && (
              <div className="alert alert-success mb-1" role="alert">
                <i className="bi bi-check-circle"></i> {successMessage}
              </div>
            )}
            {error && (
              <div className="alert alert-danger mb-1" role="alert">
                <i className="bi bi-exclamation-circle"></i> {error}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label mb-1" htmlFor="email">
                Email
              </label>
              <input
                className="form-control"
                type="email"
                id="email"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label className="form-label mb-1" htmlFor="password">
                Password
              </label>
              <input
                className="form-control"
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-teal" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
            <a
              className="btn btn-outline-secondary ms-2"
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate("/");
              }}
            >
              Cancel
            </a>
          </form>

          {/* Sign up link - only for patient login */}
          {loginType === "patient" && (
            <div className="mt-3">
              <a
                href="/signup"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/signup");
                }}
                className="text-teal text-decoration-none"
              >
                <i className="bi bi-person-plus"></i> Create new account
              </a>
            </div>
          )}

          {/* Forgot password link - for both patient and healthcare */}
          <div className="mt-3">
            <a
              href="/forgot-password"
              onClick={(e) => {
                e.preventDefault();
                navigate(`/forgot-password?type=${loginType}`);
              }}
              className="text-muted text-decoration-none"
            >
              Forgot password?
            </a>
          </div>

          {/* Development Info Section */}
          {import.meta.env.DEV && (
            <div
              style={{
                marginTop: "30px",
                paddingTop: "20px",
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <button
                type="button"
                onClick={() => setShowDevInfo(!showDevInfo)}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "#f8f9fa",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  cursor: "pointer",
                  marginBottom: showDevInfo ? "10px" : "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "#333",
                }}
              >
                <i className="bi bi-info-circle"></i> Development Credentials
                <i
                  className={`bi bi-chevron-${showDevInfo ? "up" : "down"}`}
                ></i>
              </button>

              {showDevInfo && (
                <div>
                  <div
                    style={{
                      marginBottom: "4px",
                      padding: "8px",
                      background: "#f8f9fa",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#333",
                    }}
                  >
                    <span>
                      <strong>Admin:</strong> {devCredentials.admin.email} /{" "}
                      {devCredentials.admin.password}
                    </span>
                    <button
                      type="button"
                      onClick={() => fillCredentials("admin")}
                      style={{
                        marginLeft: "10px",
                        padding: "2px 4px",
                        fontSize: "0.8rem",
                        background: "#009688",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Fill
                    </button>
                  </div>

                  <div
                    style={{
                      marginBottom: "4px",
                      padding: "8px",
                      background: "#f8f9fa",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#333",
                    }}
                  >
                    <span>
                      <strong>Worker:</strong> {devCredentials.worker.email} /{" "}
                      {devCredentials.worker.password}
                    </span>
                    <button
                      type="button"
                      onClick={() => fillCredentials("worker")}
                      style={{
                        marginLeft: "10px",
                        padding: "4px 8px",
                        fontSize: "0.8rem",
                        background: "#009688",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Fill
                    </button>
                  </div>

                  <div
                    style={{
                      padding: "8px",
                      background: "#f8f9fa",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#333",
                    }}
                  >
                    <span>
                      <strong>Patient:</strong> {devCredentials.patient.email} /{" "}
                      {devCredentials.patient.password}
                    </span>
                    <button
                      type="button"
                      onClick={() => fillCredentials("patient")}
                      style={{
                        marginLeft: "10px",
                        padding: "4px 8px",
                        fontSize: "0.8rem",
                        background: "#009688",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Fill
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Login;
