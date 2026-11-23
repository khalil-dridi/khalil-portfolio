package com.khalildridi.profile.repository;

import com.khalildridi.profile.entity.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, Long> { }
