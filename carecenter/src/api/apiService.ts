// Base API service for handling HTTP requests
// This handles all communication with backend

const API_BASE_URL = "http://localhost:5000/api";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
}

// Main class for API communication
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Get JWT token from local storage for API calls
  // Dette henter autentiseringstoken fra browser
  private getAuthToken(): string | null {
    return localStorage.getItem("token");
  }

  // Build headers for API requests including auth token
  // Dette lager riktige headers med Bearer token
  private getHeaders(customHeaders?: Record<string, string>): HeadersInit {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    const token = this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Handle API response and parse JSON or return empty for delete operations
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText || "An error occurred",
      }));
      throw {
        response: {
          status: response.status,
          data: errorData,
        },
        message: errorData.message || "An error occurred",
      };
    }

    // Check if response has content before parsing JSON
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");

    // If no content or empty response (204 No Content, etc.), return undefined cast to T
    if (
      response.status === 204 ||
      contentLength === "0" ||
      (contentType && !contentType.includes("application/json"))
    ) {
      return undefined as T;
    }

    // Check if response body is empty by reading as text first
    const text = await response.text();

    // If empty, return undefined
    if (!text || text.trim() === "") {
      return undefined as T;
    }

    // Try to parse as JSON
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      // If parsing fails, return undefined (for delete operations that return empty)
      return undefined as T;
    }
  }

  // GET request method for fetching data from API
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(options?.headers),
    });

    return this.handleResponse<T>(response);
  }

  // POST request for creating new data like new appointments
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(options?.headers),
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }
}

export const apiService = new ApiService();
