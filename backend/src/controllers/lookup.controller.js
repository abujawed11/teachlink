const asyncHandler = require("../middleware/asyncHandler");
const prisma = require("../lib/prisma");

const getSubjects = asyncHandler(async (req, res) => {
  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  res.json({ subjects });
});

const getGrades = asyncHandler(async (req, res) => {
  const grades = await prisma.grade.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  res.json({ grades });
});

const getBoards = asyncHandler(async (req, res) => {
  const boards = await prisma.board.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  res.json({ boards });
});

const getLanguages = asyncHandler(async (req, res) => {
  const languages = await prisma.language.findMany({ orderBy: { name: "asc" } });
  res.json({ languages });
});

module.exports = { getSubjects, getGrades, getBoards, getLanguages };
