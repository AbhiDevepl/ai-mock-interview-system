/**
 * Shared frontend configuration.
 * All environment variables must be prefixed with VITE_ to be exposed to client code.
 */
export const serverUrl = import.meta.env.VITE_SERVER_URL
  ? import.meta.env.VITE_SERVER_URL.replace(/\/$/, "") + "/"
  : "http://localhost:8000/";