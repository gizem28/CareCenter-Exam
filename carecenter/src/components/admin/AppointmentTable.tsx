import React from "react";
import type { AppointmentDTO } from "../../api/appointments";

interface AppointmentTableProps {
  appointments: AppointmentDTO[];
  onView: (appointment: AppointmentDTO) => void;
  formatDate: (dateString: string | undefined) => string;
  getServiceType: (appointment: any) => string;
}

const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments,
  onView,
  formatDate,
  getServiceType,
}) => {
  const getStatusBadge = (status: string | undefined) => {
    const statusLower = (status || "Pending").toLowerCase();
    if (statusLower === "approved") return "bg-success";
    if (statusLower === "pending") return "bg-warning";
    if (statusLower === "rejected") return "bg-danger";
    if (statusLower === "completed") return "bg-success";
    if (statusLower === "cancelled") return "bg-secondary";
    return "bg-info";
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header bg-light">
        <h6 className="mb-0 text-primary">
          <i className="bi bi-calendar-event"></i> Recent Appointments
        </h6>
      </div>
      <div className="card-body">
        {appointments.length === 0 ? (
          <div className="text-center py-3">
            <p className="text-muted mb-0">No appointments available.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-bordered table-striped table-hover">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Patient</th>
                    <th>Worker</th>
                    <th>Date</th>
                    <th>Service Type</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.slice(0, 10).map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.id}</td>
                      <td>
                        <strong>
                          {appointment.patientName ||
                            `Patient #${appointment.patientId}`}
                        </strong>
                      </td>
                      <td>
                        {appointment.workerName ||
                          `Worker #${appointment.workerId}`}
                      </td>
                      <td>
                        {formatDate(
                          appointment.appointmentDate || appointment.date
                        )}
                      </td>
                      <td>
                        <span className="badge bg-info">
                          {getServiceType(appointment)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${getStatusBadge(
                            appointment.status
                          )}`}
                        >
                          {appointment.status || "Pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-info"
                          onClick={() => onView(appointment)}
                          title="View details"
                        >
                          <i className="bi bi-eye"></i> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {appointments.length > 10 && (
              <div className="text-center mt-3">
                <p className="text-muted">
                  Showing 10 of {appointments.length} appointments
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentTable;
