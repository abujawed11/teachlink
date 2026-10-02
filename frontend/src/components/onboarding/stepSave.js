import {
  setMyBoards,
  setMyGrades,
  setMyLanguages,
  setMySubjects,
  updateMyProfile,
} from "../../api/teacherApi";

const STEP_SCALAR_FIELDS = {
  1: ["headline", "bio", "photoUrl", "gender"],
  2: ["qualificationSummary", "experienceYears"],
  4: [
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
  5: ["country", "state", "city", "area", "pincode"],
};

const RELATIONS_STEP = 3;

async function saveRelations(profile) {
  await setMySubjects(profile.subjects.map((s) => s.id));
  await setMyGrades(profile.grades.map((g) => g.id));
  await setMyBoards(profile.boards.map((b) => b.id));
  return setMyLanguages(profile.languages.map((l) => l.id));
}

// Persists whatever a given onboarding step owns and returns the fresh profile.
// Steps 2 and 6 also own sub-resources, but those are saved as they are added/removed.
async function saveStep(step, profile) {
  if (step === RELATIONS_STEP) return saveRelations(profile);

  const fields = STEP_SCALAR_FIELDS[step];
  if (!fields) return profile;

  const patch = fields.reduce((acc, field) => {
    acc[field] = profile[field];
    return acc;
  }, {});
  return updateMyProfile(patch);
}

export { saveStep };
