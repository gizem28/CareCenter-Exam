// Importing necessary stuff for the availability form
// React for component, types for the data, and calendar component
import React, { useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import type { AvailabilityDTO } from "../../api/availabilities";
import UnifiedCalendar from "../shared/UnifiedCalendar";

// Props interface for the availability form modal
// This defines all the data and functions the component needs
// Some props have weird names but they work
interface AvailabilityFormModalProps {
  isOpen: boolean; // if modal is showing
  editingAvailability: AvailabilityDTO | null; // when editing existing availability
  availabilityMode: "single" | "range" | "weekly"; // different modes for adding availability
  singleDate: string; // date for single mode
  startDate: string; // start date for range mode
  endDate: string; // end date for range mode
  selectedDays: number[]; // which days are selected for weekly mode
  startTime: string; // begining time
  endTime: string; // ending time
  skipWeekends: boolean; // option to skip weekend days
  existingAvailabilities?: AvailabilityDTO[]; // existing availabilities to show on calendar
  errorMessage?: string; // error message to display in modal
  hasValidationErrors?: boolean; // whether the form has validation errors
  onSetErrorMessage?: (message: string) => void; // function to set error message
  onClose: () => void; // function to close the modal
  onModeChange: (mode: "single" | "range" | "weekly") => void; // change mode
  onSingleDateChange: (date: string) => void; // update single date
  onStartDateChange: (date: string) => void; // update start date
  onEndDateChange: (date: string) => void; // update end date
  onDayToggle: (day: number) => void; // toggle day selection
  onStartTimeChange: (time: string) => void; // change start time
  onEndTimeChange: (time: string) => void; // change end time
  onSkipWeekendsChange: (skip: boolean) => void; // toggle weekend skip
  onSubmit: (e: React.FormEvent) => void; // submit the form
}

// Main component for the availability form modal
// This handles adding and editing healthcare worker availability
// The props are destructured here which is a React pattern
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
  // Don't render anything if modal is not open - performance optimization
  if (!isOpen) return null;

  // Helper function to check if date is within 30 days from today
  const isWithin30Days = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0); // Reset time to start of day
    return checkDate >= today && checkDate <= maxDate;
  };

  // Day names for the weekly selection - short form for space
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Validate dates whenever they change (only for date validation errors, not backend errors)
  useEffect(() => {
    if (!onSetErrorMessage) return;

    // Only validate if there's no existing error message (to avoid clearing backend errors)
    // We'll check if current error is a date validation error
    const isDateValidationError = errorMessage?.includes("30 days from today");

    if (availabilityMode === "single" && singleDate) {
      const date = new Date(singleDate);
      if (!isWithin30Days(date)) {
        onSetErrorMessage(
          "Availability can only be added up to 30 days from today."
        );
      } else if (isDateValidationError) {
        // Only clear if it was a date validation error
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
        // Only clear if it was a date validation error
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
        // Only clear if it was a date validation error
        onSetErrorMessage("");
      }
    } else if (isDateValidationError) {
      // Clear error if no dates selected and it was a date validation error
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

  // Main modal structure using Bootstrap Modal
  return (
    <Modal show={isOpen} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h6">
          {editingAvailability ? "Edit Availability" : "Add Availability"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* Error message display */}
        {errorMessage && (
          <Alert variant="danger" className="mb-2 small py-2">
            {errorMessage}
          </Alert>
        )}
        {/* Main form for availability input */}
        {/* Submit event is handled by the onSubmit prop from parent */}
        <Form id="availability-form" onSubmit={onSubmit}>
          {/* Only show mode selection when adding new, not editing */}
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
                    // Validate date is within 30 days
                    if (!isWithin30Days(date)) {
                      onSetErrorMessage?.(
                        "Availability can only be added up to 30 days from today."
                      );
                      return;
                    }
                    // Clear any previous error message
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
                        // Validate both dates are within 30 days
                        if (
                          !isWithin30Days(value[0]) ||
                          !isWithin30Days(value[1])
                        ) {
                          onSetErrorMessage?.(
                            "Availability can only be added up to 30 days from today."
                          );
                          return;
                        }
                        // Clear any previous error message
                        onSetErrorMessage?.("");
                        // React-calendar returns exact inclusive dates [start, end]
                        const startDateStr = formatDate(value[0]);
                        const endDateStr = formatDate(value[1]);
                        onStartDateChange(startDateStr);
                        onEndDateChange(endDateStr);
                      } else if (value instanceof Date) {
                        // Validate date is within 30 days
                        if (!isWithin30Days(value)) {
                          onSetErrorMessage?.(
                            "Availability can only be added up to 30 days from today."
                          );
                          return;
                        }
                        // Clear any previous error message
                        onSetErrorMessage?.("");
                        // Handle single date selection (if user clicks instead of dragging)
                        const dateStr = formatDate(value);
                        if (!startDate || (startDate && endDate)) {
                          // Start new range if no start date or both dates are already set
                          onStartDateChange(dateStr);
                          onEndDateChange("");
                        } else if (startDate && !endDate) {
                          // Set end date if start date exists but no end date
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

          {/* Time selection section - optional start and end times */}
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

          {/* Action buttons at bottom of form */}
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

// Export the component so it can be imported elsewhere
export default AvailabilityFormModal;
