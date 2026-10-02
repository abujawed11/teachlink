import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { sendContactRequest } from "../../api/contactApi";
import { useAuth } from "../../hooks/useAuth";
import { getInputClass } from "../onboarding/FormField";

const MAX_MESSAGE = 1000;
const PHONE_PATTERN = /^\+?[\d\s-]{7,20}$/;

function ContactModal({ slug, teacherName, onClose }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const nextErrors = {};
    if (message.trim().length < 10) {
      nextErrors.message = "Please write at least 10 characters so the teacher knows what you need";
    }
    if (phone.trim() && !PHONE_PATTERN.test(phone.trim())) {
      nextErrors.phone = "Enter a valid number, e.g. +91 98765 43210";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSending(true);
    try {
      await sendContactRequest(slug, { message: message.trim(), phone: phone.trim() || null });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Could not send your request");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Contact ${teacherName}`}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.15s_ease-out]"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Contact {teacherName}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="text-4xl">✅</div>
            <h3 className="text-lg font-semibold text-slate-800">Request sent!</h3>
            <p className="text-sm text-slate-500">
              {teacherName} will see your message and can reach you using your account email
              {phone.trim() ? " or the phone number you shared" : ""}.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link to="/requests" onClick={onClose} className="text-sm text-indigo-600 hover:underline">
                View my requests
              </Link>
              <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-700">
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="contact-message">
                Your message<span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                id="contact-message"
                rows={5}
                maxLength={MAX_MESSAGE}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell the teacher what you're looking for — subject, class, location, preferred timings..."
                className={getInputClass(Boolean(errors.message))}
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-red-600">{errors.message}</p>
                <p className="text-xs text-slate-400">
                  {message.length}/{MAX_MESSAGE}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="contact-phone">
                Phone number <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                maxLength={20}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={getInputClass(Boolean(errors.phone))}
              />
              {errors.phone ? (
                <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
              ) : (
                <p className="text-xs text-slate-400 mt-1">
                  Shared only with this teacher, if you want them to call or WhatsApp you.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="text-slate-600 hover:text-slate-800 px-4 py-2">
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {sending ? "Sending..." : "Send request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ContactModal;
