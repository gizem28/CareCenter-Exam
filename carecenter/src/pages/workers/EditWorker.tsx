import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { healthcareWorkerRequests } from "../../api/healthcareWorkers";
import type { HealthcareWorkerDTO } from "../../api/healthcareWorkers";

const EditWorker: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [formData, setFormData] = useState<HealthcareWorkerDTO>({
    id: 0,
    fullName: "",
    email: "",
    phone: "",
    position: "",
  });

  useEffect(() => {
    loadWorker();
  }, [id]);

  const loadWorker = async () => {
    if (!id) {
      setError("Worker ID is missing");
      setLoadingData(false);
      return;
    }

    try {
      setLoadingData(true);
      setError("");
      const worker = await healthcareWorkerRequests.getById(parseInt(id));
      // Sanitize phone number - remove any non-digit characters
      const sanitizedPhone = worker.phone.replace(/\D/g, "");
      setFormData({
        ...worker,
        phone: sanitizedPhone,
      });
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load healthcare worker. Please try again.";
      setError(errorMessage);
    } finally {
      setLoadingData(false);
    }
  };

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
    setSuccess(false);

    // Frontend validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Sanitize phone number - remove any non-digit characters before sending
      const sanitizedData = {
        ...formData,
        phone: formData.phone.replace(/\D/g, ""),
      };

      await healthcareWorkerRequests.update(sanitizedData.id, sanitizedData);
      setSuccess(true);
      // Show success message for 2 seconds before redirecting
      setTimeout(() => {
        navigate("/workers");
      }, 2000);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update healthcare worker. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container mt-4">
        <div className="row">
          <div className="col-md-8 offset-md-2">
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading healthcare worker data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3">Edit Healthcare Worker</h1>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/workers")}
            >
              <i className="bi bi-arrow-left"></i> Back to Workers
            </button>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              {success && (
                <div className="alert alert-success" role="alert">
                  <i className="bi bi-check-circle"></i> Healthcare worker
                  successfully updated! Redirecting...
                </div>
              )}
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-circle"></i> {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
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
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle"></i> Update Worker
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

export default EditWorker;
