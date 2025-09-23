const API_BASE_URL = "http://localhost:9090";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("auth_token");

  if (!token) {
    throw new ApiError("No authentication token found", 401);
  }

  const defaultHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid - remove it and redirect to login
      localStorage.removeItem("auth_token");
      window.location.href = "/auth";
      throw new ApiError("Authentication required", 401);
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.error ||
      `API call failed: ${response.status} ${response.statusText}`;
    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
};
