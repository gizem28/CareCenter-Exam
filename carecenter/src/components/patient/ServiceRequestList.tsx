import React, { useState } from "react";
import { Table, Button, Spinner } from "react-bootstrap";
import type { AppointmentDTO } from "../../api/appointments";
import DeleteModal from "../shared/DeleteModal";
import UpdateAppointmentModal from "./UpdateAppointmentModal";

interface ServiceRequestListProps {
  appointments: AppointmentDTO[];
  onUpdate: (
    id: number,
    data: {
      availabilityId?: number;
      status?: string;
      serviceType?: string;
      selectedStartTime?: string;
      selectedEndTime?: string;
    }
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  loading?: boolean;
}

const ServiceRequestList: React.FC<ServiceRequestListProps> = ({
  appointments,
  onUpdate,
  onDelete,
  loading = false,
}) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentDTO | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDeleteClick = (appointment: AppointmentDTO) => {
    setSelectedAppointment(appointment);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAppointment) return;

    try {
      setDeletingId(selectedAppointment.id);
      await onDelete(selectedAppointment.id);
      setDeleteModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateClick = (appointment: AppointmentDTO) => {
    setSelectedAppointment(appointment);
    setUpdateModalOpen(true);
  };

  const handleUpdateConfirm = async (
    availabilityId: number,
    serviceType?: string,
    selectedStartTime?: string,
    selectedEndTime?: string
  ) => {
    if (!selectedAppointment) return;

    try {
      setUpdatingId(selectedAppointment.id);
      await onUpdate(selectedAppointment.id, {
        availabilityId,
        serviceType: serviceType || undefined,
        selectedStartTime,
        selectedEndTime,
      });
      setUpdateModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      // Error handling is done in parent component
      throw error;
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      // Format: "Nov 18, 2025" (English month names)
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = months[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    } catch {
      return dateString;
    }
  };

  // Format time from TimeSpan string (HH:mm:ss) to HH:mm
  const formatTime = (timeString?: string): string => {
    if (!timeString) return "N/A";
    try {
      // TimeSpan format: "HH:mm:ss" or "HH:mm"
      const parts = timeString.split(":");
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
      return timeString;
    } catch {
      return timeString;
    }
  };

  // Get service type from tasks array (first task is usually the service type)
  const getServiceType = (appointment: AppointmentDTO): string => {
    let serviceType = "";
    if (appointment.serviceType) {
      serviceType = appointment.serviceType;
    } else if (appointment.tasks && appointment.tasks.length > 0) {
      const firstTask = appointment.tasks[0];
      // Handle both object format {description: string} and string format
      if (typeof firstTask === "string") {
        serviceType = firstTask;
      } else if (firstTask && typeof firstTask === "object") {
        serviceType =
          firstTask.description || (firstTask as any).Description || "N/A";
      }
    } else {
      return "N/A";
    }

    // Format service type: "Medical Care" instead of "MedicalCare"
    return serviceType.replace(/([A-Z])/g, " $1").trim();
  };

  // Check if appointment can be deleted (not past or same day)
  const canDeleteAppointment = (appointment: AppointmentDTO): boolean => {
    const appointmentDate =
      appointment.date ||
      appointment.appointmentDate ||
      appointment.availability?.date;
    if (!appointmentDate) {
      return false;
    }

    const appointmentDateObj = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    appointmentDateObj.setHours(0, 0, 0, 0); // Reset time to start of day

    // Cannot delete if appointment is in the past or same day
    return appointmentDateObj > today;
  };

  return (
    <div className="service-request-list">
      <h2 className="h4 text-primary fw-bold mb-3">My Appointments</h2>

      {loading && appointments.length === 0 ? (
        <div className="text-center p-4">
          <Spinner animation="border" className="text-primary" />
          <p className="mt-2 text-muted">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center p-4">
          <i className="bi bi-calendar-x fs-1 text-muted"></i>
          <p className="mt-2 text-muted">No appointments found.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table className="appointments-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Service Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments
                .sort((a, b) => {
                  // Sort by date first, then by time
                  const dateA =
                    a.date || a.appointmentDate || a.availability?.date || "";
                  const dateB =
                    b.date || b.appointmentDate || b.availability?.date || "";

                  if (dateA && dateB) {
                    const dateCompare =
                      new Date(dateA).getTime() - new Date(dateB).getTime();
                    if (dateCompare !== 0) {
                      return dateCompare;
                    }

                    // If dates are the same, sort by time
                    const timeA =
                      (a as any).selectedStartTime ||
                      (a as any).SelectedStartTime ||
                      a.availability?.startTime ||
                      (a.availability as any)?.StartTime ||
                      "";
                    const timeB =
                      (b as any).selectedStartTime ||
                      (b as any).SelectedStartTime ||
                      b.availability?.startTime ||
                      (b.availability as any)?.StartTime ||
                      "";

                    if (timeA && timeB) {
                      return timeA.localeCompare(timeB);
                    }
                    return timeA ? -1 : timeB ? 1 : 0;
                  }
                  return dateA ? -1 : dateB ? 1 : 0;
                })
                .map((appointment) => (
                  <tr key={appointment.id}>
                    <td>
                      {formatDate(
                        appointment.date ||
                          appointment.appointmentDate ||
                          appointment.availability?.date
                      )}
                    </td>
                    <td>
                      {(() => {
                        // Priority: Use selected start time from appointment, then fall back to availability start time
                        const selectedStartTime =
                          (appointment as any).selectedStartTime ||
                          (appointment as any).SelectedStartTime;

                        if (selectedStartTime) {
                          return formatTime(selectedStartTime);
                        }

                        // Fallback to availability start time if selected time not available
                        const availability = appointment.availability;
                        const startTime =
                          availability?.startTime ||
                          (availability as any)?.StartTime ||
                          appointment.appointmentTime ||
                          (appointment as any).startTime ||
                          (appointment as any).StartTime;

                        if (startTime) {
                          return formatTime(startTime);
                        }
                        return "N/A";
                      })()}
                    </td>
                    <td>{getServiceType(appointment)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          className="btn-outline-teal"
                          size="sm"
                          onClick={() => handleUpdateClick(appointment)}
                          disabled={
                            updatingId === appointment.id ||
                            deletingId === appointment.id
                          }
                          title="Update appointment"
                        >
                          <i className="bi bi-pencil"></i>
                          <span>Update</span>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteClick(appointment)}
                          disabled={
                            updatingId === appointment.id ||
                            deletingId === appointment.id ||
                            !canDeleteAppointment(appointment)
                          }
                          title={
                            !canDeleteAppointment(appointment)
                              ? "Cannot delete past or same-day appointments"
                              : "Delete appointment"
                          }
                        >
                          {deletingId === appointment.id ? (
                            <>
                              <Spinner size="sm" />
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <>
                              <i className="bi bi-trash"></i>
                              <span>Delete</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedAppointment(null);
        }}
        onConfirm={handleDeleteConfirm}
        appointment={selectedAppointment}
        loading={deletingId !== null}
      />

      {/* Update Modal */}
      <UpdateAppointmentModal
        isOpen={updateModalOpen}
        onClose={() => {
          setUpdateModalOpen(false);
          setSelectedAppointment(null);
        }}
        onConfirm={handleUpdateConfirm}
        appointment={selectedAppointment}
        loading={updatingId !== null}
      />
    </div>
  );
};

export default ServiceRequestList;

