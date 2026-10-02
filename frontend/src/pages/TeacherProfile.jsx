import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getPublicTeacher } from "../api/teacherApi";
import ProfileView from "../components/profile/ProfileView";

function TeacherProfile() {
  const { slug } = useParams();
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

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-8">
      <ProfileView profile={profile} name={profile.name} />
    </div>
  );
}

export default TeacherProfile;
