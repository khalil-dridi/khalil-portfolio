package com.khalildridi.career.repository;

import com.khalildridi.career.entity.Education;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EducationRepository extends JpaRepository<Education, Long> {
    List<Education> findAllByOrderByIdAsc();
}
