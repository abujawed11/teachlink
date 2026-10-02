import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { revealContactNumber } from "../api/contactApi";
import { getPublicTeacher } from "../api/teacherApi";
import ContactModal from "../components/profile/ContactModal";
import ProfileView from "../components/profile/ProfileView";
import { useAuth } from "../hooks/useAuth";

function TeacherProfile({ onLogin }) {
  const { slug } = useParams();
  const { user } = useAuth();
  const [contactOpen, setContactOpen] = useState(false);
  const [wantsNumber, setWantsNumber] = useState(false);
  const [numberError, setNumberError] = useState("");
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    getPublicTeacher(slug)
      .then((data) => {
        setProfile(data);
        setStatus("ready");
      })
      .catch((err) => setStatus(err.response?.status === 404 ? "notFound" : "error"));
  }, [slug]);

  useEffect(() => {
    if (profile) document.title = `${profile.name} — TeachLink`;
    return () => {
      document.title = "TeachLink";
    };
  }, [profile]);

  // Once a logged-in visitor asks to see the number, fetch it (also fires right after they log in).
  useEffect(() => {
    if (!wantsNumber || !user || !profile || profile.contactNumber) return undefined;
    let cancelled = false;
    revealContactNumber(slug)
      .then(({ contactNumber }) => {
        if (!cancelled) setProfile((prev) => ({ ...prev, contactNumber }));
      })
      .catch((err) => {
        if (cancelled) return;
        setNumberError(err.response?.data?.error?.message || "Could not load the contact number");
        setWantsNumber(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wantsNumber, user, profile, slug]);

  if (status === "loading") {
    return <div className="p-8 text-slate-500">Loading...</div>;
  }

  if (status === "notFound") {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-3">
        <h1 className="text-2xl font-bold text-slate-800">Teacher not found</h1>
        <p className="text-slate-500">This profile doesn't exist or isn't public.</p>
        <Link to="/teachers" className="text-indigo-600 hover:underline">
          Browse teachers
        </Link>
      </div>
    );
  }

  if (status === "error") {
    return <div className="p-8 text-red-600">Could not load this profile</div>;
  }

  // Contacting needs an account so teachers know who is writing. A logged-out visitor is sent
  // to log in first; once they are, the form opens without them having to click again.
  const handleContact = () => {
    setContactOpen(true);
    if (!user) onLogin();
  };

  const handleRevealContact = () => {
    setNumberError("");
    setWantsNumber(true);
    if (!user) onLogin();
  };

  // Drop an unlocked number from view if the visitor logs out.
  const visibleProfile = user ? profile : { ...profile, contactNumber: undefined };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8">
      <ProfileView
        profile={visibleProfile}
        name={profile.name}
        onContact={profile.isOwner ? undefined : handleContact}
        onRevealContact={handleRevealContact}
        contactError={numberError}
      />

      {contactOpen && user && (
        <ContactModal
          slug={slug}
          teacherName={profile.name}
          onClose={() => setContactOpen(false)}
        />
      )}
    </div>
  );
}

export default TeacherProfile;
