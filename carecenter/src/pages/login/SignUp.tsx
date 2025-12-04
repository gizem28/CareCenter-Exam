import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { AuthService } from "../../api/authService";
import "../../css/Login.css";

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAdminCreating =
    location.pathname === "/patients/create" || user?.role === "Admin";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    phone: "",
    birthDate: "",
  });

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "Full name is required";
        if (value.length > 100) return "Full name cannot exceed 100 characters";
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Invalid email format";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        if (!/(?=.*[a-z])/.test(value))
          return "Password must contain at least one lowercase letter";
        if (!/(?=.*[A-Z])/.test(value))
          return "Password must contain at least one uppercase letter";
        if (!/(?=.*\W)/.test(value))
          return "Password must contain at least one special character";
        return "";
      case "confirmPassword":
        if (!value) return "Please confirm your password";
        if (value !== formData.password) return "Passwords do not match";
        return "";
      case "phone":
        const digitsOnly = value.replace(/\D/g, "");
        if (!digitsOnly) return "Phone number is required";
        if (digitsOnly.length !== 8)
          return "Phone number must be exactly 8 digits";
        return "";
      case "address":
        if (!value.trim()) return "Address is required";
        if (value.length > 200) return "Address cannot exceed 200 characters";
        return "";
      case "birthDate":
        if (!value) return "Birth date is required";
        const date = new Date(value);
        if (isNaN(date.getTime())) return "Invalid date format";
        if (date > new Date()) return "Birth date cannot be in the future";
        if (date < new Date("1900-01-01")) return "Birth date is not realistic";
        return "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) errors[key] = error;
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const sanitizedData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        address: formData.address,
        phone: formData.phone.replace(/\D/g, ""),
        birthDate: formData.birthDate,
      };

      await AuthService.registerPatient(sanitizedData);
      if (isAdminCreating) {
        navigate("/patients");
      } else {
        navigate("/login?type=patient&registered=true");
      }
    } catch (err: any) {
      const errorMessage =
        err?.message || "Failed to create account. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pb-4">
      <section className="section">
        <div className="container" style={{ maxWidth: "580px" }}>
          <h2 className="mb-3">Register Patient Account</h2>
          <p className="text-secondary">
            Sign up to access your patient portal and manage your appointments.
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger mb-3" role="alert">
                <i className="bi bi-exclamation-circle"></i> {error}
              </div>
            )}

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="fullName">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${
                    validationErrors.fullName ? "is-invalid" : ""
                  }`}
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                {validationErrors.fullName && (
                  <div className="invalid-feedback">
                    {validationErrors.fullName}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="email">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${
                    validationErrors.email ? "is-invalid" : ""
                  }`}
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                {validationErrors.email && (
                  <div className="invalid-feedback">
                    {validationErrors.email}
                  </div>
                )}
              </div>
            </div>

            <div className="row mb-1">
              <div className="col-md-6">
                <label className="form-label" htmlFor="password">
                  Password <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${
                    validationErrors.password ? "is-invalid" : ""
                  }`}
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  disabled={loading}
                />
                {validationErrors.password && (
                  <div className="invalid-feedback">
                    {validationErrors.password}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="confirmPassword">
                  Confirm Password <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${
                    validationErrors.confirmPassword ? "is-invalid" : ""
                  }`}
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
                {validationErrors.confirmPassword && (
                  <div className="invalid-feedback">
                    {validationErrors.confirmPassword}
                  </div>
                )}
              </div>
            </div>
            <div className="mb-3">
              <small className="form-text text-muted">
                Password must be at least 6 characters long and contain
                uppercase, lowercase, and special characters
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="address">
                Address <span className="text-danger">*</span>
              </label>
              <textarea
                className={`form-control ${
                  validationErrors.address ? "is-invalid" : ""
                }`}
                id="address"
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                required
                disabled={loading}
              />
              {validationErrors.address && (
                <div className="invalid-feedback">
                  {validationErrors.address}
                </div>
              )}
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="phone">
                  Phone Number <span className="text-danger">*</span>
                </label>
                <input
                  className={`form-control ${
                    validationErrors.phone ? "is-invalid" : ""
                  }`}
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="12345678"
                  maxLength={8}
                  disabled={loading}
                />
                {validationErrors.phone && (
                  <div className="invalid-feedback">
                    {validationErrors.phone}
                  </div>
                )}
                <small className="form-text text-muted">
                  Enter 8 digits (e.g., 12345678)
                </small>
              </div>
              <div className="col-md-6">
                <label className="form-label" htmlFor="birthDate">
                  Birth Date <span className="text-danger">*</span>
                </label>
                <div className="date-input-container">
                  <input
                    className={`form-control date-input ${
                      validationErrors.birthDate ? "is-invalid" : ""
                    }`}
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    required
                    max={new Date().toISOString().split("T")[0]}
                    min="1900-01-01"
                    disabled={loading}
                  />
                  <i
                    className="bi bi-calendar-date date-icon"
                    title="Click to open calendar"
                    onClick={() => {
                      if (!loading) {
                        const dateInput = document.getElementById(
                          "birthDate"
                        ) as HTMLInputElement;
                        if (dateInput) {
                          // Try modern showPicker API first, fallback to focus/click
                          if (dateInput.showPicker) {
                            dateInput.showPicker();
                          } else {
                            dateInput.focus();
                            dateInput.click();
                          }
                        }
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  ></i>
                </div>
                {validationErrors.birthDate && (
                  <div className="invalid-feedback">
                    {validationErrors.birthDate}
                  </div>
                )}
                <small className="form-text text-muted">
                  Click the calendar icon or the input field to select your date
                  of birth
                </small>
              </div>
            </div>

            <button type="submit" className="btn btn-teal" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus"></i> Create Account
                </>
              )}
            </button>
            {!isAdminCreating && (
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
            )}
            {isAdminCreating && (
              <button
                type="button"
                className="btn btn-outline-secondary ms-2"
                onClick={() => navigate("/patients")}
              >
                Cancel
              </button>
            )}
          </form>

          {!isAdminCreating && (
            <div className="mt-3 text-center">
              <p className="text-muted small">
                Already have an account?{" "}
                <a
                  href="/login?type=patient"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/login?type=patient");
                  }}
                >
                  Sign in here
                </a>
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default SignUp;
