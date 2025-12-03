import React from "react";
import { Modal, Button } from "react-bootstrap";
import type { AppointmentDTO } from "../../api/appointments";
import type { PatientDTO } from "../../api/patients";

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  appointment:
    | (AppointmentDTO & {
        tasks?: Array<{ description: string; done: boolean }>;
      })
    | null;
  patientInfo: PatientDTO | null;
  loadingPatient: boolean;
  onClose: () => void;
  formatDate: (dateString?: string | null) => string;
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  appointment,
  patientInfo,
  loadingPatient,
  onClose,
  formatDate,
}) => {
  if (!isOpen || !appointment) return null;

  const getStatusBadge = (status: string | undefined) => {
    const statusLower = (status || "Pending").toLowerCase();
    if (statusLower === "approved") return "badge-success";
    if (statusLower === "pending") return "badge-warning";
    if (statusLower === "rejected") return "badge-danger";
    if (statusLower === "cancelled" || statusLower === "completed")
      return "badge-secondary";
    return "badge-info";
  };

  return (
    <Modal show={isOpen} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Appointment Details</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {loadingPatient ? (
          <div className="text-center p-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">
                Loading patient information...
              </span>
            </div>
            <p className="mt-2">Loading patient information...</p>
          </div>
        ) : patientInfo ? (
          <div className="mb-4">
            <h5 className="mb-3">Patient Information</h5>
            <div className="row">
              <div className="col-sm-6">
                <p>
                  <strong>Name:</strong> {patientInfo.fullName}
                </p>
              </div>
              {patientInfo.phone && (
                <div className="col-sm-6">
                  <p>
                    <strong>Phone:</strong> {patientInfo.phone}
                  </p>
                </div>
              )}
            </div>
            {patientInfo.email && (
              <p>
                <strong>Email:</strong> {patientInfo.email}
              </p>
            )}
            {patientInfo.address && (
              <p>
                <strong>Address:</strong> {patientInfo.address}
              </p>
            )}
            {patientInfo.birthDate && (
              <p>
                <strong>Birth Date:</strong> {formatDate(patientInfo.birthDate)}
              </p>
            )}
          </div>
        ) : appointment.patientName ? (
          <div className="mb-4">
            <h5 className="mb-3">Patient Information</h5>
            <p>
              <strong>Patient Name:</strong> {appointment.patientName}
            </p>
          </div>
        ) : null}

        <div>
          <h5 className="mb-3">Appointment Information</h5>
          <div className="row">
            <div className="col-sm-6">
              <p>
                <strong>Date:</strong> {formatDate(appointment.appointmentDate)}
              </p>
            </div>
            {appointment.appointmentTime && (
              <div className="col-sm-6">
                <p>
                  <strong>Time:</strong> {appointment.appointmentTime}
                </p>
              </div>
            )}
          </div>
          <p>
            <strong>Status:</strong>{" "}
            <span className={`badge ${getStatusBadge(appointment.status)}`}>
              {appointment.status || "Pending"}
            </span>
          </p>
          <p>
            <strong>Patient ID:</strong> {appointment.patientId}
          </p>

          {appointment.notes && (
            <div className="mb-3">
              <strong>Notes:</strong>
              <div className="mt-2 p-3 bg-light rounded">
                {appointment.notes}
              </div>
            </div>
          )}

          {appointment.serviceType && (
            <p>
              <strong>Service Type:</strong> {appointment.serviceType}
            </p>
          )}

          {appointment.tasks && appointment.tasks.length > 0 && (
            <div>
              <strong>Tasks:</strong>
              <ul className="list-group mt-2">
                {appointment.tasks.map((task, idx) => (
                  <li
                    key={idx}
                    className="list-group-item d-flex align-items-center"
                    style={{
                      textDecoration: task.done ? "line-through" : "none",
                      color: task.done ? "#6c757d" : "inherit",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      readOnly
                      className="me-2"
                    />
                    {task.description}
                  </li>
                ))}
              </ul>
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

export default AppointmentDetailsModal;
