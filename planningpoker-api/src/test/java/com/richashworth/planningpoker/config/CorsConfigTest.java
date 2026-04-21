package com.richashworth.planningpoker.config;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.servlet.config.annotation.CorsRegistration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

class CorsConfigTest {

  private CorsRegistration applyOrigins(String configured) {
    CorsConfig config = new CorsConfig();
    ReflectionTestUtils.setField(config, "allowedOrigins", configured);

    CorsRegistry registry = mock(CorsRegistry.class);
    CorsRegistration registration = mock(CorsRegistration.class);
    when(registry.addMapping(any())).thenReturn(registration);
    when(registration.allowedOrigins(any(String[].class))).thenReturn(registration);
    when(registration.allowedMethods(any(String[].class))).thenReturn(registration);

    config.addCorsMappings(registry);
    return registration;
  }

  @Test
  void trimsWhitespaceAroundCommaSeparatedOrigins() {
    CorsRegistration registration = applyOrigins("http://a.com, http://b.com , http://c.com");
    ArgumentCaptor<String[]> captor = ArgumentCaptor.forClass(String[].class);
    verify(registration).allowedOrigins(captor.capture());
    assertArrayEquals(
        new String[] {"http://a.com", "http://b.com", "http://c.com"}, captor.getValue());
  }

  @Test
  void filtersEmptyEntriesFromOrigins() {
    CorsRegistration registration = applyOrigins("http://a.com,,  ,http://b.com");
    ArgumentCaptor<String[]> captor = ArgumentCaptor.forClass(String[].class);
    verify(registration).allowedOrigins(captor.capture());
    assertArrayEquals(new String[] {"http://a.com", "http://b.com"}, captor.getValue());
  }

  @Test
  void wildcardPassesThroughUnchanged() {
    CorsRegistration registration = applyOrigins("*");
    ArgumentCaptor<String[]> captor = ArgumentCaptor.forClass(String[].class);
    verify(registration).allowedOrigins(captor.capture());
    assertArrayEquals(new String[] {"*"}, captor.getValue());
  }
}
