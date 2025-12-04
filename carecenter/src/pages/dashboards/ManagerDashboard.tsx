// admin dashboard - oversikt over alle pasienter, arbeidere og avtaler
// yönetici paneli - tüm hastalar, çalışanlar ve randevular
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { patientRequests } from "../../api/patients";
import { healthcareWorkerRequests } from "../../api/healthcareWorkers";
import { appointmentRequests } from "../../api/appointments";
import type { PatientDTO } from "../../api/patients";
import type { HealthcareWorkerDTO } from "../../api/healthcareWorkers";
import type { AppointmentDTO } from "../../api/appointments";
import AdminCalendarView from "../../components/admin/AdminCalendarView";
import StatsCards from "../../components/admin/StatsCards";
import PatientTable from "../../components/admin/PatientTable";
import WorkerTable from "../../components/admin/WorkerTable";
import AppointmentTable from "../../components/admin/AppointmentTable";
import PatientModal from "../../components/admin/PatientModal";
import WorkerModal from "../../components/admin/WorkerModal";
import AppointmentDetailsModal from "../../components/shared/AppointmentDetailsModal";

interface Dashboard {
  stats: {
    totalPatients: number;
    totalPersonnel: number;
    totalAppointments: number;
  };
  patients: PatientDTO[];
  healthcareWorkers: HealthcareWorkerDTO[];
  appointments: AppointmentDTO[];
}

const ManagerDashboard: React.FC = () => {
  const { personnelId } = useParams<{ personnelId: string }>();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showPatientModal, setShowPatientModal] = useState<boolean>(false);
  const [showWorkerModal, setShowWorkerModal] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientDTO | null>(
    null
  );
  const [selectedWorker, setSelectedWorker] =
    useState<HealthcareWorkerDTO | null>(null);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentDTO | null>(null);
  const [showAppointmentModal, setShowAppointmentModal] =
    useState<boolean>(false);
  const [patientInfo, setPatientInfo] = useState<PatientDTO | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(false);

  const formatTimeSpan = (timeSpan: string | undefined): string => {
    if (!timeSpan) return "N/A";
    try {
      const parts = timeSpan.split(":");
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
      return timeSpan;
    } catch {
      return timeSpan;
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadDashboard();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [personnelId]);

  const loadDashboard = async (): Promise<void> => {
    try {
      const [patients, healthcareWorkers, appointmentsResult] =
        await Promise.allSettled([
          patientRequests.getAll(),
          healthcareWorkerRequests.getAll(),
          appointmentRequests.getAll(),
        ]);

      const patientsData =
        patients.status === "fulfilled" ? patients.value : [];
      const healthcareWorkersData =
        healthcareWorkers.status === "fulfilled" ? healthcareWorkers.value : [];

      const appointmentsData =
        appointmentsResult.status === "fulfilled"
          ? appointmentsResult.value.map((apt: any) => {
              // Format display time from selectedStartTime
              let timeDisplay = "N/A";
              if (apt.selectedStartTime) {
                timeDisplay = formatTimeSpan(apt.selectedStartTime);
              }

              return {
                ...apt,
                appointmentTime: timeDisplay,
              };
            })
          : [];

      const stats = {
        totalPatients: patientsData.length,
        totalPersonnel: healthcareWorkersData.length,
        totalAppointments: appointmentsData.length,
      };

      setDashboard({
        stats,
        patients: patientsData,
        healthcareWorkers: healthcareWorkersData,
        appointments: appointmentsData,
      });
      setError("");
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load dashboard.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = (): void => {
    setLoading(true);
    loadDashboard();
  };

  const formatDate = (dateString?: string | null): string => {
    if (!dateString) return "Not available";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getServiceType = (appointment: any): string => {
    return appointment.serviceType || "N/A";
  };

  const handleViewPatient = (patient: PatientDTO) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const handleViewWorker = (worker: HealthcareWorkerDTO) => {
    setSelectedWorker(worker);
    setShowWorkerModal(true);
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

  const handleApproveAppointment = async (id: number) => {
    try {
      await appointmentRequests.approve(id);
      await loadDashboard();
    } catch (err: any) {
      setError(err.message || "Failed to approve appointment");
    }
  };

  const handleRejectAppointment = async (id: number) => {
    try {
      await appointmentRequests.reject(id);
      await loadDashboard();
    } catch (err: any) {
      setError(err.message || "Failed to reject appointment");
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div
      className="container mt-4"
      style={{
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3">Welcome Admin</h1>
          {user && (
            <p className="text-muted mb-0">Logged in as: {user.fullName}</p>
          )}
        </div>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={handleRefresh}
          >
            <i className="bi bi-arrow-clockwise"></i> Refresh Dashboard
          </button>
        </div>
      </div>

      <StatsCards stats={dashboard.stats} />

      {dashboard.patients.length > 0 && (
        <PatientTable
          patients={dashboard.patients}
          onView={handleViewPatient}
        />
      )}

      {dashboard.healthcareWorkers.length > 0 && (
        <WorkerTable
          workers={dashboard.healthcareWorkers}
          onView={handleViewWorker}
        />
      )}

      <div className="row mb-4">
        <div
          className="col-lg-4 mb-4 mb-lg-0"
          style={{ flex: "0 0 35%", maxWidth: "35%" }}
        >
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h6 className="mb-0" style={{ color: "#009688" }}>
                <i className="bi bi-calendar3"></i> Appointments Calendar
              </h6>
            </div>
            <div className="card-body">
              <AdminCalendarView />
            </div>
          </div>
        </div>
        <div className="col-lg-8" style={{ flex: "0 0 65%", maxWidth: "65%" }}>
          <div id="appointments-section" className="h-100">
            <AppointmentTable
              appointments={dashboard.appointments}
              onView={handleViewAppointment}
              onApprove={handleApproveAppointment}
              onReject={handleRejectAppointment}
              formatDate={formatDate}
              getServiceType={getServiceType}
            />
          </div>
        </div>
      </div>

      <PatientModal
        isOpen={showPatientModal}
        patient={selectedPatient}
        onClose={() => {
          setShowPatientModal(false);
          setSelectedPatient(null);
        }}
        formatDate={formatDate}
      />

      <WorkerModal
        isOpen={showWorkerModal}
        worker={selectedWorker}
        onClose={() => {
          setShowWorkerModal(false);
          setSelectedWorker(null);
        }}
      />

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
    </div>
  );
};

export default ManagerDashboard;
