import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { patientRequests } from "../../api/patients";
import type { PatientDTO } from "../../api/patients";

const PatientsList: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const data = await patientRequests.getAll();
      setPatients(data);
      setError("");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load patients.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (patient: PatientDTO) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete patient "${patient.fullName}" (${patient.email})?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(patient.id);
    // Optimistically remove from list for immediate UI update
    setPatients((prev) => prev.filter((p) => p.id !== patient.id));

    try {
      await patientRequests.delete(patient.id);
      // Reload the list to ensure consistency with server
      await loadPatients();
      setError("");
    } catch (err: any) {
      // Restore the patient if deletion failed
      await loadPatients();
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete patient.";
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Patients List</h1>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate("/admin/dashboard")}
          >
            <i className="bi bi-arrow-left"></i> Back to Dashboard
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-circle"></i> {error}
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h6 className="mb-0">
            <i className="bi bi-people"></i> All Patients ({patients.length})
          </h6>
        </div>
        <div className="card-body">
          {patients.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="bi bi-inbox"
                style={{ fontSize: "3rem", color: "#ccc" }}
              ></i>
              <p className="text-muted mt-3">No patients found.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate("/patients/create")}
              >
                <i className="bi bi-person-plus"></i> Register First Patient
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-striped table-hover">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Birth Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td>{patient.id}</td>
                      <td>{patient.fullName}</td>
                      <td>{patient.email}</td>
                      <td>{patient.phone}</td>
                      <td>{patient.address}</td>
                      <td>{formatDate(patient.birthDate)}</td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info"
                            onClick={() => navigate(`/patients/${patient.id}`)}
                          >
                            <i className="bi bi-eye"></i> View
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(patient)}
                            disabled={deletingId === patient.id}
                          >
                            {deletingId === patient.id ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-1"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                Deleting...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-trash"></i> Delete
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientsList;
