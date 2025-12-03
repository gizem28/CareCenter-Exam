import React from "react";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import type { PatientDTO } from "../../api/patients";

interface PatientModalProps {
  isOpen: boolean;
  patient: PatientDTO | null;
  onClose: () => void;
  formatDate: (dateString: string | undefined) => string;
}

const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  patient,
  onClose,
  formatDate,
}) => {
  const navigate = useNavigate();

  if (!isOpen || !patient) return null;

  return (
    <Modal show={isOpen} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-person me-2"></i>Patient Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-12 mb-4">
            <div className="d-flex align-items-center">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3"
                style={{ width: "60px", height: "60px", fontSize: "1.5rem" }}
              >
                <i className="bi bi-person"></i>
              </div>
              <div>
                <h4 className="mb-0">{patient.fullName}</h4>
                <p className="text-muted mb-0">Patient ID: {patient.id}</p>
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
                  href={`mailto:${patient.email}`}
                  className="text-decoration-none"
                >
                  {patient.email}
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
                  href={`tel:${patient.phone}`}
                  className="text-decoration-none"
                >
                  {patient.phone}
                </a>
              </div>
            </div>
          </div>
          <div className="col-md-12 mb-3">
            <div className="d-flex align-items-start">
              <i className="bi bi-geo-alt me-2 mt-1 text-success"></i>
              <div>
                <strong className="d-block mb-1">Address</strong>
                <p className="mb-0">{patient.address}</p>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="d-flex align-items-start">
              <i className="bi bi-calendar-event me-2 mt-1 text-success"></i>
              <div>
                <strong className="d-block mb-1">Birth Date</strong>
                <p className="mb-0">{formatDate(patient.birthDate)}</p>
              </div>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="d-flex align-items-start">
              <i className="bi bi-calculator me-2 mt-1 text-success"></i>
              <div>
                <strong className="d-block mb-1">Age</strong>
                <p className="mb-0">
                  {patient.birthDate
                    ? Math.floor(
                        (new Date().getTime() -
                          new Date(patient.birthDate).getTime()) /
                          (365.25 * 24 * 60 * 60 * 1000)
                      )
                    : "N/A"}{" "}
                  years old
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
            navigate(`/patients/${patient.id}`);
          }}
        >
          <i className="bi bi-pencil me-2"></i>Edit Patient
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PatientModal;
