import { Link, Route, Routes } from "react-router-dom";

import FindTeachers from "./pages/FindTeachers";
import Home from "./pages/Home";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Register from "./pages/Register";
import TeacherProfile from "./pages/TeacherProfile";

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex gap-6">
        <Link to="/" className="font-bold text-indigo-600">
          TeachLink
        </Link>
        <Link to="/teachers" className="text-slate-600 hover:text-indigo-600">
          Find Teachers
        </Link>
        <Link to="/login" className="text-slate-600 hover:text-indigo-600">
          Login
        </Link>
        <Link to="/register" className="text-slate-600 hover:text-indigo-600">
          Register
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teachers" element={<FindTeachers />} />
        <Route path="/teachers/:slug" element={<TeacherProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
