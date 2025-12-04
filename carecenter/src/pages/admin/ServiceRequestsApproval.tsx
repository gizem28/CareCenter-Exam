import React, { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Alert,
  Spinner,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  appointmentRequests,
  type AppointmentDTO,
} from "../../api/appointments";
import { patientRequests } from "../../api/patients";

interface ServiceRequestWithPatient extends AppointmentDTO {
  patientName?: string;
  patientEmail?: string;
  workerName?: string;
  workerEmail?: string;
  startTime?: string;
  endTime?: string;
  selectedStartTime?: string;
  selectedEndTime?: string;
}

const ServiceRequestsApproval: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<ServiceRequestWithPatient[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await appointmentRequests.getAll();

      // Transform and enrich with patient information
      const enrichedAppointments = await Promise.all(
        (data as any[]).map(async (apt: any) => {
          let patientName = apt.patientName || "Unknown";
          let patientEmail = apt.patientEmail || "";

          // If patient info not included, fetch it
          if (!apt.patientName && apt.patientId) {
            try {
              const patient = await patientRequests.getById(apt.patientId);
              patientName = patient.fullName || "Unknown";
              patientEmail = patient.email || "";
            } catch {
              // If patient fetch fails, use defaults
            }
          }

          // Extract selected times (patient's chosen time) or fall back to availability times
          // Backend returns PascalCase: SelectedStartTime, SelectedEndTime, StartTime, EndTime
          // Also check availability object
          const selectedStartTime =
            apt.SelectedStartTime || apt.selectedStartTime || null;
          const selectedEndTime =
            apt.SelectedEndTime || apt.selectedEndTime || null;
          const availability = apt.Availability || apt.availability;

          // Get times - prioritize selected times, then use StartTime/EndTime from response, then availability
          const startTime =
            selectedStartTime ||
            apt.StartTime ||
            apt.startTime ||
            availability?.StartTime ||
            availability?.startTime ||
            null;
          const endTime =
            selectedEndTime ||
            apt.EndTime ||
            apt.endTime ||
            availability?.EndTime ||
            availability?.endTime ||
            null;

          return {
            id: apt.Id || apt.id,
            patientId: apt.PatientId || apt.patientId,
            status: apt.Status || apt.status || "Pending",
            availabilityId: apt.AvailabilityId || apt.availabilityId,
            date: apt.Date || apt.date,
            // Store both selected and final times
            startTime: startTime,
            endTime: endTime,
            selectedStartTime: selectedStartTime,
            selectedEndTime: selectedEndTime,
            createdAt: apt.CreatedAt || apt.createdAt,
            serviceType: apt.ServiceType || apt.serviceType || "",
            patientName,
            patientEmail,
            workerName: apt.WorkerName || apt.workerName || "Unknown",
            workerEmail: apt.WorkerEmail || apt.workerEmail || "",
            availability: availability,
          };
        })
      );

      setAppointments(enrichedAppointments);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load service requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (processingIds.has(id)) return;

    try {
      setProcessingIds((prev) => new Set(prev).add(id));
      setError("");
      await appointmentRequests.approve(id);
      setSuccessMessage("Appointment approved successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
      await loadAppointments(); // Reload to refresh the list
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to approve appointment. Please try again."
      );
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleReject = async (id: number) => {
    if (processingIds.has(id)) return;

    if (
      !window.confirm(
        "Are you sure you want to reject this appointment? The time slot will be released and available for booking again."
      )
    ) {
      return;
    }

    try {
      setProcessingIds((prev) => new Set(prev).add(id));
      setError("");
      await appointmentRequests.reject(id);
      setSuccessMessage(
        "Appointment rejected and time slot released successfully!"
      );
      setTimeout(() => setSuccessMessage(""), 4000);
      await loadAppointments(); // Reload to refresh the list
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to reject appointment. Please try again."
      );
    } finally {
      setProcessingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string | null): string => {
    if (!timeString) return "N/A";
    try {
      // Handle TimeSpan format: "HH:mm:ss" or "HH:mm:ss.fffffff" or just "HH:mm"
      const timeStr = String(timeString);
      const parts = timeStr.split(":");
      if (parts.length >= 2) {
        // Extract hours and minutes, pad if needed
        const hours = parts[0].padStart(2, "0");
        const minutes = parts[1].padStart(2, "0");
        return `${hours}:${minutes}`;
      }
      return timeStr;
    } catch (err) {
      console.warn("Error formatting time:", timeString, err);
      return String(timeString || "N/A");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "approved") {
      return <Badge bg="success">Approved</Badge>;
    } else if (statusLower === "pending") {
      return <Badge bg="warning">Pending</Badge>;
    } else if (statusLower === "rejected") {
      return <Badge bg="danger">Rejected</Badge>;
    } else if (statusLower === "cancelled") {
      return <Badge bg="secondary">Cancelled</Badge>;
    }
    return <Badge bg="info">{status}</Badge>;
  };

  const getServiceType = (appointment: ServiceRequestWithPatient): string => {
    return appointment.serviceType || "N/A";
  };

  const pendingAppointments = appointments.filter(
    (a) => a.status.toLowerCase() === "pending"
  );
  const otherAppointments = appointments.filter(
    (a) => a.status.toLowerCase() !== "pending"
  );

  return (
    <Container fluid className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Service Requests Approval</h2>
        <Button
          variant="outline-secondary"
          onClick={() => navigate("/admin/dashboard")}
        >
          <i className="bi bi-arrow-left"></i> Back to Dashboard
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          <i className="bi bi-exclamation-circle"></i> {error}
        </Alert>
      )}

      {successMessage && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccessMessage("")}
        >
          <i className="bi bi-check-circle"></i> {successMessage}
        </Alert>
      )}

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" className="text-teal" />
          <p>Loading service requests...</p>
        </div>
      ) : (
        <>
          {/* Pending Requests Section */}
          {pendingAppointments.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-3">
                Pending Requests ({pendingAppointments.length})
              </h4>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Worker</th>
                      <th>Service Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAppointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{formatDate(appointment.date)}</td>
                        <td>
                          {(() => {
                            // Use the times we already extracted in loadAppointments
                            const startTime = appointment.startTime;
                            const endTime = appointment.endTime;

                            if (startTime) {
                              const formattedStart = formatTime(startTime);
                              if (endTime) {
                                const formattedEnd = formatTime(endTime);
                                return `${formattedStart} - ${formattedEnd}`;
                              }
                              return formattedStart;
                            }
                            return "N/A";
                          })()}
                        </td>
                        <td>
                          <>
                            {appointment.patientName || "Unknown"}
                            {appointment.patientEmail && (
                              <>
                                <br />
                                <small className="text-muted">
                                  {appointment.patientEmail}
                                </small>
                              </>
                            )}
                          </>
                        </td>
                        <td>
                          <>
                            {appointment.workerName || "Unknown"}
                            {appointment.workerEmail && (
                              <>
                                <br />
                                <small className="text-muted">
                                  {appointment.workerEmail}
                                </small>
                              </>
                            )}
                          </>
                        </td>
                        <td>{getServiceType(appointment)}</td>
                        <td>{getStatusBadge(appointment.status)}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleApprove(appointment.id)}
                              disabled={processingIds.has(appointment.id)}
                            >
                              {processingIds.has(appointment.id) ? (
                                <>
                                  <Spinner size="sm" className="me-1" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-check-circle"></i> Approve
                                </>
                              )}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleReject(appointment.id)}
                              disabled={processingIds.has(appointment.id)}
                            >
                              {processingIds.has(appointment.id) ? (
                                <>
                                  <Spinner size="sm" className="me-1" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-x-circle"></i> Reject
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
            </div>
          )}

          {/* Other Appointments Section */}
          {otherAppointments.length > 0 && (
            <div>
              <h4 className="mb-3">
                Other Appointments ({otherAppointments.length})
              </h4>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Worker</th>
                      <th>Service Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherAppointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td>{formatDate(appointment.date)}</td>
                        <td>
                          {(() => {
                            // Use the times we already extracted in loadAppointments
                            const startTime = appointment.startTime;
                            const endTime = appointment.endTime;

                            if (startTime) {
                              const formattedStart = formatTime(startTime);
                              if (endTime) {
                                const formattedEnd = formatTime(endTime);
                                return `${formattedStart} - ${formattedEnd}`;
                              }
                              return formattedStart;
                            }
                            return "N/A";
                          })()}
                        </td>
                        <td>
                          <>
                            {appointment.patientName || "Unknown"}
                            {appointment.patientEmail && (
                              <>
                                <br />
                                <small className="text-muted">
                                  {appointment.patientEmail}
                                </small>
                              </>
                            )}
                          </>
                        </td>
                        <td>
                          <>
                            {appointment.workerName || "Unknown"}
                            {appointment.workerEmail && (
                              <>
                                <br />
                                <small className="text-muted">
                                  {appointment.workerEmail}
                                </small>
                              </>
                            )}
                          </>
                        </td>
                        <td>{getServiceType(appointment)}</td>
                        <td>{getStatusBadge(appointment.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}

          {appointments.length === 0 && (
            <Alert variant="info">
              <i className="bi bi-info-circle"></i> No service requests found.
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default ServiceRequestsApproval;
