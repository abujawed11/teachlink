import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import {
  GraduationCap,
  Inbox,
  LogOut,
  Search,
  Settings as SettingsIcon,
  Shield,
  UserCircle2,
} from "lucide-react";

import { getUnreadCount } from "./api/contactApi";

import AuthModal from "./components/auth/AuthModal";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Footer from "./components/layout/Footer";
import FindTeachers from "./pages/FindTeachers";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import AdminPanel from "./pages/admin/AdminPanel";
import MyProfile from "./pages/dashboard/MyProfile";
import OnboardingWizard from "./pages/onboarding/OnboardingWizard";
import Requests from "./pages/Requests";
import Settings from "./pages/Settings";
import TeacherProfile from "./pages/TeacherProfile";
import { useAuth } from "./hooks/useAuth";

function NavLink({ to, icon: Icon, children, badge }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
    >
      <Icon className="h-4 w-4" />
      {children}
      {badge}
    </Link>
  );
}

function App() {
  const { user, loading, logout } = useAuth();
  const [authMode, setAuthMode] = useState(null);
  const [unread, setUnread] = useState(0);
  const { pathname } = useLocation();
  const isTeacher = user?.role === "TEACHER";
  const isAdmin = user?.role === "ADMIN";
  const openLogin = () => setAuthMode("login");

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center gap-6 shadow-sm">
        <Link to="/" className="flex items-center gap-1.5 font-bold text-indigo-600">
          <GraduationCap className="h-6 w-6" />
          TeachLink
        </Link>
        <NavLink to="/teachers" icon={Search}>
          Find Teachers
        </NavLink>
        {isTeacher && (
          <NavLink to="/dashboard" icon={UserCircle2}>
            My Profile
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin" icon={Shield}>
            Admin
          </NavLink>
        )}
        {user && (
          <NavLink
            to="/requests"
            icon={Inbox}
            badge={
              isTeacher &&
              unread > 0 && (
                <span className="relative flex h-5 w-5 items-center justify-center bg-indigo-600 text-white text-xs rounded-full leading-none">
                  {unread}
                  <span className="absolute inset-0 rounded-full animate-pulse-ring" />
                </span>
              )
            }
          >
            Requests
          </NavLink>
        )}

        <div className="ml-auto flex items-center gap-3">
          {!loading && !user && (
            <>
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="text-slate-600 hover:text-indigo-600 px-3 py-1.5 transition-colors"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("register")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                Sign up
              </button>
            </>
          )}

          {!loading && user && (
            <>
              <Link
                to="/settings"
                title="Account settings"
                className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <SettingsIcon className="h-4 w-4" />
                Hi, {user.name}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home onSignUp={() => setAuthMode("register-teacher")} />} />
          <Route path="/teachers" element={<FindTeachers />} />
          <Route
            path="/teachers/:slug"
            element={<TeacherProfile onLogin={openLogin} />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="ADMIN" onLogin={openLogin}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute onLogin={openLogin}>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute onLogin={openLogin}>
                <Requests onUnreadChange={setUnread} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="TEACHER" onLogin={openLogin}>
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute role="TEACHER" onLogin={openLogin}>
                <OnboardingWizard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer onSignUp={() => setAuthMode("register-teacher")} />

      {authMode && (
        <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />
      )}
    </div>
  );
}

export default App;
