import { apiService } from "./apiService";

export interface PatientRegisterData {
  fullName: string;
  email: string;
  password: string;
  address: string;
  phone: string;
  birthDate: string;
}

export const AuthService = {
  login: async (email: string, password: string) => {
    try {
      const response = await apiService.post<{
        token: string;
        role: string;
        email: string;
        fullName: string;
      }>("/Auth/login", { email, password });
      return response; // apiService zaten parse ediyor, response.data gerekmez
    } catch (error: any) {
      // apiService'in error formatı farklı olabilir
      const errorMessage =
        error?.message || error?.response?.data?.message || "Login failed";
      throw new Error(errorMessage);
    }
  },

  registerPatient: async (data: PatientRegisterData) => {
    try {
      const response = await apiService.post("/Auth/register-patient", data);
      return response;
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "Registration failed";
      throw new Error(errorMessage);
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await apiService.post("/Auth/forgot-password", {
        email,
      });
      return response;
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "Failed to process request";
      throw new Error(errorMessage);
    }
  },

  resetPassword: async (email: string, token: string, newPassword: string) => {
    try {
      const response = await apiService.post("/Auth/reset-password", {
        email,
        token,
        newPassword,
      });
      return response;
    } catch (error: any) {
      const errorMessage =
        error?.message ||
        error?.response?.data?.message ||
        "Password reset failed";
      throw new Error(errorMessage);
    }
  },
};
