-- ==========================================
-- ADMIN USER
-- ==========================================

CREATE TABLE admin_user (
                            id BIGINT NOT NULL AUTO_INCREMENT,
                            email VARCHAR(254) NOT NULL,
                            password_hash VARCHAR(255) NOT NULL,
                            enabled BOOLEAN NOT NULL DEFAULT TRUE,
                            last_login_at DATETIME(6) NULL,
                            created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                            updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

                            CONSTRAINT pk_admin_user PRIMARY KEY (id),
                            CONSTRAINT uk_admin_user_email UNIQUE (email)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;


-- ==========================================
-- REFRESH TOKEN
-- ==========================================

CREATE TABLE refresh_token (
                               id BIGINT NOT NULL AUTO_INCREMENT,
                               admin_user_id BIGINT NOT NULL,
                               token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
                               family_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
                               created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                               expires_at DATETIME(6) NOT NULL,
                               revoked_at DATETIME(6) NULL,

                               CONSTRAINT pk_refresh_token PRIMARY KEY (id),

                               CONSTRAINT uk_refresh_token_hash UNIQUE (token_hash),

                               CONSTRAINT fk_refresh_token_admin
                                   FOREIGN KEY (admin_user_id)
                                       REFERENCES admin_user(id)
                                       ON DELETE CASCADE,

                               CONSTRAINT chk_refresh_token_expiry
                                   CHECK (expires_at > created_at),

                               INDEX idx_refresh_token_admin_expires (admin_user_id, expires_at),
                               INDEX idx_refresh_token_family (family_id)

) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_0900_ai_ci;