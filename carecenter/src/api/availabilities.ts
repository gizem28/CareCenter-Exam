import { apiService } from "./apiService";

// Availability types matching backend DTOs
export interface AvailabilityDTO {
  id: number;
  healthcareWorkerId: number;
  date?: string; // ISO date string
  startTime?: string; // TimeSpan format "HH:mm:ss"
  endTime?: string; // TimeSpan format "HH:mm:ss"
  isBooked?: boolean; // Whether this availability is booked
  healthcareWorkerName?: string; // Worker name (included in unbooked queries)
  healthcareWorkerPosition?: string; // Worker position (included in unbooked queries)
}

/**
 * Availabilities API requests
 * Handles all availability-related API calls
 */
export const availabilityRequests = {
  /**
   * Get all availabilities
   * GET /api/Availabilities
   */
  getAll: async (): Promise<AvailabilityDTO[]> => {
    return apiService.get<AvailabilityDTO[]>("/Availabilities");
  },

  /**
   * Get unbooked availabilities (for patients to see available slots)
   * GET /api/Availabilities/unbooked
   * Always includes worker name and position
   */
  getUnbooked: async (): Promise<AvailabilityDTO[]> => {
    return apiService.get<AvailabilityDTO[]>("/Availabilities/unbooked");
  },

  /**
   * Add availability dates for a healthcare worker
   * POST /api/availabilities
   * Note: This method is deprecated - use direct apiService.post with array of DTOs
   */
  add: async (
    healthcareWorkerId: number,
    dates: string[],
    startTime?: string,
    endTime?: string
  ): Promise<{ message: string; createdList: AvailabilityDTO[] }> => {
    return apiService.post<{ message: string; createdList: AvailabilityDTO[] }>(
      "/Availabilities",
      {
        healthcareWorkerId,
        dates,
        startTime,
        endTime,
      }
    );
  },

  /**
   * Update availability
   * PUT /api/availabilities/{id}
   */
  update: async (
    id: number,
    availability: Partial<AvailabilityDTO>
  ): Promise<AvailabilityDTO> => {
    return apiService.put<AvailabilityDTO>(
      `/availabilities/${id}`,
      availability
    );
  },

  /**
   * Delete availability
   * DELETE /api/availabilities/{id}
   */
  delete: async (id: number): Promise<void> => {
    return apiService.delete<void>(`/availabilities/${id}`);
  },
};
