// pasient dashboard - viser avtaler og booking
// hasta paneli - randevularını görür ve yeni randevu alabilir
import React, { useState, useEffect, useRef } from "react";
import { Container, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import "../../css/PatientDashboard.css";
import {
  appointmentRequests,
  type AppointmentDTO,
  type AppointmentCreateDto,
  type AppointmentUpdateDto,
} from "../../api/appointments";
import { patientRequests } from "../../api/patients";
import ServiceRequestForm, {
  type ServiceType,
} from "../../components/patient/ServiceRequestForm";
import ServiceRequestList from "../../components/patient/ServiceRequestList";

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [patientId, setPatientId] = useState<number | null>(null);
  const patientIdRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingPatientId, setLoadingPatientId] = useState(true);
  const [error, setError] = useState<string>("");
  const submittingRef = useRef(false); // forhindre dobbelt innsending
  const [welcomeMessage, setWelcomeMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState(false);
  const [calendarRefreshTrigger, setCalendarRefreshTrigger] = useState(0);

  // hent pasient id fra api
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

        // bruk epost for å hente pasient
        try {
          const patient = await patientRequests.getByEmail(user.email);

          // håndter både camelCase og PascalCase
          const patientIdValue = patient.id || (patient as any).Id;
          if (patientIdValue) {
            setPatientId(patientIdValue);
            patientIdRef.current = patientIdValue; // Update ref as well

            setError("");
            // vis velkomst melding
            setWelcomeMessage(true);
            setTimeout(() => {
              setWelcomeMessage(false);
            }, 3000);
          } else {
            setError(
              "Patient account found but ID is missing. Please contact support."
            );
          }
        } catch (emailError: any) {
          // hvis epost ikke funker prøv å hente alle
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

  // last avtaler når pasientId er klar
  useEffect(() => {
    if (patientId === null || patientId === 0) {
      return;
    }

    // last med en gang
    const loadImmediately = async () => {
      await loadAppointments(patientId);
    };
    loadImmediately();

    // prøv igjen etter litt tid
    const retryTimer = setTimeout(async () => {
      await loadAppointments(patientId);
    }, 1000);

    return () => clearTimeout(retryTimer);
  }, [patientId]);

  // hent avtaler for pasient
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

      // transformer data fra backend til frontend format
      const transformedAppointments = data.map((apt: any) => {
        // håndter både camelCase og PascalCase
        const availability = apt.availability || apt.Availability;
        const availabilityDate = availability?.date || availability?.Date;
        const availabilityStartTime =
          availability?.startTime || availability?.StartTime;

        return {
          id: apt.id || apt.Id,
          patientId: apt.patientId || apt.PatientId,
          status: apt.status || apt.Status || "Pending",
          serviceType: apt.serviceType || apt.ServiceType || "",
          availabilityId: apt.availabilityId || apt.AvailabilityId,
          date: availabilityDate,
          createdAt: apt.createdAt || apt.CreatedAt,
          selectedStartTime: apt.selectedStartTime || apt.SelectedStartTime,
          // availability objekt med normaliserte feltnavn
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

      // oppdater state med ny data
      setAppointments((prev) => {
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

  // opprett ny avtale via api
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

      // parse tid streng til riktig format
      let selectedStartTime: string | undefined;

      if (request.selectedTime) {
        selectedStartTime = request.selectedTime.trim();
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
        serviceType: request.serviceType,
        requestedLocalTime: new Date(request.selectedDate),
        selectedStartTime: selectedStartTime,
      };

      await appointmentRequests.create(appointmentData);

      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
      }, 4000);

      // oppdater liste etter litt tid
      setTimeout(async () => {
        await loadAppointments(finalPatientId);
      }, 500);

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
    } finally {
      submittingRef.current = false;
    }
  };

  const handleUpdate = async (
    id: number,
    data: {
      availabilityId?: number;
      status?: string;
      serviceType?: string;
      selectedStartTime?: string;
    }
  ) => {
    try {
      setError("");
      const updateData: AppointmentUpdateDto = {
        availabilityId: data.availabilityId,
        status: data.status,
        serviceType: data.serviceType,
        selectedStartTime: data.selectedStartTime,
      };

      await appointmentRequests.update(id, updateData);
      await loadAppointments();
      // vis suksess melding
      setUpdateSuccessMessage(true);
      setTimeout(() => {
        setUpdateSuccessMessage(false);
      }, 4000);
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // slett avtale - sjekk at den ikke er i fortid
  const handleDelete = async (id: number) => {
    try {
      setError("");

      // finn avtale
      const appointment = appointments.find((apt) => apt.id === id);
      if (!appointment) {
        setError("Appointment not found.");
        return;
      }

      // hent dato for avtale
      const appointmentDate =
        appointment.date || appointment.availability?.date;
      if (!appointmentDate) {
        setError("Cannot determine appointment date.");
        return;
      }

      // sjekk om avtale er i fortid eller samme dag
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

      // oppdater kalender
      setCalendarRefreshTrigger((prev) => prev + 1);

      setDeleteSuccessMessage(true);
      setTimeout(() => {
        setDeleteSuccessMessage(false);
      }, 4000);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete appointment.";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancelForm = () => {
    setError("");
  };

  // vis loading spinner
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
            <ServiceRequestForm
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
