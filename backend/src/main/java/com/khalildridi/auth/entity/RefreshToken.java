package com.khalildridi.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AccessLevel;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "refresh_token")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "admin_user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_refresh_token_admin")
    )
    private AdminUser adminUser;

    @Column(name = "token_hash", nullable = false, length = 64, unique = true, columnDefinition = "CHAR(64)")
    private String tokenHash;

    @Column(name = "family_id", nullable = false, length = 36, columnDefinition = "CHAR(36)")
    private String familyId;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    public RefreshToken(
            AdminUser adminUser,
            String tokenHash,
            String familyId,
            LocalDateTime expiresAt
    ) {
        this.adminUser = adminUser;
        this.tokenHash = tokenHash;
        this.familyId = familyId;
        this.expiresAt = expiresAt;
    }

    public void revoke() {
        this.revokedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }
}
