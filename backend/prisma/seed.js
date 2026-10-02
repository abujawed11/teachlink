const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SUBJECTS = [
  "Mathematics",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "Social Studies",
  "Computer Science",
  "Accountancy",
  "Economics",
  "Business Studies",
];

const GRADES = [
  "Nursery",
  "LKG",
  "UKG",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "Competitive Exam",
];

const BOARDS = ["CBSE", "ICSE", "JAC", "State Board", "IB", "IGCSE"];

const LANGUAGES = ["English", "Hindi", "Urdu", "Bengali", "Punjabi"];

async function main() {
  await Promise.all(
    SUBJECTS.map((name) =>
      prisma.subject.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  await Promise.all(
    GRADES.map((name, index) =>
      prisma.grade.upsert({
        where: { name },
        update: {},
        create: { name, sortOrder: index },
      })
    )
  );

  await Promise.all(
    BOARDS.map((name) =>
      prisma.board.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  await Promise.all(
    LANGUAGES.map((name) =>
      prisma.language.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
