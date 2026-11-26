const BASE_URL = (import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "");

export interface ApiOptions {
  requiresAuth?: boolean;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
}

export const apiClient = async (endpoint: string, options: ApiOptions = {}) => {
  const {
    requiresAuth = true,
    headers = {},
    body,
    method = "GET",
    params,
  } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (requiresAuth) {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  let url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const isFormData = body instanceof FormData;
  if (isFormData) {
    delete requestHeaders["Content-Type"];
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body !== undefined && body !== null ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `Error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      const text = await response.text();
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
};

export const api = {
  get: (url: string, options?: ApiOptions) => apiClient(url, { ...options, method: "GET" }),
  post: (url: string, data?: any, options?: ApiOptions) => apiClient(url, { ...options, method: "POST", body: data }),
  put: (url: string, data?: any, options?: ApiOptions) => apiClient(url, { ...options, method: "PUT", body: data }),
  delete: (url: string, options?: ApiOptions) => apiClient(url, { ...options, method: "DELETE" }),
  patch: (url: string, data?: any, options?: ApiOptions) => apiClient(url, { ...options, method: "PATCH", body: data }),
};
