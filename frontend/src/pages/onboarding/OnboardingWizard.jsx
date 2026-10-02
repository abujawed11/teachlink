import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getMyProfile,
  publishMyProfile,
  updateMyProfile,
} from "../../api/teacherApi";
import Stepper from "../../components/onboarding/Stepper";
import StepBasicInfo from "../../components/onboarding/steps/StepBasicInfo";
import StepLocation from "../../components/onboarding/steps/StepLocation";
import StepProfessional from "../../components/onboarding/steps/StepProfessional";
import StepReview from "../../components/onboarding/steps/StepReview";
import StepTuition from "../../components/onboarding/steps/StepTuition";

const STEP_LABELS = ["Basic Info", "Professional", "Tuition", "Location", "Review"];

const STEP_FIELDS = [
  ["headline", "bio", "photoUrl", "gender"],
  ["qualificationSummary", "experienceYears"],
  [
    "onlineAvailable",
    "offlineAvailable",
    "homeTuitionAvailable",
    "studentCanVisit",
    "groupTuitionAvailable",
    "individualTuitionAvailable",
    "demoClassAvailable",
    "teachingRadiusKm",
    "feeMin",
    "feeMax",
    "contactPreference",
  ],
  ["country", "state", "city", "area", "pincode"],
];

function OnboardingWizard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [publishedMessage, setPublishedMessage] = useState("");

  useEffect(() => {
    getMyProfile()
      .then(setProfile)
      .catch(() => setError("Could not load your profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const pickFields = (fields) =>
    fields.reduce((acc, field) => {
      acc[field] = profile[field];
      return acc;
    }, {});

  const handleNext = async () => {
    setError("");
    const fields = STEP_FIELDS[currentStep - 1];
    if (fields) {
      setSaving(true);
      try {
        const updated = await updateMyProfile(pickFields(fields));
        setProfile(updated);
      } catch (err) {
        setError(err.response?.data?.error?.message || "Could not save this step");
        setSaving(false);
        return;
      }
      setSaving(false);
    }
    setCurrentStep((step) => Math.min(step + 1, STEP_LABELS.length));
  };

  const handleBack = () => {
    setError("");
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

  if (!profile) {
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
    <div className="max-w-2xl mx-auto p-6 sm:p-8">
      <Stepper steps={STEP_LABELS} currentStep={currentStep} />

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {currentStep === 1 && <StepBasicInfo values={profile} onChange={handleChange} />}
        {currentStep === 2 && <StepProfessional values={profile} onChange={handleChange} />}
        {currentStep === 3 && <StepTuition values={profile} onChange={handleChange} />}
        {currentStep === 4 && <StepLocation values={profile} onChange={handleChange} />}
        {currentStep === 5 && <StepReview values={profile} />}

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
    </div>
  );
}

export default OnboardingWizard;
