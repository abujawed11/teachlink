import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getBoards,
  getGrades,
  getLanguages,
  getSubjects,
} from "../../api/lookupApi";
import { getMyProfile, publishMyProfile } from "../../api/teacherApi";
import ProfilePreviewCard from "../../components/onboarding/ProfilePreviewCard";
import ProfileStrengthBar from "../../components/onboarding/ProfileStrengthBar";
import Stepper from "../../components/onboarding/Stepper";
import StepAvailability from "../../components/onboarding/steps/StepAvailability";
import StepBasicInfo from "../../components/onboarding/steps/StepBasicInfo";
import StepLocation from "../../components/onboarding/steps/StepLocation";
import StepProfessional from "../../components/onboarding/steps/StepProfessional";
import StepReview from "../../components/onboarding/steps/StepReview";
import StepSubjects from "../../components/onboarding/steps/StepSubjects";
import StepTuition from "../../components/onboarding/steps/StepTuition";
import { saveStep } from "../../components/onboarding/stepSave";
import { computeProfileStrength, validateStep } from "../../components/onboarding/validation";

const STEP_LABELS = [
  "Basic Info",
  "Professional",
  "Subjects",
  "Tuition",
  "Location",
  "Availability",
  "Review",
];

function OnboardingWizard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [lookups, setLookups] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepErrors, setStepErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [publishedMessage, setPublishedMessage] = useState("");

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

  const TEACHING_MODE_FIELDS = ["onlineAvailable", "offlineAvailable", "homeTuitionAvailable"];

  const clearErrors = (keys) => {
    setStepErrors((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of keys) {
        if (key in next) {
          delete next[key];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  };

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    const toClear = [field];
    if (TEACHING_MODE_FIELDS.includes(field) && value) toClear.push("teachingModes");
    clearErrors(toClear);
  };

  const handleToggleRelation = (field, item) => {
    setProfile((prev) => {
      const list = prev[field];
      const exists = list.some((i) => i.id === item.id);
      const next = exists ? list.filter((i) => i.id !== item.id) : [...list, item];
      return { ...prev, [field]: next };
    });
    clearErrors([field]);
  };

  const handleNext = async () => {
    setError("");

    const errors = validateStep(currentStep, profile);
    if (Object.keys(errors).length > 0) {
      setStepErrors(errors);
      return;
    }
    setStepErrors({});

    setSaving(true);
    try {
      const updated = await saveStep(currentStep, profile);
      setProfile(updated);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Could not save this step");
      setSaving(false);
      return;
    }
    setSaving(false);
    setCurrentStep((step) => Math.min(step + 1, STEP_LABELS.length));
  };

  const handleBack = () => {
    setError("");
    setStepErrors({});
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const handlePublish = async () => {
    setError("");
    setSaving(true);
    try {
      await publishMyProfile();
      setPublishedMessage("Your profile is now live!");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Could not publish profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-500">Loading...</div>;
  }

  if (!profile || !lookups) {
    return <div className="p-8 text-red-600">{error || "Profile not found"}</div>;
  }

  if (publishedMessage) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <div className="text-4xl">🎉</div>
        <h1 className="text-2xl font-bold text-indigo-600">{publishedMessage}</h1>
        <p className="text-slate-500">
          Visitors can now find you at /teachers/{profile.slug}
        </p>
        <button
          type="button"
          onClick={() => navigate(`/teachers/${profile.slug}`)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          View my public profile
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 sm:p-8">
      <Stepper steps={STEP_LABELS} currentStep={currentStep} />
      <ProfileStrengthBar percent={strength} />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <div key={currentStep} className="animate-[scaleIn_0.2s_ease-out]">
            {currentStep === 1 && (
              <StepBasicInfo values={profile} onChange={handleChange} errors={stepErrors} />
            )}
            {currentStep === 2 && (
              <StepProfessional
                values={profile}
                onChange={handleChange}
                onProfileUpdate={setProfile}
              />
            )}
            {currentStep === 3 && (
              <StepSubjects
                values={profile}
                onToggle={handleToggleRelation}
                lookups={lookups}
                errors={stepErrors}
              />
            )}
            {currentStep === 4 && (
              <StepTuition values={profile} onChange={handleChange} errors={stepErrors} />
            )}
            {currentStep === 5 && (
              <StepLocation values={profile} onChange={handleChange} errors={stepErrors} />
            )}
            {currentStep === 6 && (
              <StepAvailability values={profile} onProfileUpdate={setProfile} />
            )}
            {currentStep === 7 && <StepReview values={profile} />}
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || saving}
              className="text-slate-600 hover:text-indigo-600 disabled:opacity-40 px-4 py-2"
            >
              Back
            </button>

            {currentStep < STEP_LABELS.length ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {saving ? "Saving..." : "Save & Continue"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublish}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {saving ? "Publishing..." : "Publish Profile"}
              </button>
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-6 space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Live Preview
            </p>
            <ProfilePreviewCard values={profile} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;
