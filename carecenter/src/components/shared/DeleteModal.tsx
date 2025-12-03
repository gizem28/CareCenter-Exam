import React from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import type { AppointmentDTO } from "../../api/appointments";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  appointment: AppointmentDTO | null;
  loading?: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  loading = false,
}) => {
  if (!appointment) return null;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header className="modal-header-danger">
        <Modal.Title>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Delete Appointment
        </Modal.Title>
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          disabled={loading}
          aria-label="Close"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </Modal.Header>

      <Modal.Body>
        <p className="delete-warning-text">
          Are you sure you want to delete this appointment?
        </p>
        <div className="appointment-details">
          <div className="detail-item">
            <span className="detail-label">Date:</span>
            <span className="detail-value">
              {formatDate(appointment.date || appointment.appointmentDate)}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Status:</span>
            <span className="detail-value">{appointment.status}</span>
          </div>
        </div>
        <p className="delete-confirmation-text">
          This action cannot be undone.
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Deleting...
            </>
          ) : (
            "Delete"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteModal;
