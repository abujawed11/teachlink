import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-xl p-8 max-w-sm w-full space-y-4"
      >
        <h1 className="text-2xl font-bold text-indigo-600">Login</h1>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}

export default Login;
