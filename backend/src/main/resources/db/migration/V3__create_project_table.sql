CREATE TABLE project (
    id BIGINT NOT NULL AUTO_INCREMENT,
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    technologies VARCHAR(1000) NULL,
    background_image_path VARCHAR(500) NULL,
    demo_video_path VARCHAR(500) NULL,
    github_url VARCHAR(2048) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_project PRIMARY KEY (id),
    INDEX idx_project_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
