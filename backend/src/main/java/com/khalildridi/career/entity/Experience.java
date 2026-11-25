package com.khalildridi.career.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "experience")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Experience {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "position", nullable = false, length = 180)
    private String position;
    @Column(name = "company", nullable = false, length = 180)
    private String company;
    @Column(name = "location", nullable = false, length = 180)
    private String location;
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
    @Column(name = "current", nullable = false)
    private Boolean current;
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;
    @Column(name = "company_website", nullable = false, length = 2048)
    private String companyWebsite;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Experience(String position, String company, String location, LocalDate startDate, LocalDate endDate, Boolean current, String description, String companyWebsite) {
        this.position = position;
        this.company = company;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.current = current;
        this.description = description;
        this.companyWebsite = companyWebsite;
    }

    public void update(String position, String company, String location, LocalDate startDate, LocalDate endDate, Boolean current, String description, String companyWebsite) {
        this.position = position;
        this.company = company;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.current = current;
        this.description = description;
        this.companyWebsite = companyWebsite;
    }
}
