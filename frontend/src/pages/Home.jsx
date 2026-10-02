import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  Handshake,
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  UserSearch,
  Users,
  Video,
  Wallet,
} from "lucide-react";

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

const STUDENT_BENEFITS = [
  { icon: Search, text: "Search free, no account needed to browse" },
  { icon: ShieldCheck, text: "Contact teachers safely through the platform" },
  { icon: Wallet, text: "Compare fees and teaching modes upfront" },
];

const TEACHER_BENEFITS = [
  { icon: Users, text: "Reach students and parents actively searching" },
  { icon: CalendarClock, text: "Showcase your real availability and schedule" },
  { icon: BadgeCheck, text: "Build a credible profile with verification" },
];

const SUBJECT_ICONS = [School, Video, HomeIcon, MessageCircle, Users, Sparkles];

const FAQS = [
  {
    q: "Is it free to use TeachLink?",
    a: "Yes. Browsing and searching teacher profiles is completely free, and teachers can create a profile at no cost.",
  },
  {
    q: "Do I need an account to find a teacher?",
    a: "No — you can search and view full public profiles without signing up. You only need an account to contact a teacher directly.",
  },
  {
    q: "How do I contact a teacher?",
    a: "Open a teacher's profile and use the Contact button. You'll need to be logged in so the teacher knows who's reaching out.",
  },
  {
    q: "Can I teach online and offline both?",
    a: "Yes. Teachers can mark multiple teaching modes — online, offline, home tuition, group or 1-on-1 — on their profile.",
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-medium text-slate-800">{q}</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="px-5 pb-4 text-sm text-slate-500 animate-fade-in-up">{a}</p>}
    </div>
  );
}

function Home({ onSignUp }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [latest, setLatest] = useState(null);
  const [teacherCount, setTeacherCount] = useState(null);
  const [subject, setSubject] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    getSubjects().then(setSubjects).catch(() => {});
    searchTeachers({ pageSize: 6 })
      .then((data) => {
        setLatest(data.teachers);
        setTeacherCount(data.pagination?.total ?? null);
      })
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

        {(teacherCount != null || subjects.length > 0) && (
          <div className="relative border-t border-white/10 bg-black/10">
            <div className="max-w-4xl mx-auto px-4 sm:px-8 py-5 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{teacherCount ?? "—"}</p>
                <p className="text-xs text-indigo-100">Teachers listed</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{subjects.length || "—"}</p>
                <p className="text-xs text-indigo-100">Subjects covered</p>
              </div>
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-xs text-indigo-100">Free to browse</p>
              </div>
            </div>
          </div>
        )}
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

      {subjects.length > 0 && (
        <section className="bg-white border-y border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Explore by subject
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {subjects.slice(0, 12).map((s, i) => {
                const Icon = SUBJECT_ICONS[i % SUBJECT_ICONS.length];
                return (
                  <Link
                    key={s.id}
                    to={`/teachers?subject=${encodeURIComponent(s.name)}`}
                    className="flex flex-col items-center gap-2 text-center p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 transition-all animate-fade-in-up"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{s.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
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
      </section>

      <section className="bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Built for both sides of the classroom
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                For students &amp; parents
              </h3>
              <ul className="space-y-3">
                {STUDENT_BENEFITS.map((b) => (
                  <li key={b.text} className="flex items-start gap-3 text-sm text-slate-600">
                    <b.icon className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-indigo-600" />
                For teachers
              </h3>
              <ul className="space-y-3">
                {TEACHER_BENEFITS.map((b) => (
                  <li key={b.text} className="flex items-start gap-3 text-sm text-slate-600">
                    <b.icon className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
                    {b.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-8 py-12">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQS.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
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
