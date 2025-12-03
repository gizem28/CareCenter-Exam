import apiClient from "./apiClient";

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
      const response = await apiClient.post("/Auth/login", { email, password });
      return response.data; // eks: { token: "JWT..." }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed");
    }
  },

  registerPatient: async (data: PatientRegisterData) => {
    try {
      const response = await apiClient.post("/Auth/register-patient", data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Registration failed");
    }
  },

  forgotPassword: async (email: string) => {
    try {
      const response = await apiClient.post("/Auth/forgot-password", { email });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to process request"
      );
    }
  },

  resetPassword: async (email: string, token: string, newPassword: string) => {
    try {
      const response = await apiClient.post("/Auth/reset-password", {
        email,
        token,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Password reset failed");
    }
  },
};
