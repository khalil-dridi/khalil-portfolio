package com.khalildridi.career.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "skill")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Skill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "name", nullable = false, length = 180)
    private String name;
    @Column(name = "category", nullable = false, length = 80)
    private String category;
    @Column(name = "level", nullable = false, length = 40)
    private String level;
    @Column(name = "icon", nullable = false, length = 120)
    private String icon;
    @Column(name = "url", nullable = false, length = 2048)
    private String url;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Skill(String name, String category, String level, String icon, String url) {
        this.name = name;
        this.category = category;
        this.level = level;
        this.icon = icon;
        this.url = url;
    }

    public void update(String name, String category, String level, String icon, String url) {
        this.name = name;
        this.category = category;
        this.level = level;
        this.icon = icon;
        this.url = url;
    }
}
