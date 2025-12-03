import { apiService } from "./apiService";

// Healthcare Worker types matching backend DTOs
export interface HealthcareWorkerDTO {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  position: string;
  password?: string; // Optional, only used during creation
}

/**
 * Healthcare Workers API requests
 * Handles all healthcare worker-related API calls
 */
export const healthcareWorkerRequests = {
  /**
   * Get all healthcare workers
   * GET /api/healthcareworkers
   */
  getAll: async (): Promise<HealthcareWorkerDTO[]> => {
    return apiService.get<HealthcareWorkerDTO[]>("/healthcareworkers");
  },

  /**
   * Get healthcare worker by ID
   * GET /api/healthcareworkers/{id}
   */
  getById: async (id: number): Promise<HealthcareWorkerDTO> => {
    return apiService.get<HealthcareWorkerDTO>(`/healthcareworkers/${id}`);
  },

  /**
   * Create a new healthcare worker
   * POST /api/healthcareworkers
   * Returns worker data with password if it was generated/provided
   */
  create: async (
    worker: Omit<HealthcareWorkerDTO, "id">
  ): Promise<HealthcareWorkerDTO & { password?: string; message?: string }> => {
    return apiService.post<
      HealthcareWorkerDTO & { password?: string; message?: string }
    >("/healthcareworkers", worker);
  },

  /**
   * Update an existing healthcare worker
   * PUT /api/healthcareworkers/{id}
   */
  update: async (id: number, worker: HealthcareWorkerDTO): Promise<void> => {
    return apiService.put<void>(`/healthcareworkers/${id}`, worker);
  },

  /**
   * Delete a healthcare worker
   * DELETE /api/healthcareworkers/{id}
   */
  delete: async (id: number): Promise<void> => {
    return apiService.delete<void>(`/healthcareworkers/${id}`);
  },

  /**
   * Get healthcare worker by email
   * GET /api/healthcareworkers/email/{email}
   */
  getByEmail: async (email: string): Promise<HealthcareWorkerDTO | null> => {
    try {
      return await apiService.get<HealthcareWorkerDTO>(
        `/healthcareworkers/email/${encodeURIComponent(email)}`
      );
    } catch (err: any) {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }
  },
};
