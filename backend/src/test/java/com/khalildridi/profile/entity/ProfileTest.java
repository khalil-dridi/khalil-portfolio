package com.khalildridi.profile.entity;

import org.junit.jupiter.api.Test;
import java.lang.reflect.Constructor;
import static org.assertj.core.api.Assertions.assertThat;

class ProfileTest {
    private Profile profile() throws Exception { Constructor<Profile> c=Profile.class.getDeclaredConstructor(); c.setAccessible(true); return c.newInstance(); }
    @Test void updatesProvidedFieldsAndLeavesNullFieldsUnchanged() throws Exception {
        Profile p=profile(); p.update("Ada","Lovelace","Engineer","Bio","ada@example.com","123","London","https://cv.test","https://github.com/a","https://linkedin.com/a",true);
        p.update("Augusta",null,null,null,null,null,null,null,null,null,null);
        assertThat(p.getFirstName()).isEqualTo("Augusta"); assertThat(p.getLastName()).isEqualTo("Lovelace");
        assertThat(p.getEmail()).isEqualTo("ada@example.com"); assertThat(p.isAvailability()).isTrue();
    }
    @Test void imagePathCanBeSetAndCleared() throws Exception {
        Profile p=profile(); p.setProfileImagePath("generated.png"); assertThat(p.getProfileImagePath()).isEqualTo("generated.png");
        p.setProfileImagePath(null); assertThat(p.getProfileImagePath()).isNull();
    }
}
