CREATE TABLE skill (
    id BIGINT NOT NULL AUTO_INCREMENT,
    name VARCHAR(180) NOT NULL,
    category VARCHAR(80) NOT NULL,
    level VARCHAR(40) NOT NULL,
    icon VARCHAR(120) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_skill PRIMARY KEY (id),
    INDEX idx_skill_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE experience (
    id BIGINT NOT NULL AUTO_INCREMENT,
    position VARCHAR(180) NOT NULL,
    company VARCHAR(180) NOT NULL,
    location VARCHAR(180) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    current BOOLEAN NOT NULL,
    description TEXT NOT NULL,
    company_website VARCHAR(2048) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_experience PRIMARY KEY (id),
    INDEX idx_experience_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE education (
    id BIGINT NOT NULL AUTO_INCREMENT,
    institution VARCHAR(180) NOT NULL,
    degree VARCHAR(180) NOT NULL,
    field_of_study VARCHAR(180) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    current BOOLEAN NOT NULL,
    description TEXT NOT NULL,
    institution_website VARCHAR(2048) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT pk_education PRIMARY KEY (id),
    INDEX idx_education_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
