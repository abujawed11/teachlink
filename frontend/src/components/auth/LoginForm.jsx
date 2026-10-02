import { useState } from "react";
import { Lock, User } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

function LoginForm({ onSuccess, onSwitchToRegister }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
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
      await login(form.username, form.password);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Username
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            required
            autoFocus
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        {submitting ? "Logging in..." : "Log In"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-indigo-600 font-medium hover:underline"
        >
          Sign up
        </button>
      </p>
    </form>
  );
}

export default LoginForm;
