/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `isEmailVerified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `phone` VARCHAR(191) NULL,
    ADD COLUMN `role` ENUM('USER', 'TEACHER', 'ADMIN') NOT NULL DEFAULT 'USER',
    ADD COLUMN `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `TeacherProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `headline` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `photoUrl` VARCHAR(191) NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NULL,
    `experienceYears` INTEGER NULL,
    `qualificationSummary` VARCHAR(191) NULL,
    `country` VARCHAR(191) NULL,
    `state` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `area` VARCHAR(191) NULL,
    `pincode` VARCHAR(191) NULL,
    `onlineAvailable` BOOLEAN NOT NULL DEFAULT false,
    `offlineAvailable` BOOLEAN NOT NULL DEFAULT false,
    `homeTuitionAvailable` BOOLEAN NOT NULL DEFAULT false,
    `studentCanVisit` BOOLEAN NOT NULL DEFAULT false,
    `groupTuitionAvailable` BOOLEAN NOT NULL DEFAULT false,
    `individualTuitionAvailable` BOOLEAN NOT NULL DEFAULT false,
    `demoClassAvailable` BOOLEAN NOT NULL DEFAULT false,
    `teachingRadiusKm` INTEGER NULL,
    `feeMin` INTEGER NULL,
    `feeMax` INTEGER NULL,
    `contactPreference` ENUM('PLATFORM_ONLY', 'PHONE', 'WHATSAPP') NOT NULL DEFAULT 'PLATFORM_ONLY',
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `profileViews` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TeacherProfile_userId_key`(`userId`),
    UNIQUE INDEX `TeacherProfile_slug_key`(`slug`),
    INDEX `TeacherProfile_city_idx`(`city`),
    INDEX `TeacherProfile_isPublished_idx`(`isPublished`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subject` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Subject_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Grade_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Board` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Board_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Language` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Language_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TeacherProfile` ADD CONSTRAINT `TeacherProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
