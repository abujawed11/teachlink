import { useState } from "react";

import { changePassword, updateAccount } from "../api/userApi";
import FormField, { getInputClass } from "../components/onboarding/FormField";
import { useAuth } from "../hooks/useAuth";

const PHONE_PATTERN = /^\+?[\d\s-]{7,20}$/;

function Notice({ tone, children }) {
  if (!children) return null;
  const tones = {
    error: "text-red-600 bg-red-50 border-red-100",
    success: "text-emerald-700 bg-emerald-50 border-emerald-100",
  };
  return <p className={`text-sm border rounded-lg px-3 py-2 ${tones[tone]}`}>{children}</p>;
}

function AccountForm() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ tone: "", text: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ tone: "", text: "" });

    const nextErrors = {};
    if (name.trim().length < 2) nextErrors.name = "Name must be at least 2 characters";
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      nextErrors.phone = "Enter a valid number, e.g. +91 98765 43210";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const updated = await updateAccount({ name: name.trim(), phone: phone.trim() || null });
      updateUser(updated);
      setMessage({ tone: "success", text: "Your details have been saved." });
    } catch (err) {
      setMessage({
        tone: "error",
        text: err.response?.data?.error?.message || "Could not save your details",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Account details</h2>
        <p className="text-sm text-slate-500">
          Your name appears on your public profile
          {user.role === "TEACHER" ? "" : " and on requests you send"}.
        </p>
      </div>

      <Notice tone={message.tone}>{message.text}</Notice>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="Username">
          <input value={user.username} disabled className={`${getInputClass(false)} bg-slate-50 text-slate-500`} />
        </FormField>
        <FormField label="Email">
          <input value={user.email} disabled className={`${getInputClass(false)} bg-slate-50 text-slate-500`} />
        </FormField>
      </div>

      <FormField label="Full name" required error={errors.name}>
        <input
          value={name}
          maxLength={100}
          onChange={(e) => setName(e.target.value)}
          className={getInputClass(Boolean(errors.name))}
        />
      </FormField>

      <FormField label="Phone number" error={errors.phone}>
        <input
          type="tel"
          value={phone}
          maxLength={20}
          placeholder="+91 98765 43210"
          onChange={(e) => setPhone(e.target.value)}
          className={getInputClass(Boolean(errors.phone))}
        />
        <p className="text-xs text-slate-400 mt-1">
          Private. It only pre-fills the phone field when you send a request to a teacher; it is
          never shown on your profile.
        </p>
      </FormField>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {saving ? "Saving..." : "Save details"}
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ tone: "", text: "" });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ tone: "", text: "" });

    const nextErrors = {};
    if (!form.currentPassword) nextErrors.currentPassword = "Enter your current password";
    if (form.newPassword.length < 8) nextErrors.newPassword = "Use at least 8 characters";
    else if (form.newPassword === form.currentPassword) {
      nextErrors.newPassword = "New password must be different from your current one";
    }
    if (form.confirmPassword !== form.newPassword) nextErrors.confirmPassword = "Passwords do not match";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await changePassword(form);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage({ tone: "success", text: "Password changed." });
    } catch (err) {
      setMessage({
        tone: "error",
        text: err.response?.data?.error?.message || "Could not change your password",
      });
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, autoComplete) => (
    <FormField label={label} required error={errors[name]}>
      <input
        type="password"
        name={name}
        value={form[name]}
        autoComplete={autoComplete}
        maxLength={100}
        onChange={handleChange}
        className={getInputClass(Boolean(errors[name]))}
      />
    </FormField>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Change password</h2>
        <p className="text-sm text-slate-500">Use a strong password you don&apos;t use anywhere else.</p>
      </div>

      <Notice tone={message.tone}>{message.text}</Notice>

      {field("currentPassword", "Current password", "current-password")}
      {field("newPassword", "New password", "new-password")}
      {field("confirmPassword", "Confirm new password", "new-password")}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {saving ? "Changing..." : "Change password"}
        </button>
      </div>
    </form>
  );
}

function Settings() {
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-8 space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Account settings</h1>
      <AccountForm />
      <PasswordForm />
    </div>
  );
}

export default Settings;
