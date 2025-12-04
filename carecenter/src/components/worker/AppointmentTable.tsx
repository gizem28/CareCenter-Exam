// tabell for å vise avtaler til helsearbeider
import React, { useState, useEffect } from "react";
import { Table, Badge, Button } from "react-bootstrap";
import type { AppointmentDTO } from "../../api/appointments";
import { patientRequests } from "../../api/patients";

interface AppointmentTableProps {
  appointments: AppointmentDTO[];
  onView: (appointment: AppointmentDTO) => void;
  formatDate: (dateString?: string | null) => string;
  formatTime: (timeString?: string | null) => string;
}

const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments,
  onView,
  formatDate,
  formatTime,
}) => {
  const [patientNames, setPatientNames] = useState<Record<number, string>>({});
  const [loadingPatients, setLoadingPatients] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    const fetchPatientNames = async () => {
      const uniquePatientIds = [
        ...new Set(
          appointments
            .map((apt) => apt.patientId)
            .filter((id): id is number => id !== undefined && id !== null)
        ),
      ];

      const patientIdsToFetch = uniquePatientIds.filter(
        (id) => !patientNames[id] && !loadingPatients.has(id)
      );

      if (patientIdsToFetch.length === 0) return;

      setLoadingPatients((prev) => {
        const newSet = new Set(prev);
        patientIdsToFetch.forEach((id) => newSet.add(id));
        return newSet;
      });

      try {
        const patientPromises = patientIdsToFetch.map(async (patientId) => {
          try {
            const patient = await patientRequests.getById(patientId);
            return { id: patientId, name: patient.fullName };
          } catch (error) {
            return { id: patientId, name: `Patient #${patientId}` };
          }
        });

        const results = await Promise.all(patientPromises);
        const newPatientNames: Record<number, string> = {};
        results.forEach(({ id, name }) => {
          newPatientNames[id] = name;
        });

        setPatientNames((prev) => ({ ...prev, ...newPatientNames }));
      } catch (error) {
        // feilet å hente pasient navn
      } finally {
        setLoadingPatients((prev) => {
          const newSet = new Set(prev);
          patientIdsToFetch.forEach((id) => newSet.delete(id));
          return newSet;
        });
      }
    };

    fetchPatientNames();
  }, [appointments, patientNames, loadingPatients]);

  const getStatusBadge = (status: string | undefined) => {
    const statusLower = (status || "Pending").toLowerCase();
    if (statusLower === "approved") return "success";
    if (statusLower === "pending") return "warning";
    if (statusLower === "rejected") return "danger";
    if (statusLower === "cancelled" || statusLower === "completed")
      return "secondary";
    return "info";
  };

  const getPatientName = (patientId: number | undefined): string => {
    if (!patientId) return "N/A";
    if (patientNames[patientId]) return patientNames[patientId];
    if (loadingPatients.has(patientId)) return "Loading...";
    return `Patient #${patientId}`;
  };

  return (
    <div className="table-responsive">
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Patient Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments
            .sort(
              (a, b) =>
                new Date(b.date || 0).getTime() -
                new Date(a.date || 0).getTime()
            )
            .map((appointment) => (
              <tr key={appointment.id}>
                <td>{formatDate(appointment.date)}</td>
                <td>{formatTime(appointment.appointmentTime)}</td>
                <td>
                  <Badge bg={getStatusBadge(appointment.status)}>
                    {appointment.status || "Pending"}
                  </Badge>
                </td>
                <td>{getPatientName(appointment.patientId)}</td>
                <td>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onView(appointment)}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
        </tbody>
      </Table>
    </div>
  );
};

export default AppointmentTable;
