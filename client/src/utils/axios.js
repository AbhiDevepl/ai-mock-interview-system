import axios from "axios";
import { serverUrl } from "../config";

const api = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
});

export function setupAxiosInterceptors(onUnauthenticated) {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const isAuthRequest = error.config?.url?.includes("/auth/google");
        if (!isAuthRequest) {
          onUnauthenticated();
        }
      }
      return Promise.reject(error);
    },
  );
}

export default api;
