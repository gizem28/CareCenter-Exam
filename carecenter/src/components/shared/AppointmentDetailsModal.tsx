import React from "react";
import { Modal, Button } from "react-bootstrap";
import type { AppointmentDTO } from "../../api/appointments";
import type { PatientDTO } from "../../api/patients";

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  appointment: AppointmentDTO | null;
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
                <strong>Date:</strong> {formatDate(appointment.date)}
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
            <strong>Status:</strong> <span>{appointment.status}</span>
          </p>
          <p>
            <strong>Patient ID:</strong> {appointment.patientId}
          </p>

          {appointment.serviceType && (
            <p>
              <strong>Service Type:</strong> {appointment.serviceType}
            </p>
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
