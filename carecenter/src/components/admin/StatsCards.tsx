import React from "react";
import { useNavigate } from "react-router-dom";

interface StatsCardsProps {
  stats: {
    totalPatients: number;
    totalPersonnel: number;
    totalAppointments: number;
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const navigate = useNavigate();

  return (
    <div className="row mb-4 text-center align-items-stretch">
      <div className="col-md-4 mb-3 d-flex">
        <div className="card shadow-sm w-100 h-100">
          <div className="card-body d-flex flex-column justify-content-between">
            <div>
              <h6>Patients</h6>
              <p className="fw-bold">{stats.totalPatients}</p>
            </div>
            <div className="d-grid gap-2 mt-auto">
              <a
                href="/patients/create"
                className="btn btn-outline-success"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  navigate("/patients/create");
                }}
              >
                <i className="bi bi-person-plus"></i> Register Patient
              </a>
              <a
                href="/patients"
                className="btn btn-outline-success"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  navigate("/patients");
                }}
              >
                <i className="bi bi-people"></i> View All Patients
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-4 mb-3 d-flex">
        <div className="card shadow-sm w-100 h-100">
          <div className="card-body d-flex flex-column justify-content-between">
            <div>
              <h6>Healthcare Workers</h6>
              <p className="fw-bold">{stats.totalPersonnel}</p>
            </div>
            <div className="d-grid gap-2 mt-auto">
              <a
                href="/workers/create"
                className="btn btn-outline-success"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  navigate("/workers/create");
                }}
              >
                <i className="bi bi-person-plus"></i> Register Worker
              </a>
              <a
                href="/workers"
                className="btn btn-outline-success"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  navigate("/workers");
                }}
              >
                <i className="bi bi-people"></i> View All Workers
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-4 mb-3 d-flex">
        <div className="card shadow-sm w-100 h-100">
          <div className="card-body d-flex flex-column justify-content-between">
            <div>
              <h6>Appointments</h6>
              <p className="fw-bold">{stats.totalAppointments}</p>
              <small className="text-muted">Total Appointments</small>
            </div>
            <div className="d-grid gap-2 mt-auto">
              <button
                type="button"
                className="btn btn-outline-success"
                onClick={() => {
                  const element = document.getElementById(
                    "appointments-section"
                  );
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                <i className="bi bi-calendar-event"></i> View All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
