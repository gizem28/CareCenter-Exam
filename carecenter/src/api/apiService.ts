// api service klasse for å kommunisere med backend
// tüm api isteklerini yöneten servis

const API_BASE_URL = "http://localhost:5000/api";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // hent jwt token fra localstorage
  private getAuthToken(): string | null {
    return localStorage.getItem("token");
  }

  // lag headers med auth token
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

  // håndter api svar og parse json
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

    // sjekk om response har innhold
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");

    // tom respons (204 etc) returner undefined
    if (
      response.status === 204 ||
      contentLength === "0" ||
      (contentType && !contentType.includes("application/json"))
    ) {
      return undefined as T;
    }

    // les body som tekst først
    const text = await response.text();

    if (!text || text.trim() === "") {
      return undefined as T;
    }

    // prøv å parse som json
    try {
      return JSON.parse(text) as T;
    } catch (error) {
      return undefined as T;
    }
  }

  // get request
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(options?.headers),
    });

    return this.handleResponse<T>(response);
  }

  // post request for å opprette data
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
