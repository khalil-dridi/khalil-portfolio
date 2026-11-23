package com.khalildridi.project.repository;

import com.khalildridi.project.entity.Project;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.TestPropertySource;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@TestPropertySource(properties={"spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"})
class ProjectRepositoryTest {
    @Autowired ProjectRepository repository;
    @Autowired JdbcTemplate jdbc;

    @Test void persistsFindsOrdersAndDeletesProjects() {
        jdbc.update("INSERT INTO project (title, description, created_at, updated_at) VALUES (?, ?, ?, ?)",
                "Older", "Description", java.sql.Timestamp.valueOf("2024-01-01 00:00:00"), java.sql.Timestamp.valueOf("2024-01-01 00:00:00"));
        jdbc.update("INSERT INTO project (title, description, technologies, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
                "Newer", "Description", "Java", java.sql.Timestamp.valueOf("2025-01-01 00:00:00"), java.sql.Timestamp.valueOf("2025-01-01 00:00:00"));
        Project older = repository.findAllByOrderByCreatedAtDesc().get(1);
        Project newer = repository.findAllByOrderByCreatedAtDesc().getFirst();

        assertTrue(repository.existsById(older.getId()));
        assertEquals("Older", repository.findById(older.getId()).orElseThrow().getTitle());
        assertEquals(newer.getId(), repository.findAllByOrderByCreatedAtDesc().getFirst().getId());
        repository.delete(older);
        assertFalse(repository.existsById(older.getId()));
        assertTrue(repository.findById(999L).isEmpty());
    }
}
