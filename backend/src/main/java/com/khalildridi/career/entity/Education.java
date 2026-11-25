package com.khalildridi.career.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "education")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Education {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "institution", length = 180)
    private String institution;
    @Column(name = "degree", length = 180)
    private String degree;
    @Column(name = "field_of_study", length = 180)
    private String fieldOfStudy;
    @Column(name = "start_date")
    private LocalDate startDate;
    @Column(name = "end_date")
    private LocalDate endDate;
    @Column(name = "current")
    private Boolean current;
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    @Column(name = "institution_website", length = 2048)
    private String institutionWebsite;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Education(String institution, String degree, String fieldOfStudy, LocalDate startDate, LocalDate endDate, Boolean current, String description, String institutionWebsite) {
        this.institution = institution;
        this.degree = degree;
        this.fieldOfStudy = fieldOfStudy;
        this.startDate = startDate;
        this.endDate = endDate;
        this.current = current;
        this.description = description;
        this.institutionWebsite = institutionWebsite;
    }

    public void update(String institution, String degree, String fieldOfStudy, LocalDate startDate, LocalDate endDate, Boolean current, String description, String institutionWebsite) {
        this.institution = institution;
        this.degree = degree;
        this.fieldOfStudy = fieldOfStudy;
        this.startDate = startDate;
        this.endDate = endDate;
        this.current = current;
        this.description = description;
        this.institutionWebsite = institutionWebsite;
    }
}
