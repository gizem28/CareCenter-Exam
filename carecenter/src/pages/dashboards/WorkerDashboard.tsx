// dashboard for helsearbeider
// sağlık çalışanı paneli - müsaitlik ve randevuları yönetir
import React, { useState, useEffect } from "react";
import { Alert } from "react-bootstrap";
import { useAuth } from "../../contexts/AuthContext";
import type { AvailabilityDTO } from "../../api/availabilities";
import type { AppointmentDTO } from "../../api/appointments";
import { availabilityRequests } from "../../api/availabilities";
import { appointmentRequests } from "../../api/appointments";
import { healthcareWorkerRequests } from "../../api/healthcareWorkers";
import { patientRequests } from "../../api/patients";
import type { PatientDTO } from "../../api/patients";
import UnifiedCalendar from "../../components/shared/UnifiedCalendar";
import AvailabilityModal from "../../components/patient/AvailabilityModal";
import ConfirmationModal from "../../components/shared/ConfirmationModal";
import AvailabilityFormModal from "../../components/worker/AvailabilityFormModal";
import AvailabilityTable from "../../components/worker/AvailabilityTable";
import AppointmentTable from "../../components/worker/AppointmentTable";
import AppointmentDetailsModal from "../../components/shared/AppointmentDetailsModal";
import "../../css/Worker.css";

const WorkerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [workerId, setWorkerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const [availabilities, setAvailabilities] = useState<AvailabilityDTO[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAvailability, setEditingAvailability] =
    useState<AvailabilityDTO | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "calendar">("calendar");
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [alertType, setAlertType] = useState<"success" | "danger" | "">("");
  const [modalErrorMessage, setModalErrorMessage] = useState<string>("");
  const [selectedCalendarAvailability, setSelectedCalendarAvailability] =
    useState<AvailabilityDTO | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    availabilityId: number | null;
  }>({ isOpen: false, availabilityId: null });

  const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentDTO | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [patientInfo, setPatientInfo] = useState<PatientDTO | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  const [availabilityMode, setAvailabilityMode] = useState<
    "single" | "range" | "weekly"
  >("single");
  const [singleDate, setSingleDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [skipWeekends, setSkipWeekends] = useState<boolean>(true);

  useEffect(() => {
    loadWorkerData();
  }, [user]);

  useEffect(() => {
    setSelectedCalendarAvailability(null);
  }, [viewMode]);

  // hent arbeider info og data
  const loadWorkerData = async () => {
    if (!user?.email) return;
    try {
      setLoading(true);
      setError("");
      const worker = await healthcareWorkerRequests.getByEmail(user.email);
      if (!worker) {
        setError("Worker profile not found");
        return;
      }
      setWorkerId(worker.id);
      await Promise.all([
        loadAvailabilities(worker.id),
        loadAppointments(worker.id),
      ]);
    } catch (err: any) {
      setError(err.message || "Failed to load worker data");
    } finally {
      setLoading(false);
    }
  };

  // hent tilgjengeligheter for arbeider
  const loadAvailabilities = async (id: number) => {
    try {
      const workerAvailabilities = await availabilityRequests.getByWorker(id);
      setAvailabilities(workerAvailabilities);
    } catch (err: any) {
      setError("Failed to load availabilities");
    }
  };

  // hent avtaler for arbeider
  const loadAppointments = async (id: number) => {
    try {
      const data = await appointmentRequests.getByWorker(id);
      const mappedAppointments: AppointmentDTO[] = data.map((item) => {
        // formater tid fra selectedStartTime
        let appointmentTime = "";
        if (item.selectedStartTime) {
          appointmentTime = formatTime(item.selectedStartTime);
        }

        return {
          ...item,
          workerId: id,
          appointmentTime: appointmentTime,
        };
      });
      setAppointments(mappedAppointments);
    } catch (err: any) {
      setError("Failed to load appointments");
    }
  };

  // sjekk om dato er innen 30 dager
  const isWithin30Days = (dateStr: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate >= today && checkDate <= maxDate;
  };

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) return;

    try {
      let dates: string[] = [];
      if (availabilityMode === "single") {
        if (!singleDate) {
          showAlert("Please select a date", "danger");
          return;
        }
        dates = [singleDate];
      } else if (availabilityMode === "weekly") {
        if (!startDate || !endDate) {
          showAlert("Please select both start and end dates", "danger");
          return;
        }
        if (selectedDays.length === 0) {
          showAlert("Please select at least one day of the week", "danger");
          return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
          showAlert("Start date must be before end date", "danger");
          return;
        }
        const currentDate = new Date(start);
        while (currentDate <= end) {
          const dayOfWeek = currentDate.getDay();
          if (selectedDays.includes(dayOfWeek)) {
            dates.push(currentDate.toISOString().split("T")[0]);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        if (!startDate || !endDate) {
          showAlert("Please select both start and end dates", "danger");
          return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start > end) {
          showAlert("Start date must be before end date", "danger");
          return;
        }
        const currentDate = new Date(start);
        while (currentDate <= end) {
          if (skipWeekends) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              dates.push(currentDate.toISOString().split("T")[0]);
            }
          } else {
            dates.push(currentDate.toISOString().split("T")[0]);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      if (dates.length === 0) {
        showAlert("No valid dates to add", "danger");
        return;
      }

      // Validate that all dates are within 30 days
      const invalidDates = dates.filter((date) => !isWithin30Days(date));
      if (invalidDates.length > 0) {
        setModalErrorMessage(
          "Availability can only be added up to 30 days from today."
        );
        return;
      }

      const availabilities = dates.map((date) => {
        const payload: Partial<AvailabilityDTO> = {
          healthcareWorkerId: workerId,
          date: date,
        };
        if (startTime) payload.startTime = convertTimeToTimeSpan(startTime);
        if (endTime) payload.endTime = convertTimeToTimeSpan(endTime);
        return payload;
      });

      const response = await availabilityRequests.createBatch(availabilities);
      if (response.errors && response.errors.length > 0) {
        const errorMsg = response.errors
          .map(
            (e: any) => `${new Date(e.date).toLocaleDateString()}: ${e.error}`
          )
          .join("\n");
        setModalErrorMessage(
          `Some availabilities could not be added:\n${errorMsg}`
        );
        // Don't close modal when there are errors so user can see them
        return;
      }

      if (
        response.message &&
        (response.message.includes("No availabilities could be added") ||
          response.message.includes("No availabilities could be added."))
      ) {
        // Handle case where backend returns general error message
        // If there are errors, show them; otherwise show the message
        if (response.errors && response.errors.length > 0) {
          const errorMsg = response.errors
            .map(
              (e: any) => `${new Date(e.date).toLocaleDateString()}: ${e.error}`
            )
            .join("\n");
          setModalErrorMessage(
            `No availabilities could be added:\n${errorMsg}`
          );
        } else {
          setModalErrorMessage(response.message);
        }
        return;
      }

      showAlert(
        response.message || "Availabilities added successfully",
        "success"
      );
      await loadAvailabilities(workerId);
      resetForm();
      setModalErrorMessage("");
      setShowAddForm(false);
    } catch (err: any) {
      setModalErrorMessage(err.message || "Failed to add availability");
    }
  };

  const handleUpdateAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAvailability || !workerId || !singleDate) return;

    try {
      const dateParts = singleDate.split("-");
      if (dateParts.length !== 3) {
        showAlert("Invalid date format", "danger");
        return;
      }
      const formattedDate = `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}`;
      const updateData: any = { date: formattedDate };
      if (startTime) {
        updateData.startTime = convertTimeToTimeSpan(startTime);
      } else {
        updateData.startTime = null;
      }
      if (endTime) {
        updateData.endTime = convertTimeToTimeSpan(endTime);
      } else {
        updateData.endTime = null;
      }

      await availabilityRequests.update(editingAvailability.id, updateData);
      await loadAvailabilities(workerId);
      resetForm();
      setEditingAvailability(null);
      setShowAddForm(false);
    } catch (err: any) {
      showAlert(err.message || "Failed to update availability", "danger");
    }
  };

  const handleDeleteAvailability = (id: number) => {
    setDeleteConfirmation({ isOpen: true, availabilityId: id });
  };

  const confirmDeleteAvailability = async () => {
    if (!deleteConfirmation.availabilityId) return;
    try {
      await availabilityRequests.delete(deleteConfirmation.availabilityId);
      if (workerId) {
        await loadAvailabilities(workerId);
      }
      setDeleteConfirmation({ isOpen: false, availabilityId: null });
    } catch (err: any) {
      showAlert(err.message || "Failed to delete availability", "danger");
      setDeleteConfirmation({ isOpen: false, availabilityId: null });
    }
  };

  const handleEditAvailability = (availability: AvailabilityDTO) => {
    if (!availability.date) {
      showAlert("Cannot edit availability without date", "danger");
      return;
    }
    let dateForInput: string;
    if (typeof availability.date === "string") {
      const dateStr = availability.date.split("T")[0];
      const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (dateMatch) {
        dateForInput = dateStr;
      } else {
        const availabilityDate = new Date(availability.date);
        if (isNaN(availabilityDate.getTime())) {
          showAlert("Invalid date format", "danger");
          return;
        }
        const year = availabilityDate.getFullYear();
        const month = String(availabilityDate.getMonth() + 1).padStart(2, "0");
        const day = String(availabilityDate.getDate()).padStart(2, "0");
        dateForInput = `${year}-${month}-${day}`;
      }
    } else {
      const availabilityDate = new Date(availability.date);
      const year = availabilityDate.getFullYear();
      const month = String(availabilityDate.getMonth() + 1).padStart(2, "0");
      const day = String(availabilityDate.getDate()).padStart(2, "0");
      dateForInput = `${year}-${month}-${day}`;
    }

    const dateToCheck = new Date(dateForInput + "T00:00:00");
    if (dateToCheck < new Date()) {
      showAlert("Cannot edit past availabilities", "danger");
      return;
    }

    setEditingAvailability(availability);
    setAvailabilityMode("single");
    setSingleDate(dateForInput);
    setStartTime(convertTimeSpanToTime(availability.startTime));
    setEndTime(convertTimeSpanToTime(availability.endTime));
    setModalErrorMessage("");
    setShowAddForm(true);
  };

  const handleViewAppointment = async (appointment: AppointmentDTO) => {
    setSelectedAppointment(appointment);
    setShowAppointmentModal(true);
    if (appointment.patientId) {
      setLoadingPatient(true);
      setPatientInfo(null);
      try {
        const patient = await patientRequests.getById(appointment.patientId);
        setPatientInfo(patient);
      } catch (err: any) {
        // feilet å laste pasient info
      } finally {
        setLoadingPatient(false);
      }
    }
  };

  const resetForm = () => {
    setAvailabilityMode("single");
    setSingleDate("");
    setStartDate("");
    setEndDate("");
    setSelectedDays([]);
    setStartTime("");
    setEndTime("");
    setSkipWeekends(true);
    setEditingAvailability(null);
  };

  const showAlert = (message: string, type: "success" | "danger") => {
    setAlertMessage(message);
    setAlertType(type);
    // Auto-hide alert after 5 seconds
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 5000);
  };

  const toggleDay = (dayOfWeek: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayOfWeek)
        ? prev.filter((d) => d !== dayOfWeek)
        : [...prev, dayOfWeek]
    );
  };

  const convertTimeToTimeSpan = (time: string): string => {
    if (!time) return "";
    const parts = time.split(":");
    return `${parts[0]}:${parts[1] || "00"}:00`;
  };

  const convertTimeSpanToTime = (
    timeSpan: string | null | undefined
  ): string => {
    if (!timeSpan) return "";
    return timeSpan.substring(0, 5);
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "N/A";
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeString?: string | null): string => {
    if (!timeString || timeString.trim() === "") return "";
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  const isFutureDate = (dateString?: string): boolean => {
    if (!dateString) return false;
    return new Date(dateString) >= new Date();
  };

  const formatDateToLocalString = (date: Date): string => {
    // Create date string from local date components to avoid timezone conversion issues
    // Since availability dates are stored as date-only (not datetime), we want the date as the user sees it
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getAvailabilityForDate = (date: Date): AvailabilityDTO | undefined => {
    const dateStr = formatDateToLocalString(date);
    return availabilities.find((a) => {
      if (!a.date) return false;
      const availabilityDateStr = a.date.split("T")[0];
      return availabilityDateStr === dateStr;
    });
  };

  const handleCalendarDateClick = (value: Date) => {
    const availability = getAvailabilityForDate(value);
    if (availability && availability.isBooked) {
      // For booked dates, show appointment details
      const appointment = getAppointmentForAvailability(availability);
      if (appointment) {
        handleViewAppointment(appointment);
      }
    } else if (availability) {
      // For available dates, show availability details
      setSelectedCalendarAvailability(availability);
    } else {
      // No availability for this date
      setSelectedCalendarAvailability(null);
    }
  };

  const handleOpenAddAvailabilityModal = () => {
    resetForm();
    setModalErrorMessage("");
    setShowAddForm(true);
  };

  const getAppointmentForAvailability = (
    availability: AvailabilityDTO
  ): AppointmentDTO | undefined => {
    if (!availability.isBooked || !availability.date) return undefined;
    const availabilityDateStr = availability.date.split("T")[0];
    return appointments.find((apt) => {
      if (!apt.date) return false;
      const appointmentDateStr = apt.date.split("T")[0];
      return appointmentDateStr === availabilityDateStr;
    });
  };

  if (loading) {
    return (
      <div className="bg-light py-5">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-light py-5">
        <div className="alert alert-danger">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-light py-5 worker-dashboard-container">
      <h1 className="mb-4">Healthcare Worker Dashboard</h1>

      {/* Alert messages */}
      {alertMessage && (
        <div className="container mb-3">
          <Alert
            variant={alertType}
            dismissible
            onClose={() => {
              setAlertMessage("");
              setAlertType("");
            }}
          >
            {alertMessage}
          </Alert>
        </div>
      )}

      <AvailabilityFormModal
        isOpen={showAddForm}
        editingAvailability={editingAvailability}
        availabilityMode={availabilityMode}
        singleDate={singleDate}
        startDate={startDate}
        endDate={endDate}
        selectedDays={selectedDays}
        startTime={startTime}
        endTime={endTime}
        skipWeekends={skipWeekends}
        existingAvailabilities={availabilities}
        errorMessage={modalErrorMessage}
        hasValidationErrors={!!modalErrorMessage}
        onSetErrorMessage={setModalErrorMessage}
        onClose={() => {
          resetForm();
          setModalErrorMessage("");
          setShowAddForm(false);
        }}
        onModeChange={setAvailabilityMode}
        onSingleDateChange={setSingleDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onDayToggle={toggleDay}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
        onSkipWeekendsChange={setSkipWeekends}
        onSubmit={
          editingAvailability ? handleUpdateAvailability : handleAddAvailability
        }
      />

      {/* Main dashboard layout using Bootstrap grid */}
      <div className="row g-4">
        {/* Left side: Calendar/Availabilities */}
        <div className="col-lg-6">
          <section className="bg-white rounded p-4 shadow-sm h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 mb-0">My Availabilities</h2>
              <div className="d-flex gap-2">
                {!showAddForm && (
                  <>
                    <button
                      onClick={handleOpenAddAvailabilityModal}
                      className="btn btn-primary"
                    >
                      + Add Availability
                    </button>
                    <div className="btn-group">
                      <button
                        onClick={() => setViewMode("calendar")}
                        className={`btn ${
                          viewMode === "calendar"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                      >
                        Calendar
                      </button>
                      <button
                        onClick={() => setViewMode("table")}
                        className={`btn ${
                          viewMode === "table"
                            ? "btn-primary"
                            : "btn-outline-primary"
                        }`}
                      >
                        Table
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {availabilities.length === 0 ? (
              <div className="text-center p-4 text-muted">
                No availabilities added yet.
              </div>
            ) : viewMode === "calendar" ? (
              <UnifiedCalendar
                availabilities={availabilities}
                appointments={appointments}
                onDateClick={handleCalendarDateClick}
                showBooked={true}
                showApproved={true}
                dotSize={6}
              />
            ) : (
              <AvailabilityTable
                availabilities={availabilities}
                onEdit={handleEditAvailability}
                onDelete={handleDeleteAvailability}
                onViewAppointment={handleViewAppointment}
                formatDate={formatDate}
                formatTime={formatTime}
                isFutureDate={isFutureDate}
                getAppointmentForAvailability={getAppointmentForAvailability}
              />
            )}
          </section>
        </div>

        {/* Right side: Appointments */}
        <div className="col-lg-6">
          <section className="bg-white rounded p-4 shadow-sm h-100">
            <h2 className="h4 mb-3">My Appointments</h2>
            {appointments.length === 0 ? (
              <div className="text-center p-4 text-muted">
                No appointments scheduled.
              </div>
            ) : (
              <AppointmentTable
                appointments={appointments}
                onView={handleViewAppointment}
                formatDate={formatDate}
                formatTime={formatTime}
              />
            )}
          </section>
        </div>
      </div>

      {selectedCalendarAvailability && (
        <AvailabilityModal
          availability={selectedCalendarAvailability}
          onClose={() => setSelectedCalendarAvailability(null)}
          onEdit={handleEditAvailability}
          onDelete={handleDeleteAvailability}
          formatDate={formatDate}
          formatTime={formatTime}
          isFutureDate={isFutureDate}
        />
      )}

      <AppointmentDetailsModal
        isOpen={showAppointmentModal}
        appointment={selectedAppointment}
        patientInfo={patientInfo}
        loadingPatient={loadingPatient}
        onClose={() => {
          setShowAppointmentModal(false);
          setSelectedAppointment(null);
          setPatientInfo(null);
        }}
        formatDate={formatDate}
      />

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        title="Delete Availability"
        message="Are you sure you want to delete this availability? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDeleteAvailability}
        onCancel={() =>
          setDeleteConfirmation({ isOpen: false, availabilityId: null })
        }
      />
    </div>
  );
};

export default WorkerDashboard;
