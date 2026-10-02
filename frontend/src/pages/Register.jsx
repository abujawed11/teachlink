import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [asTeacher, setAsTeacher] = useState(false);
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
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Registration failed");
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
        <h1 className="text-2xl font-bold text-indigo-600">Register</h1>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            minLength={3}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, and underscores only"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

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
            minLength={8}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            minLength={8}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={asTeacher}
            onChange={(e) => setAsTeacher(e.target.checked)}
          />
          I am registering as a teacher
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}

export default Register;
