const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config();

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

// Creates the first admin from ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD (and optional
// ADMIN_NAME) in .env. There is deliberately no default password. An existing account with that
// username is promoted to ADMIN but its password is left untouched.
async function seedAdmin() {
  const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  const provided = { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD };
  const missing = Object.keys(provided).filter((key) => !provided[key]);
  if (missing.length === Object.keys(provided).length) {
    console.log("Skipping admin: set ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env to create one.");
    return;
  }
  if (missing.length > 0) {
    throw new Error(`Can't create the admin: missing ${missing.join(", ")} in .env`);
  }
  if (ADMIN_PASSWORD.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters");
  }

  const existing = await prisma.user.findUnique({ where: { username: ADMIN_USERNAME } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", status: "ACTIVE" },
    });
    console.log(`Existing user "${ADMIN_USERNAME}" is now an ADMIN.`);
    return;
  }

  await prisma.user.create({
    data: {
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      name: ADMIN_NAME || "Administrator",
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "ADMIN",
    },
  });
  console.log(`Admin "${ADMIN_USERNAME}" created.`);
}

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

  await seedAdmin();

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
