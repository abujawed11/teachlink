import { createContext, useCallback, useEffect, useState } from "react";

import apiClient from "../api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/auth/me");
      setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

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
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
