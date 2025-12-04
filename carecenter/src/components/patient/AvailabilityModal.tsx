import React from "react";
import { Modal, Button, Badge } from "react-bootstrap";
import type { AvailabilityDTO } from "../../api/availabilities";

interface AvailabilityModalProps {
  availability: AvailabilityDTO;
  onClose: () => void;
  onEdit: (availability: AvailabilityDTO) => void;
  onDelete: (id: number) => void;
  formatDate: (date?: string | null) => string;
  formatTime: (time?: string | null) => string;
  isFutureDate: (dateString?: string) => boolean;
}

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  availability,
  onClose,
  onEdit,
  onDelete,
  formatDate,
  formatTime,
  isFutureDate,
}) => {
  const handleDeleteClick = () => {
    onDelete(availability.id);
    onClose();
  };

  return (
    <Modal show={true} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Availability Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <div className="mb-2">
            <strong className="text-primary">Date:</strong>{" "}
            {formatDate(availability.date)}
          </div>
          <div className="mb-2">
            <strong className="text-primary">Time:</strong>{" "}
            {availability.startTime && availability.endTime
              ? `${formatTime(availability.startTime)} - ${formatTime(
                  availability.endTime
                )}`
              : "All day"}
          </div>
          <div className="mb-2">
            <strong className="text-primary">Status:</strong>{" "}
            <Badge bg={availability.isBooked ? "secondary" : "success"}>
              {availability.isBooked ? "Booked" : "Available"}
            </Badge>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        {isFutureDate(availability.date) && !availability.isBooked && (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onEdit(availability);
                onClose();
              }}
            >
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={handleDeleteClick}>
              Delete
            </Button>
          </>
        )}
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AvailabilityModal;
