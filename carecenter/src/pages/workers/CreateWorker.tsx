import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { healthcareWorkerRequests } from "../../api/healthcareWorkers";
import type { HealthcareWorkerDTO } from "../../api/healthcareWorkers";

const CreateWorker: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [formData, setFormData] = useState<
    Omit<HealthcareWorkerDTO, "id"> & { password: string }
  >({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    password: "",
  });
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);

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
      case "phone":
        const digitsOnly = value.replace(/\D/g, "");
        if (!digitsOnly) return "Phone number is required";
        if (digitsOnly.length !== 8)
          return "Phone number must be exactly 8 digits";
        return "";
      case "position":
        if (!value.trim()) return "Position is required";
        return "";
      case "password":
        if (!value.trim()) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
        // Check ASP.NET Identity requirements
        if (!/[A-Z]/.test(value))
          return "Password must contain at least one uppercase letter";
        if (!/[a-z]/.test(value))
          return "Password must contain at least one lowercase letter";
        if (!/[0-9]/.test(value))
          return "Password must contain at least one digit";
        if (!/[^A-Za-z0-9]/.test(value))
          return "Password must contain at least one special character";
        return "";
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const fullNameError = validateField("fullName", formData.fullName);
    if (fullNameError) errors.fullName = fullNameError;

    const emailError = validateField("email", formData.email);
    if (emailError) errors.email = emailError;

    const phoneError = validateField("phone", formData.phone);
    if (phoneError) errors.phone = phoneError;

    const positionError = validateField("position", formData.position);
    if (positionError) errors.position = positionError;

    const passwordError = validateField("password", formData.password);
    if (passwordError) errors.password = passwordError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // For phone field, only allow digits
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
      // Clear validation error for this field when user types
      if (validationErrors.phone) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        });
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear validation error for this field when user types
      if (validationErrors[name]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Frontend validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sanitize phone number - remove any non-digit characters before sending
      const sanitizedData: any = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone.replace(/\D/g, ""),
        position: formData.position,
        password: formData.password,
      };

      const response = await healthcareWorkerRequests.create(sanitizedData);

      // Check if response includes a password (generated or provided)
      if (response && (response as any).password) {
        setCreatedPassword((response as any).password);
        setShowPasswordSuccess(true);
        // Don't navigate immediately - show password to admin
      } else {
        navigate("/workers");
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create healthcare worker. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Register Healthcare Worker</h3>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/admin/dashboard")}
            >
              <i className="bi bi-arrow-left"></i> Back to Dashboard
            </button>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-circle"></i> {error}
                </div>
              )}

              {showPasswordSuccess && createdPassword && (
                <div className="alert alert-success" role="alert">
                  <h5 className="alert-heading">
                    <i className="bi bi-check-circle"></i> Worker Created
                    Successfully!
                  </h5>
                  <p>
                    <strong>Email:</strong> {formData.email}
                  </p>
                  <p>
                    <strong>Password:</strong>{" "}
                    <code
                      style={{
                        background: "#f8f9fa",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                      }}
                    >
                      {createdPassword}
                    </code>
                  </p>
                  <hr />
                  <p className="mb-0">
                    <strong>Important:</strong> Please share this password with
                    the worker. They can use it to log in and change their
                    password later.
                  </p>
                  <div className="mt-3">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setShowPasswordSuccess(false);
                        setCreatedPassword(null);
                        navigate("/workers");
                      }}
                    >
                      Continue to Workers List
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary ms-2"
                      onClick={() => {
                        setShowPasswordSuccess(false);
                        setCreatedPassword(null);
                        setFormData({
                          fullName: "",
                          email: "",
                          phone: "",
                          position: "",
                          password: "",
                        });
                      }}
                    >
                      Register Another Worker
                    </button>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                style={{ display: showPasswordSuccess ? "none" : "block" }}
              >
                <div className="mb-3">
                  <label htmlFor="fullName" className="form-label">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      validationErrors.fullName ? "is-invalid" : ""
                    }`}
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Enter worker's full name"
                  />
                  {validationErrors.fullName && (
                    <div className="invalid-feedback">
                      {validationErrors.fullName}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control ${
                      validationErrors.email ? "is-invalid" : ""
                    }`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter worker's email"
                  />
                  {validationErrors.email && (
                    <div className="invalid-feedback">
                      {validationErrors.email}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">
                    Phone <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className={`form-control ${
                      validationErrors.phone ? "is-invalid" : ""
                    }`}
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    pattern="[0-9]{8}"
                    maxLength={8}
                    placeholder="Enter 8-digit phone number"
                  />
                  {validationErrors.phone ? (
                    <div className="invalid-feedback">
                      {validationErrors.phone}
                    </div>
                  ) : (
                    <small className="form-text text-muted">
                      Phone number must be exactly 8 digits
                    </small>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="position" className="form-label">
                    Position <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${
                      validationErrors.position ? "is-invalid" : ""
                    }`}
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Sykepleier, Helsefagarbeider"
                  />
                  {validationErrors.position && (
                    <div className="invalid-feedback">
                      {validationErrors.position}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className={`form-control ${
                      validationErrors.password ? "is-invalid" : ""
                    }`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                    placeholder="Enter password (min 6 characters)"
                  />
                  {validationErrors.password ? (
                    <div className="invalid-feedback">
                      {validationErrors.password}
                    </div>
                  ) : (
                    <small className="form-text text-muted">
                      Password must be at least 6 characters and contain:
                      uppercase letter, lowercase letter, digit, and special
                      character (e.g., !@#$%^&*).
                    </small>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i> Register Worker
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate("/workers")}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWorker;
