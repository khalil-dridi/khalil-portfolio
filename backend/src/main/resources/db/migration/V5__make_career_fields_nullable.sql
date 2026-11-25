ALTER TABLE skill
    MODIFY name VARCHAR(180) NULL,
    MODIFY category VARCHAR(80) NULL,
    MODIFY level VARCHAR(40) NULL,
    MODIFY icon VARCHAR(120) NULL,
    MODIFY url VARCHAR(2048) NULL;

ALTER TABLE experience
    MODIFY position VARCHAR(180) NULL,
    MODIFY company VARCHAR(180) NULL,
    MODIFY location VARCHAR(180) NULL,
    MODIFY start_date DATE NULL,
    MODIFY end_date DATE NULL,
    MODIFY current BOOLEAN NULL,
    MODIFY description TEXT NULL,
    MODIFY company_website VARCHAR(2048) NULL;

ALTER TABLE education
    MODIFY institution VARCHAR(180) NULL,
    MODIFY degree VARCHAR(180) NULL,
    MODIFY field_of_study VARCHAR(180) NULL,
    MODIFY start_date DATE NULL,
    MODIFY end_date DATE NULL,
    MODIFY current BOOLEAN NULL,
    MODIFY description TEXT NULL,
    MODIFY institution_website VARCHAR(2048) NULL;
