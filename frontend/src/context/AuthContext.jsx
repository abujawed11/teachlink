import { createContext, useCallback, useEffect, useState } from "react";

import apiClient, { refreshSession } from "../api/client";
import { SESSION_EXPIRED_EVENT } from "../api/refresh";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/auth/me");
      setUser(data.user);
    } catch (err) {
      // A returning visitor's 15-minute access token has usually expired even though their
      // 30-day refresh token is still good, so try to renew it before treating them as logged out.
      if (err.response?.status === 401) {
        try {
          await refreshSession();
          const { data } = await apiClient.get("/auth/me");
          setUser(data.user);
          return;
        } catch {
          // fall through to logged out
        }
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // The refresh token itself expired or was revoked (e.g. the account was suspended).
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, []);

  const login = async (username, password) => {
    const { data } = await apiClient.post("/auth/login", { username, password });
    setUser(data.user);
    return data.user;
  };

  const register = async (
    { name, username, email, password, confirmPassword },
    asTeacher = false
  ) => {
    const endpoint = asTeacher ? "/auth/register-teacher" : "/auth/register";
    const { data } = await apiClient.post(endpoint, {
      name,
      username,
      email,
      password,
      confirmPassword,
    });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await apiClient.post("/auth/logout");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser: setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
