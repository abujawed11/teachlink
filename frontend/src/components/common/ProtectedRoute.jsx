import { Link, Navigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

// `onLogin` opens the login modal. A logged-out visitor sees a prompt instead of being bounced
// to the home page; once they log in, this component re-renders and shows the page they asked for.
function ProtectedRoute({ role, onLogin, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-slate-500">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-4">
        <div className="text-4xl">🔒</div>
        <h1 className="text-xl font-bold text-slate-900">Please log in to continue</h1>
        <p className="text-slate-500">You need to be logged in to view this page.</p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={onLogin}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2 rounded-lg transition-colors"
          >
            Log in
          </button>
          <Link to="/" className="text-slate-600 hover:text-indigo-600 px-4 py-2">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
