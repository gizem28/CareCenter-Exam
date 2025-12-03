import React, { useState, useEffect, useMemo, useRef } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import {
  availabilityRequests,
  type AvailabilityDTO,
} from "../../api/availabilities";
export type ServiceType =
  | "Medical Care"
  | "Medication Delivery"
  | "Companionship"
  | "Personal Care";

interface PatientCalendarFormProps {
  onSubmit: (data: {
    serviceType: ServiceType;
    availabilityId: number;
    selectedDate: string;
    selectedTime: string;
  }) => void;
  onCancel: () => void;
  existingAppointments: number[]; // Array of availability IDs that are already booked
  refreshTrigger?: number; // Trigger to refresh the calendar
}

const PatientCalendarForm: React.FC<PatientCalendarFormProps> = ({
  onSubmit,
  onCancel,
  existingAppointments,
  refreshTrigger = 0,
}) => {
  const [serviceType, setServiceType] = useState<ServiceType | null>(null);
  const [availableDates, setAvailableDates] = useState<AvailabilityDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const today = new Date();
  const [availableWorkersForDate, setAvailableWorkersForDate] = useState<
    AvailabilityDTO[]
  >([]);
  const [selectedAvailability, setSelectedAvailability] =
    useState<AvailabilityDTO | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [loading] = useState(false);
  const [error, setError] = useState<string>("");
  const [loadingDates, setLoadingDates] = useState(false);
  const submittingRef = useRef(false); // Prevent duplicate submissions

  const formatDateToLocalString = (date: Date): string => {
    // Create date string from local date components to avoid timezone conversion issues
    // Since availability dates are stored as date-only (not datetime), we want the date as the user sees it
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Generate next 20 days after today
  const next20Days = useMemo(() => {
    const dates: Date[] = [];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1); // Start from tomorrow

    for (let i = 0; i < 20; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [today]);

  // Filter out already booked availabilities
  const unbookedAvailabilities = useMemo(() => {
    return availableDates.filter((a) => !existingAppointments.includes(a.id));
  }, [availableDates, existingAppointments]);

  // Get available dates from next 20 days that have unbooked availabilities
  const availableDatesForSelect = useMemo(() => {
    return next20Days.filter((date) => {
      const dateStr = formatDateToLocalString(date);
      return unbookedAvailabilities.some((availability) => {
        if (!availability.date) return false;
        const availabilityDateStr = availability.date.split("T")[0];
        return availabilityDateStr === dateStr;
      });
    });
  }, [next20Days, unbookedAvailabilities]);

  // Parse TimeSpan string (HH:mm:ss) to hours and minutes
  const parseTimeSpan = (
    timeSpan: string | undefined
  ): { hours: number; minutes: number } | null => {
    if (!timeSpan) return null;
    try {
      const parts = timeSpan.split(":");
      if (parts.length >= 2) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        if (!isNaN(hours) && !isNaN(minutes)) {
          return { hours, minutes };
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  // Get time slots for selected date
  const getTimeSlots = (): string[] => {
    if (!selectedAvailability) return [];

    const startTime = parseTimeSpan(selectedAvailability.startTime);
    const endTime = parseTimeSpan(selectedAvailability.endTime);

    if (!startTime || !endTime) {
      // Default: 8:00 to 18:00
      return Array.from({ length: 11 }, (_, i) => {
        const hour = 8 + i;
        return `${hour.toString().padStart(2, "0")}:00`;
      });
    }

    const slots: string[] = [];
    let currentHour = startTime.hours;
    const endHour = endTime.hours;

    while (currentHour <= endHour) {
      slots.push(`${currentHour.toString().padStart(2, "0")}:00`);
      currentHour++;
    }

    return slots.length > 0 ? slots : ["08:00"];
  };

  const timeSlots = useMemo(() => getTimeSlots(), [selectedAvailability]);

  useEffect(() => {
    loadAvailableDates();
  }, []);

  // Refresh calendar when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadAvailableDates();
    }
  }, [refreshTrigger]);

  const loadAvailableDates = async () => {
    try {
      setLoadingDates(true);
      setError("");
      const dates = await availabilityRequests.getUnbooked();
      setAvailableDates(dates);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load available dates. Please try again."
      );
    } finally {
      setLoadingDates(false);
    }
  };

  const handleDateSelect = (dateStr: string) => {
    // Clear any previous error when selecting a new date
    setError("");

    // Find ALL availabilities for this date (multiple workers)
    const availabilitiesForDate = unbookedAvailabilities.filter((a) => {
      if (!a.date) return false;
      const availabilityDateStr = a.date.split("T")[0];
      return availabilityDateStr === dateStr;
    });

    if (availabilitiesForDate.length > 0) {
      const selectedDateObj = new Date(dateStr);
      setSelectedDate(selectedDateObj);
      setAvailableWorkersForDate(availabilitiesForDate);
      // If only one worker, auto-select it; otherwise let user choose
      if (availabilitiesForDate.length === 1) {
        setSelectedAvailability(availabilitiesForDate[0]);
      } else {
        setSelectedAvailability(null);
      }
      setSelectedStartTime("");
    } else {
      setError("No availability found for this date.");
    }
  };

  const handleWorkerSelect = (availability: AvailabilityDTO) => {
    setSelectedAvailability(availability);
    setSelectedStartTime("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Prevent duplicate submissions
    if (submittingRef.current) {
      return;
    }

    // Validation
    if (!serviceType) {
      setError("Please select a service type.");
      return;
    }

    if (!selectedDate) {
      setError("Please select an available date from the dropdown.");
      return;
    }

    if (!selectedAvailability) {
      if (availableWorkersForDate.length > 1) {
        setError("Please select a healthcare worker for this date.");
      } else {
        setError("Please select an available date from the dropdown.");
      }
      return;
    }

    if (!selectedStartTime) {
      setError("Please select a time.");
      return;
    }

    submittingRef.current = true;

    const selectedDateStr = selectedAvailability.date;
    if (!selectedDateStr) {
      setError("Invalid date selected.");
      submittingRef.current = false;
      return;
    }

    // Use start time as the selected time
    onSubmit({
      serviceType,
      availabilityId: selectedAvailability.id,
      selectedDate: selectedDateStr,
      selectedTime: selectedStartTime,
    });

    // Reset form after submission
    setTimeout(() => {
      setServiceType(null);
      setSelectedDate(null);
      setAvailableWorkersForDate([]);
      setSelectedAvailability(null);
      setSelectedStartTime("");
      submittingRef.current = false;
      loadAvailableDates(); // Reload to update available dates
    }, 100);
  };

  return (
    <div className="bg-white rounded p-3 shadow-sm patient-calendar-form">
      <h2 className="h4 text-primary fw-bold mb-3">Create Service Request</h2>

      <Form onSubmit={handleSubmit}>
        {/* Service Type Selection */}
        <div className="mb-3">
          <label className="form-label fw-semibold">Select Service Type</label>
          <div className="service-type-buttons">
            <button
              type="button"
              className={`service-type-btn ${
                serviceType === "Medical Care" ? "active" : ""
              }`}
              onClick={() => setServiceType("Medical Care")}
              disabled={loading}
            >
              <i className="bi bi-heart-pulse"></i>
              <span>Medical Care</span>
            </button>

            <button
              type="button"
              className={`service-type-btn ${
                serviceType === "Medication Delivery" ? "active" : ""
              }`}
              onClick={() => setServiceType("Medication Delivery")}
              disabled={loading}
            >
              <i className="bi bi-capsule"></i>
              <span>Medication Delivery</span>
            </button>

            <button
              type="button"
              className={`service-type-btn ${
                serviceType === "Companionship" ? "active" : ""
              }`}
              onClick={() => setServiceType("Companionship")}
              disabled={loading}
            >
              <i className="bi bi-people"></i>
              <span>Companionship</span>
            </button>

            <button
              type="button"
              className={`service-type-btn ${
                serviceType === "Personal Care" ? "active" : ""
              }`}
              onClick={() => setServiceType("Personal Care")}
              disabled={loading}
            >
              <i className="bi bi-person-heart"></i>
              <span>Personal Care</span>
            </button>
          </div>
        </div>

        {/* Date Selection */}
        <div>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              <i className="bi bi-exclamation-circle"></i> {error}
            </Alert>
          )}

          <label className="form-label mb-3">Select Date</label>

          <Form.Select
            value={selectedDate ? formatDateToLocalString(selectedDate) : ""}
            onChange={(e) => {
              if (e.target.value) {
                handleDateSelect(e.target.value);
              } else {
                // Clear selection
                setSelectedDate(null);
                setAvailableWorkersForDate([]);
                setSelectedAvailability(null);
                setSelectedStartTime("");
              }
            }}
            className="form-select"
            disabled={loadingDates}
            required
          >
            <option value="">
              {loadingDates
                ? "Loading available dates..."
                : "Choose an available date..."}
            </option>
            {availableDatesForSelect.map((date) => {
              const dateStr = formatDateToLocalString(date);
              const dayName = date.toLocaleDateString("en-US", {
                weekday: "long",
              });
              const formattedDate = date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              });
              return (
                <option key={dateStr} value={dateStr}>
                  {dayName}, {formattedDate}
                </option>
              );
            })}
          </Form.Select>

          {availableDatesForSelect.length === 0 && !loadingDates && (
            <div className="mt-2 small text-muted">
              No available dates found for the next 20 days. Please try again
              later.
            </div>
          )}
        </div>

        {/* Worker Selection - Show when multiple workers available */}
        {selectedDate && availableWorkersForDate.length > 1 && (
          <div className="mt-3">
            <label className="form-label fw-semibold">
              Select Healthcare Worker:{" "}
            </label>
            <Form.Select
              value={selectedAvailability?.id || ""}
              onChange={(e) => {
                const selectedId = parseInt(e.target.value);
                const selectedWorker = availableWorkersForDate.find(
                  (availability) => availability.id === selectedId
                );
                if (selectedWorker) {
                  handleWorkerSelect(selectedWorker);
                }
              }}
              className="form-control"
              required
            >
              <option value="">Choose a healthcare worker...</option>
              {availableWorkersForDate.map((availability) => (
                <option key={availability.id} value={availability.id}>
                  {availability.healthcareWorkerName || "Worker"}
                  {availability.healthcareWorkerPosition &&
                    ` - ${availability.healthcareWorkerPosition}`}
                  {availability.startTime &&
                    availability.endTime &&
                    ` (${availability.startTime.substring(
                      0,
                      5
                    )} - ${availability.endTime.substring(0, 5)})`}
                </option>
              ))}
            </Form.Select>
          </div>
        )}

        {/* Show worker name and position when only one worker is available */}
        {selectedDate && availableWorkersForDate.length == 1 && (
          <div className="mt-3">
            <label className="form-label fw-semibold">
              Worker: {availableWorkersForDate[0].healthcareWorkerName}
              {availableWorkersForDate[0].healthcareWorkerPosition &&
                ` (${availableWorkersForDate[0].healthcareWorkerPosition})`}
            </label>
          </div>
        )}
        {/* Time Selection - Show when date is selected and worker is chosen */}
        {selectedAvailability && (
          <div className="mt-3">
            <label className="form-label fw-semibold">Select Time :</label>

            <div className="d-flex gap-3 align-items-center">
              <div className="flex-fill">
                <Form.Select
                  id="startTime"
                  value={selectedStartTime}
                  onChange={(e) => {
                    setSelectedStartTime(e.target.value);
                  }}
                  disabled={loading || !selectedAvailability}
                  required
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex gap-3 mt-4">
          <Button
            type="submit"
            variant="primary"
            className="flex-fill"
            disabled={loading || loadingDates || submittingRef.current}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Submitting...
              </>
            ) : (
              "Add to Request List"
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-fill"
            onClick={() => {
              setServiceType(null);
              setSelectedDate(null);
              setAvailableWorkersForDate([]);
              setSelectedAvailability(null);
              setSelectedStartTime("");
              setError("");
              onCancel();
            }}
            disabled={loading || loadingDates}
          >
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default PatientCalendarForm;
