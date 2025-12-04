import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthService } from "../../api/authService";
import "../../css/Login.css";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get("token");
  const urlEmail = searchParams.get("email");
  const [step, setStep] = useState<"request" | "reset">(
    urlToken ? "reset" : "request"
  );
  const [email, setEmail] = useState(urlEmail || "");
  const [token, setToken] = useState(urlToken || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const response = await AuthService.forgotPassword(email);
      if (import.meta.env.DEV && response.token) {
        setToken(response.token);
        setStep("reset");
        setSuccessMessage(
          `Password reset token generated. Token: ${response.token} (This is only shown in development)`
        );
      } else {
        setSuccessMessage(
          "If the email exists, a password reset link has been sent. Please check your email and click the link to reset your password."
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      await AuthService.resetPassword(email, token, newPassword);
      setSuccessMessage(
        "Password has been reset successfully! Redirecting to login..."
      );
      const loginType = searchParams.get("type") || "patient";
      setTimeout(() => {
        navigate(`/login?type=${loginType}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pb-4">
      <section className="section">
        <div className="container" style={{ maxWidth: "580px" }}>
          <h2 className="mb-3">
            {step === "request" ? "Forgot Password" : "Reset Password"}
          </h2>
          <p className="text-secondary">
            {step === "request"
              ? "Enter your email address and we'll send you instructions to reset your password."
              : "Enter your new password below."}
          </p>

          {step === "request" ? (
            <form onSubmit={handleRequestReset}>
              {successMessage && (
                <div className="alert alert-success mb-3" role="alert">
                  <i className="bi bi-check-circle"></i> {successMessage}
                </div>
              )}
              {error && (
                <div className="alert alert-danger mb-3" role="alert">
                  <i className="bi bi-exclamation-circle"></i> {error}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  className="form-control"
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn btn-teal" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processing...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
              <a
                className="btn btn-outline-secondary ms-2"
                href="/login?type=patient"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login?type=patient");
                }}
              >
                Back to Login
              </a>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              {successMessage && (
                <div className="alert alert-success mb-3" role="alert">
                  <i className="bi bi-check-circle"></i> {successMessage}
                </div>
              )}
              {error && (
                <div className="alert alert-danger mb-3" role="alert">
                  <i className="bi bi-exclamation-circle"></i> {error}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label" htmlFor="email">
                  Email
                </label>
                <input
                  className="form-control"
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {import.meta.env.DEV && (
                <div className="mb-3">
                  <label className="form-label" htmlFor="token">
                    Reset Token
                  </label>
                  <input
                    className="form-control"
                    type="text"
                    id="token"
                    name="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="Paste the token from the email"
                  />
                  <small className="form-text text-muted">
                    (In development, token is shown above. In production, this
                    would come from the email link)
                  </small>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  className="form-control"
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
                <small className="form-text text-muted">
                  Password must be at least 6 characters long
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm New Password
                </label>
                <input
                  className="form-control"
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <button type="submit" className="btn btn-teal" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
              <a
                className="btn btn-outline-secondary ms-2"
                href={`/login?type=${searchParams.get("type") || "patient"}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(
                    `/login?type=${searchParams.get("type") || "patient"}`
                  );
                }}
              >
                Cancel
              </a>
            </form>
          )}

          <div className="mt-3 text-center">
            <p className="text-muted small">
              Remember your password?{" "}
              <a
                href={`/login?type=${searchParams.get("type") || "patient"}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(
                    `/login?type=${searchParams.get("type") || "patient"}`
                  );
                }}
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;
