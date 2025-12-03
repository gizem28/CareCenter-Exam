import React from "react";
import { useNavigate } from "react-router-dom";
import type { HealthcareWorkerDTO } from "../../api/healthcareWorkers";

interface WorkerTableProps {
  workers: HealthcareWorkerDTO[];
  onView: (worker: HealthcareWorkerDTO) => void;
}

const WorkerTable: React.FC<WorkerTableProps> = ({ workers, onView }) => {
  const navigate = useNavigate();

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light">
        <h6 className="mb-0 text-primary">
          <i className="bi bi-person-badge"></i> Healthcare Workers
        </h6>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-bordered table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Position</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.slice(0, 10).map((worker) => (
                <tr key={worker.id}>
                  <td>{worker.id}</td>
                  <td>
                    <strong>{worker.fullName}</strong>
                  </td>
                  <td>
                    <span className="badge bg-secondary">
                      {worker.position}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info"
                      onClick={() => onView(worker)}
                      title="View full details"
                    >
                      <i className="bi bi-eye"></i> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-center mt-3">
          <a
            href="/workers"
            className="btn btn-outline-primary"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              navigate("/workers");
            }}
          >
            <i className="bi bi-list"></i> View All Workers
          </a>
        </div>
      </div>
    </div>
  );
};

export default WorkerTable;
