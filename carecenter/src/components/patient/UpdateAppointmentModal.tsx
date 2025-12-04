import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import type { AppointmentDTO } from "../../api/appointments";
import {
  availabilityRequests,
  type AvailabilityDTO,
} from "../../api/availabilities";
import type { ServiceType } from "./ServiceRequestForm";

interface UpdateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    availabilityId: number,
    serviceType?: ServiceType,
    selectedStartTime?: string
  ) => Promise<void>;
  appointment: AppointmentDTO | null;
  loading?: boolean;
}

const UpdateAppointmentModal: React.FC<UpdateAppointmentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  loading = false,
}) => {
  const [availableDates, setAvailableDates] = useState<AvailabilityDTO[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAvailability, setSelectedAvailability] =
    useState<AvailabilityDTO | null>(null);
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedServiceType, setSelectedServiceType] =
    useState<ServiceType | null>(null);
  const [loadingDates, setLoadingDates] = useState(false);
  const [error, setError] = useState<string>("");
  const [availableWorkersForDate, setAvailableWorkersForDate] = useState<
    AvailabilityDTO[]
  >([]);
  const today = new Date();

  const serviceTypes: ServiceType[] = [
    "Medical Care",
    "Medication Delivery",
    "Companionship",
    "Personal Care",
  ];

  const unbookedAvailabilities = useMemo(() => {
    const currentAvailabilityId = appointment?.availabilityId;

    return availableDates.filter((a) => {
      if (currentAvailabilityId && a.id === currentAvailabilityId) {
        return true;
      }
      return true;
    });
  }, [availableDates, appointment]);

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

  const getTimeSlots = (): string[] => {
    if (!selectedAvailability) {
      return Array.from({ length: 11 }, (_, i) => {
        const hour = 8 + i;
        return `${hour.toString().padStart(2, "0")}:00`;
      });
    }

    const startTime = parseTimeSpan(selectedAvailability.startTime);
    const endTime = parseTimeSpan(selectedAvailability.endTime);

    if (!startTime || !endTime) {
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

  const formatDateToLocalString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const next20Days = useMemo(() => {
    const dates: Date[] = [];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);

    for (let i = 0; i < 20; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [today]);

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

  const handleDateSelect = (dateStr: string) => {
    setError("");

    const availabilitiesForDate = unbookedAvailabilities.filter((a) => {
      if (!a.date) return false;
      const availabilityDateStr = a.date.split("T")[0];
      return availabilityDateStr === dateStr;
    });

    if (availabilitiesForDate.length > 0) {
      const selectedDateObj = new Date(dateStr);
      setSelectedDate(selectedDateObj);
      setAvailableWorkersForDate(availabilitiesForDate);
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

  useEffect(() => {
    if (isOpen) {
      loadAvailableDates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && appointment) {
      if (appointment.serviceType) {
        const serviceType = serviceTypes.find(
          (st) =>
            st === appointment.serviceType ||
            st.toLowerCase() === appointment.serviceType?.toLowerCase()
        );
        if (serviceType) {
          setSelectedServiceType(serviceType);
        }
      }

      if (appointment.availability?.date) {
        const aptDate = new Date(appointment.availability.date);
        if (!isNaN(aptDate.getTime())) {
          setSelectedDate(aptDate);

          const startTime =
            appointment.selectedStartTime ||
            (appointment as any).SelectedStartTime ||
            appointment.availability?.startTime;

          if (startTime) {
            const parts = startTime.split(":");
            if (parts.length >= 2) {
              setSelectedStartTime(`${parts[0]}:${parts[1]}`);
            }
          }

          if (availableDates.length > 0) {
            const dateStr = formatDateToLocalString(aptDate);
            const availabilitiesForDate = availableDates.filter((a) => {
              if (!a.date) return false;
              const availabilityDateStr = a.date.split("T")[0];
              return availabilityDateStr === dateStr;
            });
            setAvailableWorkersForDate(availabilitiesForDate);

            if (availabilitiesForDate.length > 0) {
              if (appointment.availabilityId) {
                const currentAvailability = availabilitiesForDate.find(
                  (a) => a.id === appointment.availabilityId
                );
                if (currentAvailability) {
                  setSelectedAvailability(currentAvailability);
                } else {
                  setSelectedAvailability(availabilitiesForDate[0]);
                }
              } else {
                setSelectedAvailability(availabilitiesForDate[0]);
              }
            }
          }
        }
      }
    } else if (isOpen) {
      setSelectedDate(null);
      setSelectedAvailability(null);
      setSelectedStartTime("");
      setSelectedServiceType(null);
      setAvailableWorkersForDate([]);
    }
  }, [isOpen, appointment]);

  useEffect(() => {
    if (
      isOpen &&
      appointment &&
      availableDates.length > 0 &&
      selectedDate &&
      !selectedAvailability
    ) {
      const dateStr = formatDateToLocalString(selectedDate);
      const availabilitiesForDate = availableDates.filter((a) => {
        if (!a.date) return false;
        const availabilityDateStr = a.date.split("T")[0];
        return availabilityDateStr === dateStr;
      });

      if (availabilitiesForDate.length > 0) {
        setAvailableWorkersForDate(availabilitiesForDate);
        if (availabilitiesForDate.length === 1) {
          setSelectedAvailability(availabilitiesForDate[0]);
        } else if (appointment.availabilityId) {
          const currentAvailability = availabilitiesForDate.find(
            (a) => a.id === appointment.availabilityId
          );
          if (currentAvailability) {
            setSelectedAvailability(currentAvailability);
          } else {
            setSelectedAvailability(availabilitiesForDate[0]);
          }
        } else {
          setSelectedAvailability(availabilitiesForDate[0]);
        }
      }
    }
  }, [isOpen, appointment, availableDates, selectedAvailability, selectedDate]);

  const loadAvailableDates = async () => {
    try {
      setLoadingDates(true);
      setError("");
      const dates = await availabilityRequests.getUnbooked();

      if (appointment?.availabilityId) {
        try {
          const allAvailabilities = await availabilityRequests.getAll();
          const currentAvailability = allAvailabilities.find(
            (a: any) => a.id === appointment.availabilityId
          );

          if (currentAvailability) {
            const exists = dates.some((d) => d.id === currentAvailability.id);
            if (!exists) {
              setAvailableDates([...dates, currentAvailability]);
              return;
            }
          }
        } catch (err) {
        }
      }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedServiceType) {
      setError("Please select a service type.");
      return;
    }

    let availabilityIdToUse: number;
    if (selectedAvailability) {
      availabilityIdToUse = selectedAvailability.id;
    } else if (appointment?.availabilityId) {
      availabilityIdToUse = appointment.availabilityId;
    } else {
      setError(
        "Please select a date from the calendar or keep the current appointment."
      );
      return;
    }

    if (selectedAvailability && !selectedStartTime) {
      setError("Please select a time when changing the date.");
      return;
    }

    try {
      let selectedStartTimeFormatted: string | undefined;

      if (selectedStartTime) {
        const startParts = selectedStartTime.split(":");
        if (startParts.length === 2) {
          selectedStartTimeFormatted = `${startParts[0]}:${startParts[1]}:00`;
        }
      }

      await onConfirm(
        availabilityIdToUse,
        selectedServiceType,
        selectedStartTimeFormatted
      );
      setSelectedDate(null);
      setSelectedAvailability(null);
      setSelectedStartTime("");
      setSelectedServiceType(null);
      setAvailableWorkersForDate([]);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update appointment. Please try again."
      );
    } finally {
      setLoadingDates(false);
    }
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedAvailability(null);
    setSelectedStartTime("");
    setSelectedServiceType(null);
    setAvailableWorkersForDate([]);
    setError("");
    onClose();
  };

  return (
    <Modal
      show={isOpen}
      onHide={handleClose}
      centered
      className="update-appointment-modal"
    >
      <Modal.Header className="modal-header-teal">
        <Modal.Title>
          <i className="bi bi-pencil-square me-2"></i>
          Update Appointment
        </Modal.Title>
        <button
          type="button"
          className="modal-close-btn"
          onClick={handleClose}
          aria-label="Close"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="p-3 overflow-auto">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              <i className="bi bi-exclamation-circle"></i> {error}
            </Alert>
          )}

          <div className="service-type-section mb-4">
            <label className="form-label fw-semibold">
              Select Service Type
            </label>
            <div className="service-type-buttons">
              <button
                type="button"
                className={`service-type-btn ${
                  selectedServiceType === "Medical Care" ? "active" : ""
                }`}
                onClick={() => setSelectedServiceType("Medical Care")}
                disabled={loading}
              >
                <i className="bi bi-heart-pulse"></i>
                <span>Medical Care</span>
              </button>

              <button
                type="button"
                className={`service-type-btn ${
                  selectedServiceType === "Medication Delivery" ? "active" : ""
                }`}
                onClick={() => setSelectedServiceType("Medication Delivery")}
                disabled={loading}
              >
                <i className="bi bi-capsule"></i>
                <span>Medication Delivery</span>
              </button>

              <button
                type="button"
                className={`service-type-btn ${
                  selectedServiceType === "Companionship" ? "active" : ""
                }`}
                onClick={() => setSelectedServiceType("Companionship")}
                disabled={loading}
              >
                <i className="bi bi-people"></i>
                <span>Companionship</span>
              </button>

              <button
                type="button"
                className={`service-type-btn ${
                  selectedServiceType === "Personal Care" ? "active" : ""
                }`}
                onClick={() => setSelectedServiceType("Personal Care")}
                disabled={loading}
              >
                <i className="bi bi-person-heart"></i>
                <span>Personal Care</span>
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold mb-3">
              Select New Date
            </label>
            <Form.Select
              value={selectedDate ? formatDateToLocalString(selectedDate) : ""}
              onChange={(e) => {
              if (e.target.value) {
                handleDateSelect(e.target.value);
              } else {
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

          {selectedDate && availableWorkersForDate.length > 1 && (
            <div className="mb-3">
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

          {selectedDate && availableWorkersForDate.length === 1 && (
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Worker: {availableWorkersForDate[0].healthcareWorkerName}
                {availableWorkersForDate[0].healthcareWorkerPosition &&
                  ` (${availableWorkersForDate[0].healthcareWorkerPosition})`}
              </label>
            </div>
          )}

          {selectedAvailability && (
            <div className="time-selection-section mb-4">
              <div className="row g-3">
                <div className="col-md-12">
                  <Form.Label htmlFor="startTime">Time</Form.Label>
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
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="btn-light-teal"
            type="submit"
            disabled={
              loading ||
              loadingDates ||
              !selectedAvailability ||
              !selectedStartTime ||
              !selectedServiceType
            }
          >
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              "Update Appointment"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default UpdateAppointmentModal;
