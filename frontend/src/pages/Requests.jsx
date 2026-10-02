import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, Mail, Phone } from "lucide-react";

import { getReceivedRequests, getSentRequests, markRequestRead } from "../api/contactApi";
import { useAuth } from "../hooks/useAuth";

const formatDate = (value) =>
  new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function EmptyState({ children }) {
  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-500 space-y-2">
      <Inbox className="h-8 w-8 mx-auto text-slate-300" />
      <p>{children}</p>
    </div>
  );
}

function ReceivedList({ requests, onMarkRead }) {
  if (requests.length === 0) {
    return <EmptyState>No one has contacted you yet. Requests will appear here.</EmptyState>;
  }

  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <li
          key={request.id}
          className={`bg-white border rounded-xl p-5 ${
            request.isRead ? "border-slate-200" : "border-indigo-300 shadow-sm"
          }`}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{request.sender.name}</h3>
              {!request.isRead && (
                <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">New</span>
              )}
            </div>
            <span className="text-xs text-slate-400">{formatDate(request.createdAt)}</span>
          </div>

          <p className="mt-3 text-slate-700 whitespace-pre-line">{request.message}</p>

          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2 text-sm">
              <a
                href={`mailto:${request.sender.email}`}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg"
              >
                <Mail className="h-3.5 w-3.5" />
                {request.sender.email}
              </a>
              {request.phone && (
                <a
                  href={`tel:${request.phone.replace(/[^\d+]/g, "")}`}
                  className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {request.phone}
                </a>
              )}
            </div>
            {!request.isRead && (
              <button
                type="button"
                onClick={() => onMarkRead(request.id)}
                className="text-sm text-indigo-600 hover:underline"
              >
                Mark as read
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function SentList({ requests }) {
  if (requests.length === 0) {
    return (
      <EmptyState>
        You haven&apos;t contacted any teachers yet.{" "}
        <Link to="/teachers" className="text-indigo-600 hover:underline">
          Find a teacher
        </Link>
      </EmptyState>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((request) => (
        <li key={request.id} className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h3 className="font-semibold text-slate-900">
              {request.teacher.slug ? (
                <Link to={`/teachers/${request.teacher.slug}`} className="hover:text-indigo-600">
                  {request.teacher.name}
                </Link>
              ) : (
                request.teacher.name
              )}
            </h3>
            <span className="text-xs text-slate-400">{formatDate(request.createdAt)}</span>
          </div>
          <p className="mt-3 text-slate-700 whitespace-pre-line">{request.message}</p>
        </li>
      ))}
    </ul>
  );
}

function Requests({ onUnreadChange }) {
  const { user } = useAuth();
  const isTeacher = user?.role === "TEACHER";
  const [tab, setTab] = useState(isTeacher ? "received" : "sent");
  const [received, setReceived] = useState(null);
  const [sent, setSent] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSentRequests()
      .then(setSent)
      .catch(() => setError("Could not load your requests"));

    if (isTeacher) {
      getReceivedRequests()
        .then((data) => {
          setReceived(data.requests);
          onUnreadChange?.(data.unreadCount);
        })
        .catch(() => setError("Could not load your requests"));
    }
  }, [isTeacher, onUnreadChange]);

  const handleMarkRead = async (id) => {
    try {
      await markRequestRead(id);
      setReceived((prev) => prev.map((r) => (r.id === id ? { ...r, isRead: true } : r)));
      onUnreadChange?.((count) => Math.max(0, count - 1));
    } catch {
      setError("Could not update that request");
    }
  };

  const unread = received?.filter((r) => !r.isRead).length ?? 0;
  const tabs = [
    ...(isTeacher ? [["received", `Received${unread ? ` (${unread})` : ""}`]] : []),
    ["sent", "Sent"],
  ];
  const loaded = tab === "received" ? received : sent;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Requests</h1>

      <div role="tablist" className="flex gap-1 border-b border-slate-200">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loaded === null && !error && <p className="text-slate-500">Loading...</p>}
      {tab === "received" && received && (
        <ReceivedList requests={received} onMarkRead={handleMarkRead} />
      )}
      {tab === "sent" && sent && <SentList requests={sent} />}
    </div>
  );
}

export default Requests;
