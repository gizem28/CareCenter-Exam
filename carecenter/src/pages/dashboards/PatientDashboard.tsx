import React, { useState, useEffect, useRef } from "react";
import { Container, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import "../../css/PatientDashboard.css";
import {
  appointmentRequests,
  type AppointmentDTO,
  type AppointmentCreateDto,
} from "../../api/appointments";
import { patientRequests } from "../../api/patients";
import PatientCalendarForm, {
  type ServiceType,
} from "../../components/patient/PatientCalendarForm";
import ServiceRequestList from "../../components/patient/ServiceRequestList";

// Main dashboard for patients - shows appointments and booking form
const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const patientIdRef = useRef<number | null>(null); // Ref to track patientId for closures
  const [loading, setLoading] = useState(false); // Start as false, will be set to true when loading appointments
  const [loadingPatientId, setLoadingPatientId] = useState(true); // Separate loading state for patient ID
  const [error, setError] = useState<string>("");
  const submittingRef = useRef(false); // Prevent duplicate submissions
  const [welcomeMessage, setWelcomeMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState(false);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);

  // Get patient ID from API
  useEffect(() => {
    const fetchPatientId = async () => {
      if (!user?.email) {
        setLoadingPatientId(false);
        return;
      }

      // Only fetch patient ID if user role is Client (Patient) or Patient
      if (
        user.role !== "Client" &&
        user.role !== "client" &&
        user.role !== "Patient"
      ) {
        setLoadingPatientId(false);
        return;
      }

      try {
        setLoadingPatientId(true);

        // Use the optimized GetByEmail endpoint instead of fetching all patients
        try {
          const patient = await patientRequests.getByEmail(user.email);

          // Handle both camelCase and PascalCase field names
          const patientIdValue = patient.id || (patient as any).Id;
          if (patientIdValue) {
            setPatientId(patientIdValue);
            patientIdRef.current = patientIdValue; // Update ref as well

            setError(""); // Clear any previous errors
            // Show welcome message
            setWelcomeMessage(true);
            // Hide welcome message after 3 seconds
            setTimeout(() => {
              setWelcomeMessage(false);
            }, 3000);
          } else {
            setError(
              "Patient account found but ID is missing. Please contact support."
            );
          }
        } catch (emailError: any) {
          // If GetByEmail fails (404), fall back to getAll for backward compatibility
          if (emailError?.response?.status === 404) {
            const patients = await patientRequests.getAll();
            const patient = patients.find((p) => {
              const patientEmail = p.email || (p as any).Email;
              return (
                patientEmail &&
                patientEmail.toLowerCase() === user.email.toLowerCase()
              );
            });

            if (patient) {
              const patientIdValue = patient.id || (patient as any).Id;
              if (patientIdValue) {
                setPatientId(patientIdValue);
                patientIdRef.current = patientIdValue;
                setError("");
                setWelcomeMessage(true);
                setTimeout(() => {
                  setWelcomeMessage(false);
                }, 3000);
              }
            } else {
              throw emailError; // Re-throw to show error message
            }
          } else {
            throw emailError;
          }
        }
      } catch (err: any) {
        console.error("Error fetching patient ID:", err);
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load patient information. Please try again later."
        );
      } finally {
        setLoadingPatientId(false);
      }
    };

    fetchPatientId();
  }, [user]);

  // Load appointments when patientId is available
  useEffect(() => {
    if (patientId === null || patientId === 0) {
      return;
    }

    // Load appointments immediately - use the patientId from the dependency
    const loadImmediately = async () => {
      await loadAppointments(patientId);
    };
    loadImmediately();

    // Also retry after a short delay to ensure data is available
    // This helps with cases where the backend might need a moment to process
    const retryTimer = setTimeout(async () => {
      await loadAppointments(patientId);
    }, 1000);

    return () => clearTimeout(retryTimer);
  }, [patientId]); // patientId is the only dependency we need

  // Load appointments for the current patient
  const loadAppointments = async (overridePatientId?: number | null) => {
    const idToUse =
      overridePatientId !== undefined ? overridePatientId : patientId;

    if (idToUse === null || idToUse === 0) {
      setAppointments([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await appointmentRequests.getByPatient(idToUse);

      if (!data || !Array.isArray(data)) {
        setAppointments([]);
        return;
      }

      // Transform backend Appointment model to AppointmentDTO format
      // Backend returns Appointment model with PascalCase fields
      const transformedAppointments = data.map((apt: any) => {
        // Handle both camelCase and PascalCase field names
        const availability = apt.availability || apt.Availability;
        const availabilityDate = availability?.date || availability?.Date;
        const availabilityStartTime =
          availability?.startTime || availability?.StartTime;

        return {
          id: apt.id || apt.Id,
          patientId: apt.patientId || apt.PatientId,
          status: apt.status || apt.Status || "Pending",
          availabilityId: apt.availabilityId || apt.AvailabilityId,
          date: availabilityDate,
          visitNote: apt.visitNote || apt.VisitNote,
          createdAt: apt.createdAt || apt.CreatedAt,
          tasks: apt.tasks || apt.Tasks || [],
          // Include selected times from appointment
          selectedStartTime: apt.selectedStartTime || apt.SelectedStartTime,
          selectedEndTime: apt.selectedEndTime || apt.SelectedEndTime,
          // Include full availability object with normalized field names
          availability: availability
            ? {
                id: availability.id || availability.Id,
                date: availabilityDate,
                startTime: availabilityStartTime,
                endTime: availability?.endTime || availability?.EndTime,
                healthcareWorkerId:
                  availability?.healthcareWorkerId ||
                  availability?.HealthcareWorkerId,
                healthcareWorker:
                  availability?.healthcareWorker ||
                  availability?.HealthcareWorker,
              }
            : undefined,
        };
      });

      // Force a state update by using a function to ensure React detects the change
      setAppointments((prev) => {
        // Only update if the data actually changed
        if (JSON.stringify(prev) !== JSON.stringify(transformedAppointments)) {
          return transformedAppointments;
        }
        return prev;
      });
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load appointments. Please try again.";
      setError(errorMsg);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: {
    serviceType: ServiceType;
    availabilityId: number;
    selectedDate: string;
    selectedTime: string;
  }) => {
    if (submittingRef.current) {
      return; // Prevent duplicate submissions
    }

    submittingRef.current = true;
    setError("");

    const currentPatientId = patientIdRef.current || patientId;

    if (currentPatientId === null || currentPatientId === 0) {
      if (user?.email) {
        try {
          const patients = await patientRequests.getAll();
          const patient = patients.find((p) => {
            const patientEmail = p.email || (p as any).Email;
            return (
              patientEmail &&
              patientEmail.toLowerCase() === user.email.toLowerCase()
            );
          });

          if (patient) {
            const patientIdValue = patient.id || (patient as any).Id;
            if (patientIdValue) {
              setPatientId(patientIdValue);
              patientIdRef.current = patientIdValue;
              await createAppointment(data, patientIdValue);
              submittingRef.current = false;
              return;
            }
          }
          setError("Patient account not found. Please contact support.");
        } catch (err: any) {
          setError("Failed to load patient information. Please try again.");
        } finally {
          submittingRef.current = false;
        }
        return;
      }
      setError("Patient information not found. Cannot create appointment.");
      submittingRef.current = false;
      return;
    }

    await createAppointment(data, currentPatientId);
    submittingRef.current = false;
  };

  // Create new appointment by calling API
  // Dette lager en ny avtale gjennom API-kallet
  const createAppointment = async (
    request: {
      serviceType: ServiceType;
      availabilityId: number;
      selectedDate: string;
      selectedTime: string; // Format: "HH:mm - HH:mm"
    },
    finalPatientId: number
  ) => {
    try {
      setError("");

      // Parse selectedTime string (format: "HH:mm")
      let selectedStartTime: string | undefined;

      if (request.selectedTime) {
        selectedStartTime = request.selectedTime.trim();
        // Convert to TimeSpan format (HH:mm:ss)
        if (selectedStartTime) {
          const startParts = selectedStartTime.split(":");
          if (startParts.length === 2) {
            selectedStartTime = `${startParts[0]}:${startParts[1]}:00`;
          }
        }
      }

      const appointmentData: AppointmentCreateDto = {
        availabilityId: request.availabilityId,
        patientId: finalPatientId,
        tasks: [request.serviceType],
        requestedLocalTime: new Date(request.selectedDate),
        selectedStartTime: selectedStartTime,
      };

      await appointmentRequests.create(appointmentData);

      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
      }, 4000);

      // Refresh appointments after a short delay to ensure backend has processed
      setTimeout(async () => {
        await loadAppointments(finalPatientId);
      }, 500);

      // Also refresh again after a longer delay as a fallback
      setTimeout(async () => {
        await loadAppointments(finalPatientId);
      }, 1500);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create appointment. Please try again.";
      setError(errorMessage);
      throw err;
    }
  };

  const handleUpdate = async (
    id: number,
    data: {
      availabilityId?: number;
      status?: string;
      serviceType?: string;
      selectedStartTime?: string;
      selectedEndTime?: string;
    }
  ) => {
    try {
      setError("");
      // If serviceType is provided, we need to update tasks
      const updateData: any = {
        availabilityId: data.availabilityId,
        status: data.status,
      };

      // If serviceType is provided, add it to the update data
      if (data.serviceType) {
        updateData.tasks = [data.serviceType];
      }

      // If selected times are provided, add them to the update data
      if (data.selectedStartTime) {
        updateData.selectedStartTime = data.selectedStartTime;
      }

      if (data.selectedEndTime) {
        updateData.selectedEndTime = data.selectedEndTime;
      }

      await appointmentRequests.update(id, updateData);
      await loadAppointments();
      // Show success message
      setUpdateSuccessMessage(true);
      setTimeout(() => {
        setUpdateSuccessMessage(false);
      }, 4000);
    } catch (err: any) {
      console.error("Error updating appointment:", err);
      throw err; // Let ServiceRequestList handle the error display
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setError("");

      // Find the appointment to check its date
      const appointment = appointments.find((apt) => apt.id === id);
      if (!appointment) {
        setError("Appointment not found.");
        return;
      }

      // Get the appointment date
      const appointmentDate =
        appointment.date ||
        appointment.appointmentDate ||
        appointment.availability?.date;
      if (!appointmentDate) {
        setError("Cannot determine appointment date.");
        return;
      }

      // Check if appointment is in the past or same day
      const appointmentDateObj = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      appointmentDateObj.setHours(0, 0, 0, 0); // Reset time to start of day

      if (appointmentDateObj < today) {
        setError("Cannot delete past appointments.");
        return;
      }

      if (appointmentDateObj.getTime() === today.getTime()) {
        setError("Cannot delete appointments on the same day.");
        return;
      }

      await appointmentRequests.delete(id, "Client");
      await loadAppointments();

      // Trigger calendar refresh by updating existingAppointments
      // This will cause the calendar to reload available dates
      setCalendarRefreshTrigger((prev) => prev + 1);

      // Show success message
      setDeleteSuccessMessage(true);
      setTimeout(() => {
        setDeleteSuccessMessage(false);
      }, 4000);
    } catch (err: any) {
      console.error("Error deleting appointment:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete appointment.";
      setError(errorMessage);
      throw err; // Let ServiceRequestList handle the error display
    }
  };

  const handleCancelForm = () => {
    // Form cancelled - no action needed
    // Clear any errors
    setError("");
  };

  // Show loading only if we're still fetching patient ID
  if (loadingPatientId) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center min-vh-custom">
        <Spinner animation="border" className="text-primary" />
        <p className="mt-2 text-muted">Loading patient information...</p>
      </div>
    );
  }

  return (
    <div className="bg-light py-5 min-vh-custom">
      <Container fluid>
        {welcomeMessage && (
          <Alert
            variant="success"
            dismissible
            onClose={() => setWelcomeMessage(false)}
          >
            <i className="bi bi-check-circle"></i> Welcome! You can manage your
            appointments from here.
          </Alert>
        )}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError("")}>
            <i className="bi bi-exclamation-circle"></i> {error}
          </Alert>
        )}
        {/* Success message - positioned at bottom right */}
        {successMessage && (
          <div className="success-message-container">
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccessMessage(false)}
            >
              <i className="bi bi-check-circle"></i> Appointment successfully
              created!
            </Alert>
          </div>
        )}
        {/* Delete success message - positioned at bottom right */}
        {deleteSuccessMessage && (
          <div className="success-message-container">
            <Alert
              variant="success"
              dismissible
              onClose={() => setDeleteSuccessMessage(false)}
            >
              <i className="bi bi-check-circle"></i> Appointment deleted
              successfully!
            </Alert>
          </div>
        )}
        {/* Update success message - positioned at bottom right */}
        {updateSuccessMessage && (
          <div className="success-message-container">
            <Alert
              variant="success"
              dismissible
              onClose={() => setUpdateSuccessMessage(false)}
            >
              <i className="bi bi-check-circle"></i> Appointment updated
              successfully!
            </Alert>
          </div>
        )}
        <div className="dashboard-layout">
          {/* Left Section: Create Service Request */}
          <div className="dashboard-left">
            <PatientCalendarForm
              onSubmit={handleFormSubmit}
              onCancel={handleCancelForm}
              existingAppointments={appointments
                .map((a) => a.availabilityId)
                .filter((id): id is number => id !== undefined)}
              refreshTrigger={calendarRefreshTrigger}
            />
          </div>

          {/* Right Section: My Appointments */}
          <div className="dashboard-right">
            <ServiceRequestList
              appointments={appointments}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              loading={loading}
            />
          </div>
        </div>
      </Container>
    </div>
  );
};

export default PatientDashboard;
