import React, { useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { Button } from "react-bootstrap";
import "../../css/UnifiedCalendar.css";
import type { AvailabilityDTO } from "../../api/availabilities";
import type { AppointmentDTO } from "../../api/appointments";

// Shared calendar component used across the application
export interface LegendItem {
  label: string;
  color: string;
  textColor?: string;
}

interface UnifiedCalendarProps {
  availabilities?: AvailabilityDTO[];
  appointments?: AppointmentDTO[];
  selectedDate?: Date | null;
  onDateClick?: (date: Date) => void;
  onChange?: (value: any) => void;
  value?: any;
  showLegend?: boolean;
  legendItems?: LegendItem[];
  minDate?: Date;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
  title?: string;
  dotSize?: number;
  showBooked?: boolean;
  showApproved?: boolean;
  className?: string;
  showNeighboringMonth?: boolean;
  defaultView?: "month" | "year" | "decade" | "century";
  selectRange?: boolean;
}

const UnifiedCalendar: React.FC<UnifiedCalendarProps> = ({
  availabilities = [],
  appointments = [],
  selectedDate,
  onDateClick,
  onChange,
  value,
  showLegend = true,
  legendItems,
  minDate,
  showRefreshButton = false,
  onRefresh,
  loading = false,
  title,
  dotSize = 8,
  showBooked = false,
  showApproved = false,
  className = "availability-calendar",
  showNeighboringMonth = false,
  defaultView = "month",
  selectRange = false,
}) => {
  const formatDateToLocalString = (date: Date): string => {
    // Create date string from local date components to avoid timezone conversion issues
    // Since availability dates are stored as date-only (not datetime), we want the date as the user sees it
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Calculate CSS classes for calendar tiles based on availability and appointments
  const tileClassName = useMemo(() => {
    return ({ date, view }: { date: Date; view: string }) => {
      if (view === "month") {
        const classes: string[] = [];
        const dateStr = formatDateToLocalString(date);

        // Check for appointments by status (priority)
        if (showApproved && appointments.length > 0) {
          const appointmentOnDate = appointments.find((apt) => {
            const aptDate = apt.date || apt.availability?.date;
            if (!aptDate) return false;
            // Use split to avoid timezone conversion issues
            const aptDateStr = String(aptDate).split("T")[0];
            return aptDateStr === dateStr;
          });

          if (appointmentOnDate) {
            const status = (appointmentOnDate.status || "").toLowerCase();
            if (status === "approved") {
              classes.push("approved-appointment-date");
              return classes.join(" ");
            } else if (status === "pending") {
              classes.push("pending-appointment-date");
              return classes.join(" ");
            }
          }
        }

        // Check for availabilities
        const availability = availabilities.find((a) => {
          if (!a.date) return false;
          const availabilityDateStr = a.date.split("T")[0];
          return availabilityDateStr === dateStr;
        });

        if (availability) {
          if (showBooked && availability.isBooked) {
            classes.push("booked-date");
          } else {
            classes.push("available-date");
          }
        }

        // Check if this is the selected date
        if (selectedDate) {
          const selectedDateNormalized = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
          );
          const currentDateNormalized = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          );
          if (
            selectedDateNormalized.getTime() === currentDateNormalized.getTime()
          ) {
            classes.push("selected-date");
          }
        }

        return classes.length > 0 ? classes.join(" ") : null;
      }
      return null;
    };
  }, [availabilities, appointments, selectedDate, showBooked, showApproved]);

  const tileContent = useMemo(() => {
    return ({ date, view }: { date: Date; view: string }) => {
      if (view === "month") {
        const dateStr = formatDateToLocalString(date);

        // Check for appointments by status (priority)
        if (showApproved && appointments.length > 0) {
          const appointmentOnDate = appointments.find((apt) => {
            const aptDate = apt.date || apt.availability?.date;
            if (!aptDate) return false;
            // Use split to avoid timezone conversion issues
            const aptDateStr = String(aptDate).split("T")[0];
            return aptDateStr === dateStr;
          });

          if (appointmentOnDate) {
            const status = (appointmentOnDate.status || "").toLowerCase();
            let color = "#3b82f6"; // Default blue for approved
            if (status === "approved") {
              color = "#3b82f6"; // Blue for approved
            } else if (status === "pending") {
              color = "#f59e0b"; // Orange/yellow for pending
            }

            return (
              <div
                style={{
                  width: `${dotSize}px`,
                  height: `${dotSize}px`,
                  borderRadius: "50%",
                  backgroundColor: color,
                  margin: "2px auto 0",
                }}
              />
            );
          }
        }

        // Check for availabilities
        const availability = availabilities.find((a) => {
          if (!a.date) return false;
          const availabilityDateStr = a.date.split("T")[0];
          return availabilityDateStr === dateStr;
        });

        if (availability) {
          const color =
            showBooked && availability.isBooked ? "#f59e0b" : "#10b981";
          return (
            <div
              style={{
                width: `${dotSize}px`,
                height: `${dotSize}px`,
                borderRadius: "50%",
                backgroundColor: color,
                margin: "2px auto 0",
              }}
            />
          );
        }
      }
      return null;
    };
  }, [availabilities, appointments, dotSize, showBooked, showApproved]);

  const calendarKey = useMemo(() => {
    const availKey = availabilities
      .map((a) => `${a.id}-${a.date}-${a.isBooked}`)
      .join(",");
    const aptKey = appointments.map((a) => `${a.id}-${a.date}`).join(",");
    return `${availKey}-${aptKey}`;
  }, [availabilities, appointments]);

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const handleChange = (val: any) => {
    if (onChange) {
      onChange(val);
    }
    // Also trigger onDateClick if it's a single date
    if (val instanceof Date && onDateClick) {
      onDateClick(val);
    }
  };

  const defaultLegendItems: LegendItem[] = useMemo(() => {
    const items: LegendItem[] = [];
    if (availabilities.length > 0) {
      items.push({
        label: "Available",
        color: "#10b981",
        textColor: "#065f46",
      });
    }
    if (showApproved && appointments.length > 0) {
      // Check if there are any approved appointments
      const hasApproved = appointments.some(
        (apt) => (apt.status || "").toLowerCase() === "approved"
      );
      // Check if there are any pending appointments
      const hasPending = appointments.some(
        (apt) => (apt.status || "").toLowerCase() === "pending"
      );

      if (hasApproved) {
        items.push({
          label: "Approved",
          color: "#3b82f6",
          textColor: "#1e40af",
        });
      }
      if (hasPending) {
        items.push({
          label: "Pending",
          color: "#f59e0b",
          textColor: "#92400e",
        });
      }
    }
    return items;
  }, [availabilities, showApproved, appointments]);

  const displayLegendItems = legendItems || defaultLegendItems;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      {(title || showRefreshButton) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            maxWidth: "450px",
          }}
        >
          {title && <h5 style={{ margin: 0, color: "#1f2937" }}>{title}</h5>}
        </div>
      )}

      <div
        style={{
          background: "linear-gradient(to bottom, #ffffff, #f8fafc)",
          padding: "0.5rem",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
          border: "1px solid #e2e8f0",
          width: "100%",
          maxWidth: "450px",
        }}
      >
        <Calendar
          key={calendarKey}
          tileClassName={tileClassName}
          tileContent={tileContent}
          onClickDay={handleDateClick}
          onChange={handleChange}
          value={value !== undefined ? value : selectedDate || undefined}
          className={className}
          minDate={minDate}
          showNeighboringMonth={showNeighboringMonth}
          defaultView={defaultView}
          selectRange={selectRange}
        />
      </div>

      {showLegend && displayLegendItems.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "2.5rem",
            alignItems: "center",
            fontSize: "0.875rem",
            padding: "0.5rem 1rem",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "2.5rem",
              alignItems: "center",
            }}
          >
            {displayLegendItems.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    backgroundColor: item.color,
                  }}
                />
                <span
                  style={{
                    fontWeight: 500,
                    color: item.textColor || "#1f2937",
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
          {showRefreshButton && onRefresh && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh calendar"
            >
              <i className="bi bi-arrow-clockwise"></i>{" "}
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedCalendar;
