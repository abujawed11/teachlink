import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { getBoards, getGrades, getLanguages, getSubjects } from "../../api/lookupApi";
import { getMyProfile, publishMyProfile, unpublishMyProfile } from "../../api/teacherApi";
import ProfileStrengthBar from "../../components/onboarding/ProfileStrengthBar";
import { computeProfileStrength } from "../../components/onboarding/validation";
import EditSectionModal from "../../components/profile/EditSectionModal";
import ProfileView from "../../components/profile/ProfileView";
import { useAuth } from "../../hooks/useAuth";

function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [lookups, setLookups] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [togglingPublish, setTogglingPublish] = useState(false);

  useEffect(() => {
    Promise.all([getMyProfile(), getSubjects(), getGrades(), getBoards(), getLanguages()])
      .then(([myProfile, subjects, grades, boards, languages]) => {
        setProfile(myProfile);
        setLookups({ subjects, grades, boards, languages });
      })
      .catch(() => setError("Could not load your profile"))
      .finally(() => setLoading(false));
  }, []);

  const strength = useMemo(() => (profile ? computeProfileStrength(profile) : 0), [profile]);

  const closeEditor = useCallback(() => {
    setEditing(null);
    // The modal may have uploaded a photo or added sub-items before being cancelled.
    getMyProfile().then(setProfile).catch(() => {});
  }, []);

  const handleSaved = (updated) => {
    setProfile(updated);
    setEditing(null);
  };

  const handleTogglePublish = async () => {
    setError("");
    setTogglingPublish(true);
    try {
      const updated = profile.isPublished ? await unpublishMyProfile() : await publishMyProfile();
      setProfile(updated);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Could not update publish status");
    } finally {
      setTogglingPublish(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading...</div>;
  }

  if (!profile || !lookups) {
    return <div className="p-8 text-red-600">{error || "Profile not found"}</div>;
  }

  // A brand-new teacher has nothing to show yet — walk them through the wizard first.
  if (!profile.headline && profile.subjects.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                profile.isHiddenByAdmin
                  ? "bg-red-100 text-red-700"
                  : profile.isPublished
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
              }`}
            >
              {profile.isHiddenByAdmin
                ? "Hidden by an administrator"
                : profile.isPublished
                  ? "Published"
                  : "Draft — not visible to visitors"}
            </span>
            {profile.isPublished && !profile.isHiddenByAdmin && (
              <Link
                to={`/teachers/${profile.slug}`}
                className="text-sm text-indigo-600 hover:underline"
              >
                View public page
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={togglingPublish || (profile.isHiddenByAdmin && !profile.isPublished)}
            className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
              profile.isPublished
                ? "text-slate-600 border border-slate-300 hover:bg-slate-50"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {togglingPublish ? "Updating..." : profile.isPublished ? "Unpublish" : "Publish profile"}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {profile.isHiddenByAdmin && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            An administrator has hidden your profile, so it isn't visible to visitors and can't be
            published right now. If you think this is a mistake, please contact support.
          </p>
        )}

        <ProfileStrengthBar percent={strength} />
      </div>

      <ProfileView profile={profile} name={user?.name} onEdit={setEditing} />

      {editing && (
        <EditSectionModal
          section={editing}
          profile={profile}
          lookups={lookups}
          onSaved={handleSaved}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}

export default MyProfile;
