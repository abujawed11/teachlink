function validateStep(step, profile) {
  const errors = {};

  if (step === 1) {
    if (!profile.headline || !profile.headline.trim()) {
      errors.headline = "A headline helps visitors know who you are at a glance";
    }
  }

  if (step === 3) {
    if (!profile.subjects || profile.subjects.length === 0) {
      errors.subjects = "Select at least one subject you teach";
    }
    if (!profile.grades || profile.grades.length === 0) {
      errors.grades = "Select at least one class/grade you teach";
    }
  }

  if (step === 4) {
    const hasMode =
      profile.onlineAvailable || profile.offlineAvailable || profile.homeTuitionAvailable;
    if (!hasMode) {
      errors.teachingModes = "Select at least one of Online, Offline, or Home Tuition";
    }
    if (
      profile.feeMin != null &&
      profile.feeMax != null &&
      Number(profile.feeMin) > Number(profile.feeMax)
    ) {
      errors.feeMin = "Minimum fee cannot be greater than maximum fee";
    }
  }

  if (step === 5) {
    if (!profile.city || !profile.city.trim()) {
      errors.city = "City is required so visitors can find you";
    }
  }

  return errors;
}

const STRENGTH_CHECKS = [
  (p) => Boolean(p.headline),
  (p) => Boolean(p.bio),
  (p) => Boolean(p.photoUrl),
  (p) => Boolean(p.qualificationSummary),
  (p) => p.experienceYears != null,
  (p) => Boolean(p.subjects?.length),
  (p) => Boolean(p.grades?.length),
  (p) => Boolean(p.city),
  (p) => Boolean(p.area),
  (p) => p.feeMin != null,
  (p) => p.feeMax != null,
  (p) => p.onlineAvailable || p.offlineAvailable || p.homeTuitionAvailable,
];

function computeProfileStrength(profile) {
  const passed = STRENGTH_CHECKS.filter((check) => check(profile)).length;
  return Math.round((passed / STRENGTH_CHECKS.length) * 100);
}

function getStrengthMessage(percent) {
  if (percent >= 100) return "Your profile is shining! ✨";
  if (percent >= 75) return "Almost there — looking great!";
  if (percent >= 40) return "Good start, keep going!";
  return "Let's build your profile 👋";
}

export { validateStep, computeProfileStrength, getStrengthMessage };
