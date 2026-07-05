import axios from "axios";
import { serverUrl } from "../config";

const api = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
});

// ponytail: intercept 401s, silently refresh the JWT, and retry the original request
export function setupAxiosInterceptors(onUnauthenticated) {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 and we haven't already retried this request
      if (error.response?.status === 401 && !originalRequest._retry) {
        const isAuthRequest = originalRequest.url?.includes("/auth/google") || originalRequest.url?.includes("/auth/refresh");
        if (!isAuthRequest) {
          originalRequest._retry = true;
          try {
            // Attempt silent refresh
            await axios.post(`${serverUrl}api/auth/refresh`, {}, { withCredentials: true });
            // Retry the original request with the fresh token cookie
            return api(originalRequest);
          } catch (refreshError) {
            onUnauthenticated();
          }
        }
      } else if (error.response?.status === 401) {
        const isAuthRequest = originalRequest.url?.includes("/auth/google");
        if (!isAuthRequest) {
          onUnauthenticated();
        }
      }
      return Promise.reject(error);
    },
  );
}

export default api;
