CREATE TABLE profile (
    id BIGINT NOT NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    professional_title VARCHAR(180) NULL,
    biography TEXT NULL,
    email VARCHAR(254) NULL,
    phone VARCHAR(50) NULL,
    location VARCHAR(180) NULL,
    profile_image_path VARCHAR(255) NULL,
    resume_url VARCHAR(2048) NULL,
    github_url VARCHAR(2048) NULL,
    linkedin_url VARCHAR(2048) NULL,
    availability BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_profile PRIMARY KEY (id),
    CONSTRAINT chk_profile_singleton CHECK (id = 1),
    INDEX idx_profile_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO profile (id, availability) VALUES (1, FALSE);
