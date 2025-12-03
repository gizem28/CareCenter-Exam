import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import {
  availabilityRequests,
  type AvailabilityDTO,
} from "../../api/availabilities";
import {
  appointmentRequests,
  type AppointmentDTO,
} from "../../api/appointments";
import UnifiedCalendar from "../shared/UnifiedCalendar";

interface AdminCalendarViewProps {
  onDateClick?: (date: Date) => void;
}

const AdminCalendarView: React.FC<AdminCalendarViewProps> = ({
  onDateClick,
}) => {
  const [availabilities, setAvailabilities] = useState<AvailabilityDTO[]>([]);
  const [approvedAppointments, setApprovedAppointments] = useState<
    AppointmentDTO[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [availabilitiesData, appointmentsData] = await Promise.all([
        availabilityRequests.getUnbooked(),
        appointmentRequests.getAll(),
      ]);

      setAvailabilities(availabilitiesData || []);

      const approved = (appointmentsData || []).filter(
        (apt: any) =>
          (apt.status || apt.Status || "").toLowerCase() === "approved"
      );
      setApprovedAppointments(approved);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load calendar data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (
    loading &&
    availabilities.length === 0 &&
    approvedAppointments.length === 0
  ) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <Spinner animation="border" className="text-teal" />
        <p>Loading calendar...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div
          style={{
            color: "#dc2626",
            fontSize: "0.875rem",
            textAlign: "center",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}
      <UnifiedCalendar
        availabilities={availabilities}
        appointments={approvedAppointments}
        onDateClick={onDateClick}
        showApproved={true}
        showRefreshButton={true}
        onRefresh={loadData}
        loading={loading}
      />
    </>
  );
};

export default AdminCalendarView;
