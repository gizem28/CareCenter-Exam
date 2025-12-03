import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { healthcareWorkerRequests } from "../../api/healthcareWorkers";
import type { HealthcareWorkerDTO } from "../../api/healthcareWorkers";

const WorkersList: React.FC = () => {
  const navigate = useNavigate();
  const [workers, setWorkers] = useState<HealthcareWorkerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const data = await healthcareWorkerRequests.getAll();
      setWorkers(data);
      setError("");
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load healthcare workers.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (worker: HealthcareWorkerDTO) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete healthcare worker "${worker.fullName}" (${worker.email})?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(worker.id);
    // Optimistically remove from list for immediate UI update
    setWorkers((prev) => prev.filter((w) => w.id !== worker.id));

    try {
      await healthcareWorkerRequests.delete(worker.id);
      // Reload the list to ensure consistency with server
      await loadWorkers();
      setError("");
    } catch (err: any) {
      // Restore the worker if deletion failed
      await loadWorkers();
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete healthcare worker.";
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
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
        <h3>Healthcare Workers List</h3>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/workers/create")}
          >
            <i className="bi bi-person-plus"></i> Register Worker
          </button>
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
            <i className="bi bi-person-badge"></i> All Healthcare Workers (
            {workers.length})
          </h6>
        </div>
        <div className="card-body">
          {workers.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="bi bi-inbox"
                style={{ fontSize: "3rem", color: "#ccc" }}
              ></i>
              <p className="text-muted mt-3">No healthcare workers found.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate("/workers/create")}
              >
                <i className="bi bi-person-plus"></i> Register First Worker
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
                    <th>Position</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => (
                    <tr key={worker.id}>
                      <td>{worker.id}</td>
                      <td>{worker.fullName}</td>
                      <td>{worker.email}</td>
                      <td>{worker.phone}</td>
                      <td>
                        <span className="badge bg-secondary">
                          {worker.position}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info"
                            onClick={() => navigate(`/workers/${worker.id}`)}
                          >
                            <i className="bi bi-eye"></i> View
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(worker)}
                            disabled={deletingId === worker.id}
                          >
                            {deletingId === worker.id ? (
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

export default WorkersList;
