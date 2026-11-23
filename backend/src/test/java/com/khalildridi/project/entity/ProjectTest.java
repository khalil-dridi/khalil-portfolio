package com.khalildridi.project.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ProjectTest {
    @Test
    void createsAndUpdatesProjectDetailsWithoutChangingMediaReferences() {
        Project project = new Project("Before", "Description", "Java", "https://github.com/example/repo");
        project.setBackgroundImagePath("cover.jpg");
        project.setDemoVideoPath("demo.mp4");
        project.updateDetails("After", "New description", "Java, Angular", null);

        assertEquals("After", project.getTitle());
        assertEquals("New description", project.getDescription());
        assertEquals("Java, Angular", project.getTechnologies());
        assertNull(project.getGithubUrl());
        assertEquals("cover.jpg", project.getBackgroundImagePath());
        assertEquals("demo.mp4", project.getDemoVideoPath());
    }
}
