-- Migration 002: Content Reports
-- Adds reports table for flagging questions or answers.
-- Run this once against your existing database.

CREATE TABLE IF NOT EXISTS `reports` (
    `report_id`   INT AUTO_INCREMENT PRIMARY KEY,
    `reporter_id` INT NOT NULL,
    `target_type` ENUM('question', 'answer') NOT NULL,
    `target_id`   INT NOT NULL,
    `reason`      ENUM(
                    'spam',
                    'offensive',
                    'misinformation',
                    'off_topic',
                    'plagiarism',
                    'other'
                  ) NOT NULL,
    `description` TEXT NULL,
    `status`      ENUM('pending', 'reviewed', 'dismissed', 'actioned') NOT NULL DEFAULT 'pending',
    `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (`reporter_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,

    -- Prevent the same user from reporting the same content twice
    UNIQUE KEY `uniq_reporter_target` (`reporter_id`, `target_type`, `target_id`),

    INDEX `idx_reports_reporter_id`  (`reporter_id`),
    INDEX `idx_reports_target`       (`target_type`, `target_id`),
    INDEX `idx_reports_status`       (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
