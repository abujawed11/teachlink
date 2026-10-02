-- CreateTable
CREATE TABLE `TeacherSubject` (
    `teacherProfileId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,

    PRIMARY KEY (`teacherProfileId`, `subjectId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherGrade` (
    `teacherProfileId` INTEGER NOT NULL,
    `gradeId` INTEGER NOT NULL,

    PRIMARY KEY (`teacherProfileId`, `gradeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherBoard` (
    `teacherProfileId` INTEGER NOT NULL,
    `boardId` INTEGER NOT NULL,

    PRIMARY KEY (`teacherProfileId`, `boardId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherLanguage` (
    `teacherProfileId` INTEGER NOT NULL,
    `languageId` INTEGER NOT NULL,

    PRIMARY KEY (`teacherProfileId`, `languageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherQualification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherProfileId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `institution` VARCHAR(191) NULL,
    `yearCompleted` INTEGER NULL,
    `type` ENUM('DEGREE', 'CERTIFICATION', 'OTHER') NOT NULL DEFAULT 'DEGREE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherExperience` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherProfileId` INTEGER NOT NULL,
    `institutionName` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeacherAvailability` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teacherProfileId` INTEGER NOT NULL,
    `dayOfWeek` ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN') NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TeacherSubject` ADD CONSTRAINT `TeacherSubject_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `TeacherProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherSubject` ADD CONSTRAINT `TeacherSubject_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherGrade` ADD CONSTRAINT `TeacherGrade_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `TeacherProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherGrade` ADD CONSTRAINT `TeacherGrade_gradeId_fkey` FOREIGN KEY (`gradeId`) REFERENCES `Grade`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherBoard` ADD CONSTRAINT `TeacherBoard_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `TeacherProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherBoard` ADD CONSTRAINT `TeacherBoard_boardId_fkey` FOREIGN KEY (`boardId`) REFERENCES `Board`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherLanguage` ADD CONSTRAINT `TeacherLanguage_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `TeacherProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherLanguage` ADD CONSTRAINT `TeacherLanguage_languageId_fkey` FOREIGN KEY (`languageId`) REFERENCES `Language`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherQualification` ADD CONSTRAINT `TeacherQualification_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `TeacherProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherExperience` ADD CONSTRAINT `TeacherExperience_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `TeacherProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeacherAvailability` ADD CONSTRAINT `TeacherAvailability_teacherProfileId_fkey` FOREIGN KEY (`teacherProfileId`) REFERENCES `TeacherProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
