import { apiService } from "../services/apiService";

// Appointment types - matches backend Appointment model
export interface AppointmentDTO {
  id: number;
  patientId: number;
  patientName?: string;
  workerId?: number;
  workerName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status: string;
  notes?: string;
  serviceType?: string;
  availabilityId?: number;
  date?: string;
  tasks?: Array<{
    description: string;
    done: boolean;
    id?: number;
    appointmentId?: number;
  }>;
  visitNote?: string;
  createdAt?: string;
  // Selected time range by the patient
  selectedStartTime?: string;
  selectedEndTime?: string;
  // Backend model fields
  availability?: {
    id: number;
    date: string;
    startTime?: string;
    endTime?: string;
    healthcareWorkerId: number;
    healthcareWorker?: {
      id: number;
      fullName: string;
      email: string;
    };
  };
}

export interface AppointmentCreateDto {
  availabilityId: number;
  patientId: number;
  tasks: string[];
  requestedLocalTime?: Date | string;
  selectedStartTime?: string; // TimeSpan format "HH:mm:ss" or "HH:mm"
  selectedEndTime?: string; // TimeSpan format "HH:mm:ss" or "HH:mm"
}

export interface AppointmentUpdateDto {
  availabilityId?: number;
  status?: string;
  visitNote?: string;
  tasks?: string[];
  selectedStartTime?: string;
  selectedEndTime?: string;
}

/**
 * Appointments API requests
 * Handles all appointment-related API calls
 */
export const appointmentRequests = {
  /**
   * Get all appointments
   * GET /api/Appointments
   */
  getAll: async (): Promise<AppointmentDTO[]> => {
    return apiService.get<AppointmentDTO[]>("/Appointments");
  },

  /**
   * Get appointment by ID
   * GET /api/Appointments/{id}
   */
  getById: async (id: number): Promise<AppointmentDTO> => {
    return apiService.get<AppointmentDTO>(`/Appointments/${id}`);
  },

  /**
   * Get appointments by patient ID
   * GET /api/Appointments/patient/{patientId}
   */
  getByPatient: async (patientId: number): Promise<AppointmentDTO[]> => {
    return apiService.get<AppointmentDTO[]>(
      `/Appointments/patient/${patientId}`
    );
  },

  /**
   * Create a new appointment
   * POST /api/Appointments
   */
  create: async (data: AppointmentCreateDto): Promise<AppointmentDTO> => {
    const response = await apiService.post<{
      message: string;
      created: AppointmentDTO;
    }>("/Appointments", data);
    return response.created;
  },

  /**
   * Update an appointment
   * PUT /api/Appointments/{id}
   */
  update: async (
    id: number,
    data: AppointmentUpdateDto
  ): Promise<AppointmentDTO> => {
    return apiService.put<AppointmentDTO>(`/Appointments/${id}`, data);
  },

  /**
   * Delete an appointment
   * DELETE /api/Appointments/{id}
   */
  delete: async (id: number, role?: string): Promise<void> => {
    const endpoint = role
      ? `/Appointments/${id}?role=${role}`
      : `/Appointments/${id}`;
    return apiService.delete<void>(endpoint);
  },

  /**
   * Approve an appointment (Admin only)
   * POST /api/Appointments/{id}/approve
   */
  approve: async (id: number): Promise<AppointmentDTO> => {
    const response = await apiService.post<{
      message: string;
      appointment: AppointmentDTO;
    }>(`/Appointments/${id}/approve`, {});
    return response.appointment;
  },

  /**
   * Reject an appointment (Admin only) - releases the slot
   * POST /api/Appointments/{id}/reject
   */
  reject: async (id: number): Promise<AppointmentDTO> => {
    const response = await apiService.post<{
      message: string;
      appointment: AppointmentDTO;
    }>(`/Appointments/${id}/reject`, {});
    return response.appointment;
  },
};
