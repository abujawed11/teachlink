import { useEffect, useState } from "react";

import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

// "register-teacher" opens the sign-up form with the teacher checkbox already ticked.
function AuthModal({ initialMode = "login", onClose }) {
  const [mode, setMode] = useState(initialMode === "register-teacher" ? "register" : initialMode);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease-out]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.15s_ease-out]">
        <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-6 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <h2 className="text-xl font-bold">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-indigo-100 text-sm mt-1">
            {mode === "login"
              ? "Log in to continue to TeachLink"
              : "Join TeachLink as a student or teacher"}
          </p>
        </div>

        <div className="px-6 py-6">
          {mode === "login" ? (
            <LoginForm
              onSuccess={onClose}
              onSwitchToRegister={() => setMode("register")}
            />
          ) : (
            <RegisterForm
              defaultAsTeacher={initialMode === "register-teacher"}
              onSuccess={onClose}
              onSwitchToLogin={() => setMode("login")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
