import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api, cleanup, createTeacher, createUser, makeTag, prisma } from "./helpers.js";

const tag = makeTag("tch");
let teacher; // an unpublished, mostly empty draft
let other;
let parent;
let math;
let physics;
let class10;

beforeAll(async () => {
  teacher = await createTeacher(tag, "draft", {
    isPublished: false,
    city: null,
    headline: null,
    onlineAvailable: false,
  });
  other = await createTeacher(tag, "other");
  parent = await createUser(tag, "parent");
  [math, physics] = await Promise.all([
    prisma.subject.findFirst({ where: { name: "Mathematics" } }),
    prisma.subject.findFirst({ where: { name: "Physics" } }),
  ]);
  class10 = await prisma.grade.findFirst({ where: { name: "Class 10" } });
});

afterAll(async () => {
  await cleanup(tag);
  await prisma.$disconnect();
});

describe("own profile access", () => {
  it("requires login and the TEACHER role", async () => {
    expect((await api.get("/teachers/me")).status).toBe(401);
    expect((await api.get("/teachers/me", parent)).status).toBe(403);
    expect((await api.patch("/teachers/me", parent, { headline: "x" })).status).toBe(403);
  });

  it("returns the teacher's own profile", async () => {
    const res = await api.get("/teachers/me", teacher.user);
    expect(res.status).toBe(200);
    expect(res.body.profile.slug).toBe(teacher.slug);
    expect(res.body.profile.subjects).toEqual([]);
  });

  it("updates only the caller's own profile, whatever id the client sends", async () => {
    const res = await api.patch("/teachers/me", teacher.user, {
      headline: "Maths made simple",
      id: other.profile.id,
      userId: other.user.id,
    });
    expect(res.status).toBe(200);
    expect(res.body.profile.headline).toBe("Maths made simple");

    const untouched = await prisma.teacherProfile.findUnique({ where: { id: other.profile.id } });
    expect(untouched.headline).toBe("other headline");
  });
});

describe("profile validation", () => {
  it.each([
    ["feeMin above feeMax", { feeMin: 5000, feeMax: 1000 }],
    ["negative experience", { experienceYears: -1 }],
    ["absurd experience", { experienceYears: 200 }],
    ["over-long headline", { headline: "x".repeat(151) }],
    ["unknown gender", { gender: "MARTIAN" }],
    ["unknown contact preference", { contactPreference: "CARRIER_PIGEON" }],
    ["non-URL photoUrl", { photoUrl: "not a url" }],
    ["PHONE preference without a number", { contactPreference: "PHONE", contactNumber: null }],
    ["malformed contact number", { contactPreference: "PHONE", contactNumber: "call me maybe" }],
  ])("rejects %s", async (_label, body) => {
    const res = await api.patch("/teachers/me", teacher.user, body);
    expect(res.status).toBe(400);
  });

  it("accepts a valid phone preference with a number", async () => {
    const res = await api.patch("/teachers/me", teacher.user, {
      contactPreference: "WHATSAPP",
      contactNumber: "+91 98765 43210",
    });
    expect(res.status).toBe(200);
    expect(res.body.profile.contactNumber).toBe("+91 98765 43210");
  });
});

describe("publishing rules", () => {
  it("blocks publishing an incomplete profile and lists everything missing", async () => {
    const res = await api.post("/teachers/me/publish", teacher.user);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("PROFILE_INCOMPLETE");
    for (const missing of ["City", "teaching mode", "subject", "class/grade"]) {
      expect(res.body.error.message).toContain(missing);
    }
  });

  it("publishes once city, a mode, a headline, a subject and a class are set", async () => {
    await api.patch("/teachers/me", teacher.user, { city: "Bokaro", onlineAvailable: true, pincode: "827001" });
    await api.put("/teachers/me/subjects", teacher.user, { ids: [math.id] });
    await api.put("/teachers/me/grades", teacher.user, { ids: [class10.id] });

    const res = await api.post("/teachers/me/publish", teacher.user);
    expect(res.status).toBe(200);
    expect(res.body.profile.isPublished).toBe(true);
  });

  it("can be unpublished again", async () => {
    const res = await api.post("/teachers/me/unpublish", teacher.user);
    expect(res.status).toBe(200);
    expect(res.body.profile.isPublished).toBe(false);
    await api.post("/teachers/me/publish", teacher.user);
  });
});

describe("public profile page", () => {
  it("shows the full public profile without logging in", async () => {
    const res = await api.get(`/teachers/${teacher.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({
      slug: teacher.slug,
      city: "Bokaro",
      subjects: ["Mathematics"],
      grades: ["Class 10"],
      isOwner: false,
    });
  });

  it("never leaks private fields", async () => {
    const res = await api.get(`/teachers/${teacher.slug}`);
    const body = JSON.stringify(res.body);
    expect(body).not.toContain("827001"); // pincode
    expect(body).not.toContain("@test.local"); // email
    expect(body).not.toContain("password");
    for (const key of ["pincode", "profileViews", "userId", "email", "phone", "id", "contactNumber"]) {
      expect(res.body.profile).not.toHaveProperty(key);
    }
  });

  it("returns 404 for unknown, unpublished, and suspended-owner profiles", async () => {
    expect((await api.get("/teachers/does-not-exist")).status).toBe(404);

    await api.post("/teachers/me/unpublish", teacher.user);
    expect((await api.get(`/teachers/${teacher.slug}`)).status).toBe(404);
    await api.post("/teachers/me/publish", teacher.user);

    await prisma.user.update({ where: { id: teacher.user.id }, data: { status: "SUSPENDED" } });
    expect((await api.get(`/teachers/${teacher.slug}`)).status).toBe(404);
    await prisma.user.update({ where: { id: teacher.user.id }, data: { status: "ACTIVE" } });
  });

  it("flags isOwner only for the teacher themselves", async () => {
    expect((await api.get(`/teachers/${teacher.slug}`, parent)).body.profile.isOwner).toBe(false);
    expect((await api.get(`/teachers/${teacher.slug}`, teacher.user)).body.profile.isOwner).toBe(true);
  });
});

describe("subjects, classes, boards and languages", () => {
  it("replaces the whole selection and ignores duplicates", async () => {
    let res = await api.put("/teachers/me/subjects", teacher.user, { ids: [math.id, math.id, physics.id] });
    expect(res.status).toBe(200);
    expect(res.body.profile.subjects.map((s) => s.name).sort()).toEqual(["Mathematics", "Physics"]);

    res = await api.put("/teachers/me/subjects", teacher.user, { ids: [physics.id] });
    expect(res.body.profile.subjects.map((s) => s.name)).toEqual(["Physics"]);

    res = await api.put("/teachers/me/subjects", teacher.user, { ids: [] });
    expect(res.body.profile.subjects).toEqual([]);
    await api.put("/teachers/me/subjects", teacher.user, { ids: [math.id] });
  });

  it("only changes the caller's own selections", async () => {
    await api.put("/teachers/me/subjects", teacher.user, { ids: [physics.id, math.id] });
    const othersSubjects = await prisma.teacherSubject.count({ where: { teacherProfileId: other.profile.id } });
    expect(othersSubjects).toBe(0);
  });

  it("rejects malformed id lists", async () => {
    expect((await api.put("/teachers/me/subjects", teacher.user, { ids: ["a"] })).status).toBe(400);
    expect((await api.put("/teachers/me/subjects", teacher.user, { ids: [-1] })).status).toBe(400);
    expect((await api.put("/teachers/me/subjects", teacher.user, {})).status).toBe(400);
    expect((await api.put("/teachers/me/subjects", teacher.user, { ids: Array(51).fill(1) })).status).toBe(400);
  });

  it("rejects ids that don't exist instead of failing with a server error", async () => {
    const res = await api.put("/teachers/me/subjects", teacher.user, { ids: [999999] });
    expect(res.status).toBe(400);
    // …and the existing selection is untouched, because the replace is transactional.
    const still = await prisma.teacherSubject.count({ where: { teacherProfileId: teacher.profile.id } });
    expect(still).toBe(2);
  });
});

describe("deactivated lookup items", () => {
  let retired;

  beforeAll(async () => {
    retired = await prisma.subject.create({ data: { name: `${tag} Retired`, isActive: false } });
  });

  afterAll(async () => {
    await prisma.subject.deleteMany({ where: { name: { startsWith: tag } } });
  });

  it("can't be newly selected", async () => {
    const res = await api.put("/teachers/me/subjects", teacher.user, { ids: [math.id, retired.id] });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/not available/);
  });

  it("stay on a teacher who already has them, so saving the form doesn't fail", async () => {
    await prisma.teacherSubject.create({
      data: { teacherProfileId: teacher.profile.id, subjectId: retired.id },
    });
    const res = await api.put("/teachers/me/subjects", teacher.user, { ids: [math.id, retired.id] });
    expect(res.status).toBe(200);
    expect(res.body.profile.subjects.map((s) => s.id)).toContain(retired.id);

    // Drop it again so later tests see the original selection.
    await api.put("/teachers/me/subjects", teacher.user, { ids: [math.id, physics.id] });
  });
});

describe("qualifications, experience and availability", () => {
  it("adds and removes a qualification", async () => {
    const added = await api.post("/teachers/me/qualifications", teacher.user, {
      title: "B.Ed.",
      institution: "Ranchi University",
      yearCompleted: 2018,
    });
    expect(added.status).toBe(201);
    const id = added.body.profile.qualifications[0].id;

    const removed = await api.delete(`/teachers/me/qualifications/${id}`, teacher.user);
    expect(removed.status).toBe(200);
    expect(removed.body.profile.qualifications).toEqual([]);
  });

  it("cannot delete another teacher's entries", async () => {
    const q = await prisma.teacherQualification.create({
      data: { teacherProfileId: other.profile.id, title: "Theirs" },
    });
    const e = await prisma.teacherExperience.create({
      data: { teacherProfileId: other.profile.id, institutionName: "Theirs" },
    });
    const a = await prisma.teacherAvailability.create({
      data: { teacherProfileId: other.profile.id, dayOfWeek: "MON", startTime: "10:00", endTime: "11:00" },
    });

    expect((await api.delete(`/teachers/me/qualifications/${q.id}`, teacher.user)).status).toBe(404);
    expect((await api.delete(`/teachers/me/experience/${e.id}`, teacher.user)).status).toBe(404);
    expect((await api.delete(`/teachers/me/availability/${a.id}`, teacher.user)).status).toBe(404);

    expect(await prisma.teacherQualification.count({ where: { id: q.id } })).toBe(1);
  });

  it("validates sub-resource payloads", async () => {
    expect((await api.post("/teachers/me/qualifications", teacher.user, { title: "" })).status).toBe(400);
    expect((await api.post("/teachers/me/experience", teacher.user, {})).status).toBe(400);
    expect(
      (await api.post("/teachers/me/availability", teacher.user, { dayOfWeek: "FUNDAY", startTime: "1", endTime: "2" })).status
    ).toBe(400);
  });

  it("adds experience and availability slots and shows them publicly", async () => {
    await api.post("/teachers/me/experience", teacher.user, {
      institutionName: "DPS Bokaro",
      role: "Maths teacher",
      startDate: "2019-04-01",
    });
    await api.post("/teachers/me/availability", teacher.user, {
      dayOfWeek: "MON",
      startTime: "16:00",
      endTime: "18:00",
    });

    const res = await api.get(`/teachers/${teacher.slug}`);
    expect(res.body.profile.experiences[0]).toMatchObject({ institutionName: "DPS Bokaro", role: "Maths teacher" });
    expect(res.body.profile.availabilities[0]).toMatchObject({ dayOfWeek: "MON", startTime: "16:00" });
  });
});
