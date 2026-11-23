package com.khalildridi.profile.mapper;

import com.khalildridi.profile.entity.Profile;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.lang.reflect.Constructor;
import static org.assertj.core.api.Assertions.assertThat;

class ProfileMapperTest {
    private Profile profile() throws Exception { Constructor<Profile> c=Profile.class.getDeclaredConstructor(); c.setAccessible(true); Profile p=c.newInstance(); ReflectionTestUtils.setField(p,"id",1L); return p; }
    @Test void mapsPublicFieldsAndNeverExposesInternalFields() throws Exception {
        Profile p=profile(); p.update("Ada","Lovelace","Engineer","Bio","ada@example.com","123","London","https://cv.test","https://github.com/a","https://linkedin.com/a",true);
        var dto=new ProfileMapper().toPublic(p);
        assertThat(dto.firstName()).isEqualTo("Ada"); assertThat(dto.profileImageUrl()).isNull(); assertThat(dto.availability()).isTrue();
        assertThat(java.util.Arrays.stream(dto.getClass().getRecordComponents()).map(java.lang.reflect.RecordComponent::getName)).doesNotContain("id","createdAt","updatedAt","profileImagePath");
    }
    @Test void mapsAdminImageReferenceAndNullFields() throws Exception {
        Profile p=profile(); p.setProfileImagePath("private-name.png");
        var admin=new ProfileMapper().toAdmin(p); var pub=new ProfileMapper().toPublic(p);
        assertThat(admin.profileImageUrl()).isEqualTo("/api/profile/image"); assertThat(pub.profileImageUrl()).isEqualTo("/api/profile/image");
        assertThat(pub.firstName()).isNull(); assertThat(pub.availability()).isFalse(); assertThat(admin.id()).isEqualTo(1L);
    }
}
