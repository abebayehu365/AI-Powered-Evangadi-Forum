CREATE TABLE IF NOT EXISTS `ratings` (
    `rating_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `item_type` ENUM('question', 'answer') NOT NULL,
    `item_id` INT NOT NULL,
    `score` TINYINT NOT NULL COMMENT '1-5 star rating',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `chk_star_score` CHECK (`score` BETWEEN 1 AND 5),
    UNIQUE KEY `uniq_user_item_rating` (`user_id`, `item_type`, `item_id`),
    INDEX `idx_item_ratings` (`item_type`, `item_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
