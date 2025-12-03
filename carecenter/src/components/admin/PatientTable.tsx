import React from "react";
import { useNavigate } from "react-router-dom";
import type { PatientDTO } from "../../api/patients";

interface PatientTableProps {
  patients: PatientDTO[];
  onView: (patient: PatientDTO) => void;
}

const PatientTable: React.FC<PatientTableProps> = ({ patients, onView }) => {
  const navigate = useNavigate();

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light">
        <h6 className="mb-0 text-primary">
          <i className="bi bi-people"></i> Recent Patients
        </h6>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-bordered table-striped table-hover">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.slice(0, 10).map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.id}</td>
                  <td>
                    <strong>{patient.fullName}</strong>
                  </td>
                  <td>{patient.email}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-info"
                      onClick={() => onView(patient)}
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
            href="/patients"
            className="btn btn-outline-primary"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              navigate("/patients");
            }}
          >
            <i className="bi bi-list"></i> View All Patients
          </a>
        </div>
      </div>
    </div>
  );
};

export default PatientTable;
