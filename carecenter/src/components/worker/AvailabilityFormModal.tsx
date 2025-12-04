import React, { useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import type { AvailabilityDTO } from "../../api/availabilities";
import UnifiedCalendar from "../shared/UnifiedCalendar";

// modal for worker to add or edit availability
// brukes når helsearbeider skal legge til ledige tider
interface AvailabilityFormModalProps {
  isOpen: boolean;
  editingAvailability: AvailabilityDTO | null;
  availabilityMode: "single" | "range" | "weekly";
  singleDate: string;
  startDate: string;
  endDate: string;
  selectedDays: number[];
  startTime: string;
  endTime: string;
  skipWeekends: boolean;
  existingAvailabilities?: AvailabilityDTO[];
  errorMessage?: string;
  hasValidationErrors?: boolean;
  onSetErrorMessage?: (message: string) => void;
  onClose: () => void;
  onModeChange: (mode: "single" | "range" | "weekly") => void;
  onSingleDateChange: (date: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onDayToggle: (day: number) => void;
  onStartTimeChange: (time: string) => void;
  onEndTimeChange: (time: string) => void;
  onSkipWeekendsChange: (skip: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AvailabilityFormModal: React.FC<AvailabilityFormModalProps> = ({
  isOpen,
  editingAvailability,
  availabilityMode,
  singleDate,
  startDate,
  endDate,
  selectedDays,
  startTime,
  endTime,
  skipWeekends,
  existingAvailabilities = [],
  errorMessage,
  hasValidationErrors = false,
  onSetErrorMessage,
  onClose,
  onModeChange,
  onSingleDateChange,
  onStartDateChange,
  onEndDateChange,
  onDayToggle,
  onStartTimeChange,
  onEndTimeChange,
  onSkipWeekendsChange,
  onSubmit,
}) => {
  // dont show if closed
  if (!isOpen) return null;

  // sjekk om dato er innen 30 dager
  const isWithin30Days = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0); // Reset time to start of day
    return checkDate >= today && checkDate <= maxDate;
  };

  // dag navn for ukentlig valg
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // validerer datoer når de endres
  useEffect(() => {
    if (!onSetErrorMessage) return;

    // bare valider hvis ingen feilmelding allerede
    const isDateValidationError = errorMessage?.includes("30 days from today");

    if (availabilityMode === "single" && singleDate) {
      const date = new Date(singleDate);
      if (!isWithin30Days(date)) {
        onSetErrorMessage(
          "Availability can only be added up to 30 days from today."
        );
      } else if (isDateValidationError) {
        onSetErrorMessage("");
      }
    } else if (availabilityMode === "range" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isWithin30Days(start) || !isWithin30Days(end)) {
        onSetErrorMessage(
          "Availability can only be added up to 30 days from today."
        );
      } else if (isDateValidationError) {
        onSetErrorMessage("");
      }
    } else if (availabilityMode === "weekly" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!isWithin30Days(start) || !isWithin30Days(end)) {
        onSetErrorMessage(
          "Availability can only be added up to 30 days from today."
        );
      } else if (isDateValidationError) {
        onSetErrorMessage("");
      }
    } else if (isDateValidationError) {
      onSetErrorMessage("");
    }
  }, [
    singleDate,
    startDate,
    endDate,
    availabilityMode,
    onSetErrorMessage,
    errorMessage,
  ]);

  // bootstrap modal for å vise form
  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6">
          {editingAvailability ? "Edit Availability" : "Add Availability"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* feilmelding hvis noe gikk galt */}
        {errorMessage && (
          <Alert variant="danger" className="mb-2 small py-2">
            {errorMessage}
          </Alert>
        )}
        {/* form for availability input */}
        <Form id="availability-form" onSubmit={onSubmit}>
          {/* vis modus valg bare når ny, ikke redigering */}
          {!editingAvailability && (
            <div className="mb-3">
              <label className="form-label small fw-semibold">
                Availability Type:
              </label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  name="availabilityMode"
                  id="mode-single"
                  label="Single Date"
                  value="single"
                  checked={availabilityMode === "single"}
                  onChange={(e) => onModeChange(e.target.value as any)}
                />
                <Form.Check
                  type="radio"
                  name="availabilityMode"
                  id="mode-range"
                  label="Date Range"
                  value="range"
                  checked={availabilityMode === "range"}
                  onChange={(e) => onModeChange(e.target.value as any)}
                />
                <Form.Check
                  type="radio"
                  name="availabilityMode"
                  id="mode-weekly"
                  label="Weekly (Specific Days)"
                  value="weekly"
                  checked={availabilityMode === "weekly"}
                  onChange={(e) => onModeChange(e.target.value as any)}
                />
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label small fw-semibold">
              {editingAvailability
                ? "Select Date:"
                : availabilityMode === "single"
                ? "Select Date:"
                : ""}
            </label>
            {editingAvailability || availabilityMode === "single" ? (
              <div className="calendar-container mb-2">
                <UnifiedCalendar
                  availabilities={existingAvailabilities}
                  onDateClick={(date) => {
                    // valider at dato er innen 30 dager
                    if (!isWithin30Days(date)) {
                      onSetErrorMessage?.(
                        "Availability can only be added up to 30 days from today."
                      );
                      return;
                    }
                    onSetErrorMessage?.("");
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, "0");
                    const day = String(date.getDate()).padStart(2, "0");
                    const dateStr = `${year}-${month}-${day}`;
                    onSingleDateChange(dateStr);
                  }}
                  selectedDate={singleDate ? new Date(singleDate) : null}
                  minDate={new Date()}
                  showBooked={true}
                  dotSize={6}
                  showLegend={true}
                  className="availability-calendar"
                />
                {singleDate && (
                  <div className="selected-date-display mt-2 small">
                    <strong>Selected Date:</strong>{" "}
                    {new Date(singleDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : (
              <div className="calendar-container mb-2">
                <div>
                  <UnifiedCalendar
                    availabilities={existingAvailabilities}
                    showBooked={true}
                    dotSize={6}
                    showLegend={true}
                    onChange={(value) => {
                      const formatDate = (date: Date) => {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(date.getDate()).padStart(2, "0");
                        return `${year}-${month}-${day}`;
                      };

                      if (Array.isArray(value) && value.length === 2) {
                        // begge datoer må være innen 30 dager
                        if (
                          !isWithin30Days(value[0]) ||
                          !isWithin30Days(value[1])
                        ) {
                          onSetErrorMessage?.(
                            "Availability can only be added up to 30 days from today."
                          );
                          return;
                        }
                        onSetErrorMessage?.("");
                        const startDateStr = formatDate(value[0]);
                        const endDateStr = formatDate(value[1]);
                        onStartDateChange(startDateStr);
                        onEndDateChange(endDateStr);
                      } else if (value instanceof Date) {
                        if (!isWithin30Days(value)) {
                          onSetErrorMessage?.(
                            "Availability can only be added up to 30 days from today."
                          );
                          return;
                        }
                        onSetErrorMessage?.("");
                        // håndter enkelt dato klikk
                        const dateStr = formatDate(value);
                        if (!startDate || (startDate && endDate)) {
                          onStartDateChange(dateStr);
                          onEndDateChange("");
                        } else if (startDate && !endDate) {
                          onEndDateChange(dateStr);
                        }
                      }
                    }}
                    value={
                      startDate && endDate
                        ? [
                            new Date(startDate).getTime() - 24 * 60 * 60 * 1000,
                            new Date(
                              new Date(endDate).getTime() + 24 * 60 * 60 * 1000
                            ),
                          ]
                        : startDate
                        ? [new Date(startDate)]
                        : null
                    }
                    minDate={new Date()}
                    className="availability-calendar"
                    title="To select a date range, click the start date and then the end date"
                    selectRange={true}
                  />
                  {startDate && endDate && (
                    <div className="selected-date-display mt-2 small">
                      <strong>Range:</strong>{" "}
                      {new Date(startDate).toLocaleDateString()} -{" "}
                      {new Date(endDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
            {availabilityMode === "weekly" && !editingAvailability && (
              <div className="day-selector mt-2">
                <label className="form-label small fw-semibold d-block mb-2">
                  Select Days of the Week:
                </label>
                <div className="d-flex gap-2 flex-wrap">
                  {dayNames.map((day, index) => (
                    <label
                      key={index}
                      className={selectedDays.includes(index) ? "selected" : ""}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDays.includes(index)}
                        onChange={() => onDayToggle(index)}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {availabilityMode === "range" && !editingAvailability && (
              <Form.Check
                type="checkbox"
                id="skip-weekends"
                label="Skip weekends (Saturday & Sunday)"
                checked={skipWeekends}
                onChange={(e) => onSkipWeekendsChange(e.target.checked)}
                className="mt-2 small"
              />
            )}
          </div>

          {/* tid valg - valgfritt */}
          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <Form.Label className="small fw-semibold">
                Start Time (optional):
              </Form.Label>
              <Form.Control
                type="time"
                value={startTime || "09:00"}
                onChange={(e) => onStartTimeChange(e.target.value)}
              />
            </div>
            <div className="col-md-6">
              <Form.Label className="small fw-semibold">
                End Time (optional):
              </Form.Label>
              <Form.Control
                type="time"
                value={endTime || "17:30"}
                onChange={(e) => onEndTimeChange(e.target.value)}
              />
            </div>
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} size="sm">
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          form="availability-form"
          disabled={hasValidationErrors}
          size="sm"
        >
          {editingAvailability ? "Update Availability" : "Add Availability"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AvailabilityFormModal;
