import React from "react";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import type { HealthcareWorkerDTO } from "../../api/healthcareWorkers";

interface WorkerModalProps {
  isOpen: boolean;
  worker: HealthcareWorkerDTO | null;
  onClose: () => void;
}

const WorkerModal: React.FC<WorkerModalProps> = ({
  isOpen,
  worker,
  onClose,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !worker) return null;

  return (
    <Modal show={isOpen} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-person-badge me-2"></i>Healthcare Worker Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-12 mb-4">
            <div className="d-flex align-items-center">
              <div
                className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center me-3"
                style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
              >
                <i className="bi bi-person-badge"></i>
              </div>
              <div>
                <h4 className="mb-0">{worker.fullName}</h4>
                <p className="text-muted mb-0">
                  <span className="badge bg-secondary me-2">
                    {worker.position}
                  </span>
                  ID: {worker.id}
                </p>
              </div>
            </div>
          </div>
          <hr />
          <div className="col-md-6 mb-3">
            <div className="d-flex align-items-start">
              <i className="bi bi-envelope me-2 mt-1 text-success"></i>
              <div>
                <strong className="d-block mb-1">Email</strong>
                <a
                  href={`mailto:${worker.email}`}
                  className="text-decoration-none"
                >
                  {worker.email}
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="d-flex align-items-start">
              <i className="bi bi-telephone me-2 mt-1 text-success"></i>
              <div>
                <strong className="d-block mb-1">Phone</strong>
                <a
                  href={`tel:${worker.phone}`}
                  className="text-decoration-none"
                >
                  {worker.phone}
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="d-flex align-items-start">
              <i className="bi bi-briefcase me-2 mt-1 text-success"></i>
              <div>
                <strong className="d-block mb-1">Position</strong>
                <p className="mb-0">
                  <span className="badge bg-secondary">{worker.position}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onClose();
            navigate(`/workers/${worker.id}`);
          }}
        >
          <i className="bi bi-pencil me-2"></i>Edit Worker
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default WorkerModal;
