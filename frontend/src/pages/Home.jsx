import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Handshake, MapPin, Search, Sparkles, UserSearch } from "lucide-react";

import { getSubjects } from "../api/lookupApi";
import { searchTeachers } from "../api/teacherApi";
import TeacherCard from "../components/teacher/TeacherCard";
import { useAuth } from "../hooks/useAuth";

const STEPS = [
  {
    icon: Search,
    title: "Search",
    text: "Filter by subject, class, board, location and fees.",
  },
  {
    icon: UserSearch,
    title: "Compare",
    text: "Read full profiles — experience, qualifications and availability.",
  },
  {
    icon: Handshake,
    title: "Connect",
    text: "Reach out to the teacher that fits and book a demo class.",
  },
];

function Home({ onSignUp }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [latest, setLatest] = useState(null);
  const [subject, setSubject] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    getSubjects().then(setSubjects).catch(() => {});
    searchTeachers({ pageSize: 6 })
      .then((data) => setLatest(data.teachers))
      .catch(() => setLatest([]));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (city.trim()) params.set("city", city.trim());
    navigate(`/teachers${params.size ? `?${params}` : ""}`);
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
        <Sparkles className="hidden sm:block absolute top-10 left-10 h-8 w-8 text-white/20 animate-float-slow" />
        <Handshake className="hidden sm:block absolute bottom-16 left-24 h-10 w-10 text-white/15 animate-float-slow [animation-delay:1.5s]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-8 py-14 sm:py-20 text-center animate-fade-in-up">
          <span className="inline-flex items-center gap-1.5 bg-white/15 text-sm px-3 py-1 rounded-full mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Free for teachers and students
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold leading-tight">
            Find the right teacher, close to you
          </h1>
          <p className="mt-4 text-indigo-100 text-lg">
            Browse teacher profiles for tuition, coaching and online classes — no sign-up needed.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 bg-white rounded-2xl p-2 shadow-xl grid gap-2 sm:grid-cols-[1fr_1fr_auto] text-left"
          >
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-label="Subject"
              className="w-full rounded-xl px-4 py-3 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Any subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City or area"
                maxLength={100}
                aria-label="City or area"
                className="w-full rounded-xl pl-10 pr-4 py-3 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl px-8 py-3 transition-colors"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>

          {subjects.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {subjects.slice(0, 6).map((s) => (
                <Link
                  key={s.id}
                  to={`/teachers?subject=${encodeURIComponent(s.name)}`}
                  className="text-sm bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-2xl font-bold text-slate-900">Newly joined teachers</h2>
          <Link
            to="/teachers"
            className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {latest === null && <p className="text-slate-500">Loading teachers...</p>}

        {latest?.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((teacher, i) => (
              <div
                key={teacher.slug}
                className="animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <TeacherCard teacher={teacher} />
              </div>
            ))}
          </div>
        )}

        {latest?.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
            No teachers have published a profile yet — be the first!
          </div>
        )}
      </section>

      <section className="bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">How it works</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="text-center space-y-2 animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-slate-800">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {user?.role !== "TEACHER" && (
        <section className="max-w-4xl mx-auto px-4 sm:px-8 py-14 text-center space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Are you a teacher?</h2>
          <p className="text-slate-500">
            Create a free profile and let students and parents find you.
          </p>
          {!user && (
            <button
              type="button"
              onClick={onSignUp}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-sm hover:shadow-md"
            >
              Create your teacher profile
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </section>
      )}
    </div>
  );
}

export default Home;
