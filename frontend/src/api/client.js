import axios from "axios";

import { installRefreshInterceptor } from "./refresh";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Used on page load too: /auth/me is excluded from the interceptor, so AuthContext refreshes
// explicitly before giving up on a returning visitor.
export const refreshSession = installRefreshInterceptor(apiClient);

export default apiClient;
