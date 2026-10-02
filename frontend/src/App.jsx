import { useState } from "react";
import { Link, Route, Routes } from "react-router-dom";

import AuthModal from "./components/auth/AuthModal";
import ProtectedRoute from "./components/common/ProtectedRoute";
import FindTeachers from "./pages/FindTeachers";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import MyProfile from "./pages/dashboard/MyProfile";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import TeacherProfile from "./pages/TeacherProfile";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, loading, logout } = useAuth();
  const [authMode, setAuthMode] = useState(null);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-6">
        <Link to="/" className="font-bold text-indigo-600">
          TeachLink
        </Link>
        <Link to="/teachers" className="text-slate-600 hover:text-indigo-600">
          Find Teachers
        </Link>
        {user?.role === "TEACHER" && (
          <Link to="/dashboard" className="text-slate-600 hover:text-indigo-600">
            My Profile
          </Link>
        )}

        <div className="ml-auto flex items-center gap-3">
          {!loading && !user && (
            <>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="text-slate-600 hover:text-indigo-600 px-3 py-1.5"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                Sign up
              </button>
            </>
          )}

          {!loading && user && (
            <>
              <span className="text-slate-600">Hi, {user.name}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-600 hover:text-indigo-600"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home onSignUp={() => setAuthMode("register-teacher")} />} />
        <Route path="/teachers" element={<FindTeachers />} />
        <Route path="/teachers/:slug" element={<TeacherProfile />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="TEACHER">
              <MyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute role="TEACHER">
              <OnboardingWizard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {authMode && (
        <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />
      )}
    </div>
  );
}

export default App;
