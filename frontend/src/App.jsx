import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";

import { getUnreadCount } from "./api/contactApi";

import AuthModal from "./components/auth/AuthModal";
import ProtectedRoute from "./components/common/ProtectedRoute";
import FindTeachers from "./pages/FindTeachers";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/admin/AdminPanel";
import MyProfile from "./pages/dashboard/MyProfile";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import Requests from "./pages/Requests";
import TeacherProfile from "./pages/TeacherProfile";
import { useAuth } from "./hooks/useAuth";

function App() {
  const { user, loading, logout } = useAuth();
  const [authMode, setAuthMode] = useState(null);
  const [unread, setUnread] = useState(0);
  const { pathname } = useLocation();
  const isTeacher = user?.role === "TEACHER";
  const isAdmin = user?.role === "ADMIN";

  // Keep the nav badge fresh as a teacher moves around the app.
  useEffect(() => {
    if (!isTeacher) return;
    getUnreadCount()
      .then(setUnread)
      .catch(() => {});
  }, [isTeacher, pathname]);

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
        {isTeacher && (
          <Link to="/dashboard" className="text-slate-600 hover:text-indigo-600">
            My Profile
          </Link>
        )}
        {isAdmin && (
          <Link to="/admin" className="text-slate-600 hover:text-indigo-600">
            Admin
          </Link>
        )}
        {user && (
          <Link
            to="/requests"
            className="text-slate-600 hover:text-indigo-600 flex items-center gap-1.5"
          >
            Requests
            {isTeacher && unread > 0 && (
              <span className="bg-indigo-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {unread}
              </span>
            )}
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
        <Route
          path="/teachers/:slug"
          element={<TeacherProfile onLogin={() => setAuthMode("login")} />}
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <Requests onUnreadChange={setUnread} />
            </ProtectedRoute>
          }
        />
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
