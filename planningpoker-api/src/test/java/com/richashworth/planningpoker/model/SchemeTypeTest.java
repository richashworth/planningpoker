package com.richashworth.planningpoker.model;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;

class SchemeTypeTest {

  @Test
  void testFibonacciValues() {
    List<String> values = SchemeType.FIBONACCI.getValues();
    assertEquals(List.of("1", "2", "3", "5", "8", "13"), values);
    assertEquals(6, values.size());
  }

  @Test
  void testTshirtValues() {
    List<String> values = SchemeType.TSHIRT.getValues();
    assertEquals(List.of("XS", "S", "M", "L", "XL", "XXL"), values);
    assertEquals(6, values.size());
  }

  @Test
  void testSimpleValues() {
    List<String> values = SchemeType.SIMPLE.getValues();
    assertEquals(List.of("1", "2", "3", "4", "5"), values);
    assertEquals(5, values.size());
  }

  @Test
  void testTimeValues() {
    List<String> values = SchemeType.TIME.getValues();
    assertEquals(List.of("1h", "½d", "1d", "2d", "1w", "2w", "1mo", "3mo", "6mo+"), values);
    assertEquals(9, values.size());
  }

  @Test
  void testFromStringCaseInsensitive() {
    assertEquals(SchemeType.FIBONACCI, SchemeType.fromString("fibonacci"));
    assertEquals(SchemeType.FIBONACCI, SchemeType.fromString("FIBONACCI"));
    assertEquals(SchemeType.TSHIRT, SchemeType.fromString("TSHIRT"));
    assertEquals(SchemeType.TSHIRT, SchemeType.fromString("tshirt"));
    assertEquals(SchemeType.SIMPLE, SchemeType.fromString("simple"));
    assertEquals(SchemeType.SIMPLE, SchemeType.fromString("SIMPLE"));
    assertEquals(SchemeType.TIME, SchemeType.fromString("time"));
    assertEquals(SchemeType.TIME, SchemeType.fromString("TIME"));
  }

  @Test
  void testFromStringBackwardCompatStoryPoints() {
    assertEquals(SchemeType.FIBONACCI, SchemeType.fromString("story_points"));
  }

  @Test
  void testFromStringBackwardCompatStoryPointsUppercase() {
    assertEquals(SchemeType.FIBONACCI, SchemeType.fromString("STORY_POINTS"));
  }

  @Test
  void testFromStringUnknownThrows() {
    assertThrows(IllegalArgumentException.class, () -> SchemeType.fromString("unknown"));
  }

  @Test
  void testFromStringCustomThrows() {
    assertThrows(IllegalArgumentException.class, () -> SchemeType.fromString("custom"));
  }

  @Test
  void testResolveFibonacciWithUnsureToggle() {
    List<String> values = SchemeType.resolveValues("fibonacci", null, true);
    List<String> expected = List.of("1", "2", "3", "5", "8", "13", "?");
    assertEquals(expected, values);
  }

  @Test
  void testResolveFibonacciNoToggles() {
    List<String> values = SchemeType.resolveValues("fibonacci", null, false);
    assertEquals(SchemeType.FIBONACCI.getValues(), values);
    assertFalse(values.contains("?"));
  }

  @Test
  void testResolveCustomValid() {
    List<String> values = SchemeType.resolveValues("custom", "S,M,L,XL", true);
    assertEquals(List.of("S", "M", "L", "XL", "?"), values);
  }

  @Test
  void testResolveCustomTrimsWhitespace() {
    List<String> values = SchemeType.resolveValues("custom", " A , B , C ", false);
    assertEquals(List.of("A", "B", "C"), values);
  }

  @Test
  void testResolveCustomRejectsTooFew() {
    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> SchemeType.resolveValues("custom", "solo", false));
    assertTrue(
        ex.getMessage().contains("at least 2"), "Expected 'at least 2' in: " + ex.getMessage());
  }

  @Test
  void testResolveCustomRejectsTooMany() {
    String csv =
        IntStream.rangeClosed(1, 21).mapToObj(Integer::toString).collect(Collectors.joining(","));
    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class, () -> SchemeType.resolveValues("custom", csv, false));
    assertTrue(
        ex.getMessage().contains("at most 20"), "Expected 'at most 20' in: " + ex.getMessage());
  }

  @Test
  void testResolveCustomRejectsTooLong() {
    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> SchemeType.resolveValues("custom", "short,12345678901", false));
    assertTrue(
        ex.getMessage().contains("exceeds max length"),
        "Expected 'exceeds max length' in: " + ex.getMessage());
  }

  @Test
  void testResolveCustomDeduplicates() {
    List<String> values = SchemeType.resolveValues("custom", "A,B,A,C", false);
    assertEquals(List.of("A", "B", "C"), values);
    assertEquals(3, values.size());
  }

  @Test
  void testResolveCustomEmptyThrows() {
    assertThrows(
        IllegalArgumentException.class, () -> SchemeType.resolveValues("custom", "", false));
  }

  @Test
  void testResolveCustomNullThrows() {
    assertThrows(
        IllegalArgumentException.class, () -> SchemeType.resolveValues("custom", null, false));
  }

  @Test
  void testResolveCustomWithUnsureAlreadyIncluded() {
    List<String> values = SchemeType.resolveValues("custom", "S,M,L,?", true);
    assertEquals(List.of("S", "M", "L", "?"), values);
    assertEquals(1, values.stream().filter("?"::equals).count());
  }

  @Test
  void testSchemeConfigRecordFields() {
    SchemeConfig config = new SchemeConfig("fibonacci", null, true);
    assertEquals("fibonacci", config.schemeType());
    assertNull(config.customValues());
    assertTrue(config.includeUnsure());
  }
}
