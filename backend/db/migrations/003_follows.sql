-- Migration 003: User Follows
-- Adds follows table for user follow/follower relationships.
-- Run this once against your existing database.

CREATE TABLE IF NOT EXISTS `follows` (
    `follow_id`    INT AUTO_INCREMENT PRIMARY KEY,
    `follower_id`  INT NOT NULL COMMENT 'The user who is following',
    `following_id` INT NOT NULL COMMENT 'The user being followed',
    `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- A user cannot follow the same person twice
    UNIQUE KEY `uniq_follower_following` (`follower_id`, `following_id`),

    -- A user cannot follow themselves (enforced in service layer too)
    CONSTRAINT `chk_no_self_follow` CHECK (`follower_id` != `following_id`),

    FOREIGN KEY (`follower_id`)  REFERENCES `users`(`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`following_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,

    INDEX `idx_follows_follower_id`  (`follower_id`),
    INDEX `idx_follows_following_id` (`following_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
