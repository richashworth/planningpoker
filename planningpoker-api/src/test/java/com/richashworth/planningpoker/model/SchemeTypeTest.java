package com.richashworth.planningpoker.model;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

class SchemeTypeTest {

    @Test
    void testFibonacciValues() {
        List<String> values = SchemeType.FIBONACCI.getValues();
        assertEquals(List.of("0", "0.5", "1", "2", "3", "5", "8", "13", "20", "50", "100", "\u221e"), values);
        assertEquals(12, values.size());
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
    void testFromStringCaseInsensitive() {
        assertEquals(SchemeType.FIBONACCI, SchemeType.fromString("fibonacci"));
        assertEquals(SchemeType.FIBONACCI, SchemeType.fromString("FIBONACCI"));
        assertEquals(SchemeType.TSHIRT, SchemeType.fromString("TSHIRT"));
        assertEquals(SchemeType.TSHIRT, SchemeType.fromString("tshirt"));
        assertEquals(SchemeType.SIMPLE, SchemeType.fromString("simple"));
        assertEquals(SchemeType.SIMPLE, SchemeType.fromString("SIMPLE"));
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
    void testResolveFibonacciWithBothToggles() {
        List<String> values = SchemeType.resolveValues("fibonacci", null, true, true);
        List<String> expected = List.of("0", "0.5", "1", "2", "3", "5", "8", "13", "20", "50", "100", "\u221e", "?", "\u2615");
        assertEquals(expected, values);
    }

    @Test
    void testResolveFibonacciNoToggles() {
        List<String> values = SchemeType.resolveValues("fibonacci", null, false, false);
        assertEquals(SchemeType.FIBONACCI.getValues(), values);
        assertFalse(values.contains("?"));
        assertFalse(values.contains("\u2615"));
    }

    @Test
    void testResolveCustomValid() {
        List<String> values = SchemeType.resolveValues("custom", "S,M,L,XL", true, false);
        assertEquals(List.of("S", "M", "L", "XL", "?"), values);
    }

    @Test
    void testResolveCustomTrimsWhitespace() {
        List<String> values = SchemeType.resolveValues("custom", " A , B , C ", false, false);
        assertEquals(List.of("A", "B", "C"), values);
    }

    @Test
    void testResolveCustomRejectsTooFew() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> SchemeType.resolveValues("custom", "solo", false, false));
        assertTrue(ex.getMessage().contains("at least 2"), "Expected 'at least 2' in: " + ex.getMessage());
    }

    @Test
    void testResolveCustomRejectsTooMany() {
        String csv = IntStream.rangeClosed(1, 21)
                .mapToObj(Integer::toString)
                .collect(Collectors.joining(","));
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> SchemeType.resolveValues("custom", csv, false, false));
        assertTrue(ex.getMessage().contains("at most 20"), "Expected 'at most 20' in: " + ex.getMessage());
    }

    @Test
    void testResolveCustomRejectsTooLong() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> SchemeType.resolveValues("custom", "short,12345678901", false, false));
        assertTrue(ex.getMessage().contains("exceeds max length"), "Expected 'exceeds max length' in: " + ex.getMessage());
    }

    @Test
    void testResolveCustomDeduplicates() {
        List<String> values = SchemeType.resolveValues("custom", "A,B,A,C", false, false);
        assertEquals(List.of("A", "B", "C"), values);
        assertEquals(3, values.size());
    }

    @Test
    void testResolveCustomEmptyThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> SchemeType.resolveValues("custom", "", false, false));
    }

    @Test
    void testResolveCustomNullThrows() {
        assertThrows(IllegalArgumentException.class,
                () -> SchemeType.resolveValues("custom", null, false, false));
    }

    @Test
    void testSchemeConfigRecordFields() {
        SchemeConfig config = new SchemeConfig("fibonacci", null, true, true);
        assertEquals("fibonacci", config.schemeType());
        assertNull(config.customValues());
        assertTrue(config.includeUnsure());
        assertTrue(config.includeCoffee());
    }
}
