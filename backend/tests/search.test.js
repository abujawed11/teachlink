import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { api, cleanup, createTeacher, makeTag, prisma } from "./helpers.js";

const tag = makeTag("srch");
const city = `${tag}town`; // a unique city isolates these teachers from everything else
let ids; // lookup ids by name

const search = (query = "") => api.get(`/teachers?city=${city}${query ? `&${query}` : ""}`);
const slugsOf = (res) => res.body.teachers.map((t) => t.slug);

async function link(teacher, { subjects = [], grades = [], boards = [], languages = [] }) {
  const profileId = teacher.profile.id;
  await prisma.teacherSubject.createMany({ data: subjects.map((n) => ({ teacherProfileId: profileId, subjectId: ids.subject[n] })) });
  await prisma.teacherGrade.createMany({ data: grades.map((n) => ({ teacherProfileId: profileId, gradeId: ids.grade[n] })) });
  await prisma.teacherBoard.createMany({ data: boards.map((n) => ({ teacherProfileId: profileId, boardId: ids.board[n] })) });
  await prisma.teacherLanguage.createMany({ data: languages.map((n) => ({ teacherProfileId: profileId, languageId: ids.language[n] })) });
}

let a; // maths, class 10, CBSE, English; online; 10 yrs; 500-1000
let b; // physics, class 9, ICSE; offline+home; 2 yrs; 2000-3000
let f; // no fee set

beforeAll(async () => {
  const byName = async (model, names) =>
    Object.fromEntries((await prisma[model].findMany({ where: { name: { in: names } } })).map((r) => [r.name, r.id]));
  ids = {
    subject: await byName("subject", ["Mathematics", "Physics"]),
    grade: await byName("grade", ["Class 9", "Class 10"]),
    board: await byName("board", ["CBSE", "ICSE"]),
    language: await byName("language", ["English", "Hindi"]),
  };

  a = await createTeacher(tag, "a", { city, experienceYears: 10, feeMin: 500, feeMax: 1000, onlineAvailable: true });
  b = await createTeacher(tag, "b", {
    city, experienceYears: 2, feeMin: 2000, feeMax: 3000,
    onlineAvailable: false, offlineAvailable: true, homeTuitionAvailable: true, area: "Sector 4",
  });
  f = await createTeacher(tag, "f", { city, experienceYears: 5, feeMin: null, feeMax: null });
  await createTeacher(tag, "hidden", { city, experienceYears: 20, isHiddenByAdmin: true });
  await createTeacher(tag, "draft", { city, isPublished: false });
  await createTeacher(tag, "susp", { city }, { status: "SUSPENDED" });

  await link(a, { subjects: ["Mathematics"], grades: ["Class 10"], boards: ["CBSE"], languages: ["English"] });
  await link(b, { subjects: ["Physics"], grades: ["Class 9"], boards: ["ICSE"] });
  await link(f, { subjects: ["Mathematics", "Physics"] });
});

afterAll(async () => {
  await cleanup(tag);
  await prisma.$disconnect();
});

describe("who appears in search", () => {
  it("lists only published, visible profiles of active accounts", async () => {
    const res = await search();
    expect(res.status).toBe(200);
    expect(slugsOf(res).sort()).toEqual([a.slug, b.slug, f.slug].sort());
  });

  it("works without logging in and returns card data only", async () => {
    const res = await search();
    const card = res.body.teachers.find((t) => t.slug === a.slug);
    expect(card).toMatchObject({
      name: "a", city, experienceYears: 10, feeMin: 500, feeMax: 1000,
      subjects: ["Mathematics"], grades: ["Class 10"], modes: ["Online"],
    });
    const body = JSON.stringify(res.body);
    expect(body).not.toContain("@test.local");
    for (const key of ["pincode", "userId", "contactNumber", "bio", "email", "phone"]) {
      expect(card).not.toHaveProperty(key);
    }
  });
});

describe("filters", () => {
  it("filters by subject, class, board and language", async () => {
    expect(slugsOf(await search("subject=Physics")).sort()).toEqual([b.slug, f.slug].sort());
    expect(slugsOf(await search("grade=Class 10"))).toEqual([a.slug]);
    expect(slugsOf(await search("board=ICSE"))).toEqual([b.slug]);
    expect(slugsOf(await search("language=English"))).toEqual([a.slug]);
  });

  it("matches ANY value inside one filter, but ALL different filters", async () => {
    expect(slugsOf(await search("subject=Physics,Mathematics")).sort()).toEqual([a.slug, b.slug, f.slug].sort());
    expect(slugsOf(await search("subject=Physics&board=CBSE"))).toEqual([]);
    expect(slugsOf(await search("subject=Mathematics&grade=Class 10&board=CBSE&language=English"))).toEqual([a.slug]);
  });

  it("filters by teaching mode", async () => {
    expect(slugsOf(await search("mode=online"))).toContain(a.slug);
    expect(slugsOf(await search("mode=home"))).toEqual([b.slug]);
    expect(slugsOf(await search("mode=group"))).toEqual([]);
  });

  it("filters by max fee (teachers with no fee can't be matched) and by experience", async () => {
    expect(slugsOf(await search("feeMax=1500"))).toEqual([a.slug]);
    expect(slugsOf(await search("feeMax=5000")).sort()).toEqual([a.slug, b.slug].sort());
    expect(slugsOf(await search("experienceMin=5")).sort()).toEqual([a.slug, f.slug].sort());
  });

  it("matches the city or the area, partially and case-insensitively", async () => {
    const res = await api.get(`/teachers?city=SECTOR`);
    expect(slugsOf(res)).toContain(b.slug);
    expect(slugsOf(await api.get(`/teachers?city=${city.slice(0, -3).toUpperCase()}`))).toContain(a.slug);
  });

  it("treats blank filters as no filter", async () => {
    const res = await search("subject=&board=&mode=&feeMax=");
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBe(3);
  });

  it("ignores deactivated lookup values in filters", async () => {
    const retired = await prisma.subject.create({ data: { name: `${tag} Retired`, isActive: false } });
    await prisma.teacherSubject.create({ data: { teacherProfileId: a.profile.id, subjectId: retired.id } });
    try {
      expect(slugsOf(await search(`subject=${encodeURIComponent(retired.name)}`))).toEqual([]);
    } finally {
      await prisma.subject.delete({ where: { id: retired.id } });
    }
  });
});

describe("sorting and pagination", () => {
  it("sorts by experience and by fee", async () => {
    expect(slugsOf(await search("sort=experience_desc"))).toEqual([a.slug, f.slug, b.slug]);
    const asc = slugsOf(await search("sort=fee_asc&feeMax=5000"));
    expect(asc).toEqual([a.slug, b.slug]);
    const desc = slugsOf(await search("sort=fee_desc&feeMax=5000"));
    expect(desc).toEqual([b.slug, a.slug]);
  });

  it("pages through results without repeats or gaps", async () => {
    const seen = [];
    for (const page of [1, 2, 3]) {
      const res = await search(`pageSize=1&page=${page}&sort=experience_desc`);
      expect(res.body.pagination).toMatchObject({ page, pageSize: 1, total: 3, totalPages: 3 });
      seen.push(...slugsOf(res));
    }
    expect(seen).toEqual([a.slug, f.slug, b.slug]);
  });

  it("returns an empty page, not an error, past the end", async () => {
    const res = await search("pageSize=2&page=99");
    expect(res.status).toBe(200);
    expect(res.body.teachers).toEqual([]);
    expect(res.body.pagination.total).toBe(3);
  });

  it("reports at least one page even when nothing matches", async () => {
    const res = await search("subject=Physics&board=CBSE");
    expect(res.body.pagination).toMatchObject({ total: 0, totalPages: 1 });
  });
});

describe("input validation", () => {
  it.each([
    ["unknown mode", "mode=teleport"],
    ["unknown sort", "sort=random"],
    ["page size above the cap", "pageSize=500"],
    ["page size of zero", "pageSize=0"],
    ["non-numeric page", "page=abc"],
    ["page zero", "page=0"],
    ["non-numeric fee", "feeMax=cheap"],
    ["negative experience", "experienceMin=-3"],
  ])("rejects %s with a 400", async (_label, query) => {
    const res = await search(query);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});
