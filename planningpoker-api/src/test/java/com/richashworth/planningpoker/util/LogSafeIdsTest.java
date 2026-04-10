package com.richashworth.planningpoker.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class LogSafeIdsTest {

  @Test
  void testHashReturnsNoneForNull() {
    assertEquals("none", LogSafeIds.hash(null));
  }

  @Test
  void testHashReturnsNoneForEmpty() {
    assertEquals("none", LogSafeIds.hash(""));
  }

  @Test
  void testHashIsEightHexChars() {
    String result = LogSafeIds.hash("abc12345");
    assertEquals(8, result.length(), "hash should be 8 characters");
    assertTrue(result.matches("[0-9a-f]{8}"), "hash should be lowercase hex");
  }

  @Test
  void testHashIsDeterministic() {
    String first = LogSafeIds.hash("abc12345");
    String second = LogSafeIds.hash("abc12345");
    assertEquals(first, second);
  }

  @Test
  void testHashDoesNotEchoInput() {
    assertNotEquals("abc12345", LogSafeIds.hash("abc12345"));
  }

  @Test
  void testHashDiffersForDifferentInputs() {
    assertNotEquals(LogSafeIds.hash("alice"), LogSafeIds.hash("bob"));
  }
}
