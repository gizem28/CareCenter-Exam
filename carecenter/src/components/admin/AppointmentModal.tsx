import React from "react";
import { Modal, Button } from "react-bootstrap";
import type { AppointmentDTO } from "../../api/appointments";

interface AppointmentModalProps {
  isOpen: boolean;
  appointment: AppointmentDTO | null;
  onClose: () => void;
  formatDate: (dateString: string | undefined) => string;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  appointment,
  onClose,
  formatDate,
}) => {
  if (!isOpen || !appointment) return null;

  const getStatusBadge = (status: string | undefined) => {
    const statusLower = (status || "Pending").toLowerCase();
    if (statusLower === "approved") return "bg-success";
    if (statusLower === "pending") return "bg-warning";
    if (statusLower === "rejected") return "bg-danger";
    if (statusLower === "completed") return "bg-success";
    if (statusLower === "cancelled") return "bg-secondary";
    return "bg-info";
  };

  return (
    <Modal show={isOpen} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="bi bi-calendar-event me-2"></i>Appointment Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-md-6 mb-3">
            <strong>Appointment ID:</strong> {appointment.id}
          </div>
          <div className="col-md-6 mb-3">
            <strong>Patient:</strong>{" "}
            {appointment.patientName || `Patient #${appointment.patientId}`}
          </div>
          {appointment.workerName && (
            <div className="col-md-6 mb-3">
              <strong>Healthcare Worker:</strong> {appointment.workerName}
            </div>
          )}
          <div className="col-md-6 mb-3">
            <strong>Date:</strong>{" "}
            {formatDate(appointment.appointmentDate || appointment.date)}
          </div>
          {appointment.appointmentTime && (
            <div className="col-md-6 mb-3">
              <strong>Time:</strong> {appointment.appointmentTime}
            </div>
          )}
          {appointment.serviceType && (
            <div className="col-md-6 mb-3">
              <strong>Service Type:</strong>{" "}
              <span className="badge bg-info">{appointment.serviceType}</span>
            </div>
          )}
          <div className="col-md-6 mb-3">
            <strong>Status:</strong>{" "}
            <span className={`badge ${getStatusBadge(appointment.status)}`}>
              {appointment.status || "Pending"}
            </span>
          </div>
          {appointment.notes && (
            <div className="col-md-12 mb-3">
              <strong>Notes:</strong>
              <p className="mt-2">{appointment.notes}</p>
            </div>
          )}
          {appointment.visitNote && (
            <div className="col-md-12 mb-3">
              <strong>Visit Note:</strong>
              <p className="mt-2">{appointment.visitNote}</p>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AppointmentModal;
