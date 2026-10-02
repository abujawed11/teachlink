-- AlterTable
ALTER TABLE `language` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `teacherprofile` ADD COLUMN `isHiddenByAdmin` BOOLEAN NOT NULL DEFAULT false;
