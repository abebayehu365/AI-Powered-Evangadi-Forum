-- Migration 001: Answer Ratings
-- Adds answer_ratings table for upvote/downvote on answers.
-- Run this once against your existing database.

CREATE TABLE IF NOT EXISTS `answer_ratings` (
    `rating_id`   INT AUTO_INCREMENT PRIMARY KEY,
    `answer_id`   INT NOT NULL,
    `user_id`     INT NOT NULL,
    `value`       TINYINT NOT NULL DEFAULT 1 COMMENT '1 = upvote, -1 = downvote',
    `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `chk_rating_value` CHECK (`value` IN (1, -1)),
    UNIQUE KEY `uniq_answer_user_rating` (`answer_id`, `user_id`),

    FOREIGN KEY (`answer_id`) REFERENCES `answers`(`answer_id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`)   REFERENCES `users`(`user_id`)   ON DELETE CASCADE,

    INDEX `idx_answer_ratings_answer_id` (`answer_id`),
    INDEX `idx_answer_ratings_user_id`   (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
