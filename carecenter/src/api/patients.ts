import { apiService } from "../services/apiService";

// Patient types matching backend DTOs
export interface PatientDTO {
  id: number;
  fullName: string;
  address: string;
  phone: string;
  email: string;
  birthDate: string;
}

/**
 * Patients API requests
 * Handles all patient-related API calls
 */
export const patientRequests = {
  /**
   * Get all patients
   * GET /api/patients
   */
  getAll: async (): Promise<PatientDTO[]> => {
    return apiService.get<PatientDTO[]>("/patients");
  },

  /**
   * Get patient by ID
   * GET /api/patients/{id}
   */
  getById: async (id: number): Promise<PatientDTO> => {
    return apiService.get<PatientDTO>(`/patients/${id}`);
  },

  /**
   * Get patient by email
   * GET /api/patients/email/{email}
   */
  getByEmail: async (email: string): Promise<PatientDTO> => {
    return apiService.get<PatientDTO>(
      `/patients/email/${encodeURIComponent(email)}`
    );
  },

  /**
   * Create a new patient
   * POST /api/patients
   */
  create: async (patient: Omit<PatientDTO, "id">): Promise<PatientDTO> => {
    return apiService.post<PatientDTO>("/patients", patient);
  },

  /**
   * Update an existing patient
   * PUT /api/patients/{id}
   */
  update: async (id: number, patient: PatientDTO): Promise<void> => {
    return apiService.put<void>(`/patients/${id}`, patient);
  },

  /**
   * Delete a patient
   * DELETE /api/patients/{id}
   */
  delete: async (id: number): Promise<void> => {
    return apiService.delete<void>(`/patients/${id}`);
  },
};
