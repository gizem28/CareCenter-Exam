import React, { useState, useEffect } from "react";
import { Modal, Button, Badge, Spinner } from "react-bootstrap";
import type { AvailabilityDTO } from "../../api/availabilities";
import type { AppointmentDTO } from "../../api/appointments";
import { patientRequests } from "../../api/patients";
import type { PatientDTO } from "../../api/patients";
import ConfirmationModal from "../shared/ConfirmationModal";

interface AvailabilityModalProps {
  availability: AvailabilityDTO;
  appointment?: AppointmentDTO & {
    tasks?: Array<{ description: string; done: boolean }>;
  };
  onClose: () => void;
  onEdit: (availability: AvailabilityDTO) => void;
  onDelete: (id: number) => void;
  formatDate: (date?: string | null) => string;
  formatTime: (time?: string | null) => string;
  isFutureDate: (dateString?: string) => boolean;
}

const calculateAge = (birthDate: string): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  availability,
  appointment,
  onClose,
  onEdit,
  onDelete,
  formatDate,
  formatTime,
  isFutureDate,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientDTO | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  useEffect(() => {
    // Fetch patient information when appointment is available
    if (appointment?.patientId) {
      setLoadingPatient(true);
      setPatientInfo(null);
      patientRequests
        .getById(appointment.patientId)
        .then((patient) => {
          setPatientInfo(patient);
        })
        .catch((err) => {
          console.error("Failed to load patient information:", err);
        })
        .finally(() => {
          setLoadingPatient(false);
        });
    }
  }, [appointment?.patientId]);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(availability.id);
    setShowDeleteConfirm(false);
    onClose();
  };
  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return "warning";
    const statusLower = status.toLowerCase();
    if (statusLower === "completed") return "success";
    if (statusLower === "cancelled") return "danger";
    return "warning";
  };

  return (
    <>
      <Modal show={true} onHide={onClose} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {availability.isBooked
              ? "Appointment Details"
              : "Availability Details"}
          </Modal.Title>
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
          {availability.isBooked && appointment && (
            <>
              {/* Patient Information Section */}
              {loadingPatient ? (
                <div className="text-center p-3">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading patient information...
                </div>
              ) : patientInfo ? (
                <div className="mb-3">
                  <h5 className="mb-2">Patient Information</h5>
                  <div>
                    <div className="mb-2">
                      <strong className="text-primary">Name:</strong>{" "}
                      {patientInfo.fullName}
                      {patientInfo.birthDate &&
                        calculateAge(patientInfo.birthDate) !== null &&
                        ` (${calculateAge(patientInfo.birthDate)} years old)`}
                    </div>
                    {patientInfo.phone && (
                      <div className="mb-2">
                        <strong className="text-primary">Phone:</strong>{" "}
                        {patientInfo.phone}
                      </div>
                    )}
                    {patientInfo.email && (
                      <div className="mb-2">
                        <strong className="text-primary">Email:</strong>{" "}
                        {patientInfo.email}
                      </div>
                    )}
                    {patientInfo.address && (
                      <div className="mb-2">
                        <strong className="text-primary">Address:</strong>{" "}
                        {patientInfo.address}
                      </div>
                    )}
                  </div>
                </div>
              ) : appointment.patientName ? (
                <div className="mb-3">
                  <strong>Patient:</strong> {appointment.patientName}
                </div>
              ) : null}

              <div className="mb-3">
                <h5 className="mb-2">Appointment Information</h5>
                <div>
                  {appointment.status && (
                    <div className="mb-2">
                      <strong className="text-primary">Status:</strong>{" "}
                      <Badge bg={getStatusBadgeVariant(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  )}
                  {appointment.notes && (
                    <div className="mb-2">
                      <strong className="text-primary">Notes:</strong>
                      <div className="mt-1 p-2 bg-light rounded">
                        {appointment.notes}
                      </div>
                    </div>
                  )}
                  {appointment.tasks && appointment.tasks.length > 0 && (
                    <div className="mb-2">
                      <strong className="text-primary">Tasks:</strong>
                      <ul className="mt-2 mb-0">
                        {appointment.tasks.map(
                          (
                            task: { description: string; done: boolean },
                            idx: number
                          ) => (
                            <li
                              key={idx}
                              className={
                                task.done
                                  ? "text-decoration-line-through text-muted"
                                  : ""
                              }
                            >
                              {task.description}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
          {availability.isBooked && !appointment && (
            <div className="text-center p-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Appointment details are being loaded...
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {isFutureDate(availability.date) && (
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Availability"
        message="Are you sure you want to delete this availability? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};

export default AvailabilityModal;
