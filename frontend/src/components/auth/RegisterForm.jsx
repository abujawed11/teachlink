import { useState } from "react";
import { AtSign, Lock, Mail, User } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

function RegisterForm({ onSuccess, onSwitchToLogin, defaultAsTeacher = false }) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [asTeacher, setAsTeacher] = useState(defaultAsTeacher);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await register(form, asTeacher);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Username
          </label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
              title="Letters, numbers, and underscores only"
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Confirm
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600 pt-1">
        <input
          type="checkbox"
          checked={asTeacher}
          onChange={(e) => setAsTeacher(e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        I am registering as a teacher
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        {submitting ? "Creating account..." : "Create Account"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-indigo-600 font-medium hover:underline"
        >
          Log in
        </button>
      </p>
    </form>
  );
}

export default RegisterForm;
