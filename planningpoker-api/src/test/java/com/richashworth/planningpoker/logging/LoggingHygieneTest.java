package com.richashworth.planningpoker.logging;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

/**
 * LOG-02 regression guard: no raw session ID, username, or vote value may appear in logger.info /
 * logger.warn / logger.error calls under src/main/java.
 *
 * <p>Wrapped calls like {@code LogSafeIds.hash(sessionId)} are allowed. logger.debug is exempt
 * (hot-path troubleshooting).
 *
 * <p>The scan joins multi-line logger statements before checking their argument list so that
 * callers split across several lines (a common style in this codebase) are not a blind spot.
 */
class LoggingHygieneTest {

  private static final Path SRC_ROOT = Paths.get("src/main/java/com/richashworth/planningpoker");

  /** Start of a forbidden-level logger call. We then walk forward to the matching ");". */
  private static final Pattern LOGGER_START = Pattern.compile("logger\\.(info|warn|error)\\s*\\(");

  private static final String[] FORBIDDEN =
      new String[] {"sessionId", "userName", "targetUser", "estimateValue"};

  @Test
  void testNoRawPiiInInfoWarnErrorLogs() throws IOException {
    List<String> violations = new ArrayList<>();
    try (Stream<Path> paths = Files.walk(SRC_ROOT)) {
      paths
          .filter(p -> p.toString().endsWith(".java"))
          .forEach(
              p -> {
                try {
                  scanFile(p, violations);
                } catch (IOException e) {
                  throw new RuntimeException(e);
                }
              });
    }
    assertTrue(
        violations.isEmpty(),
        "Raw PII found in logger.info/warn/error calls (LOG-02 violation):\n"
            + String.join("\n", violations));
  }

  private static void scanFile(Path p, List<String> violations) throws IOException {
    List<String> lines = Files.readAllLines(p);
    for (int i = 0; i < lines.size(); i++) {
      Matcher start = LOGGER_START.matcher(lines.get(i));
      if (!start.find()) continue;
      // Collect the full call text from the '(' after the matched start through the matching ')'.
      int openIdx = start.end() - 1; // index of '('
      StringBuilder buf = new StringBuilder();
      buf.append(lines.get(i).substring(openIdx + 1));
      int depth = 1;
      int endLine = i;
      while (depth > 0 && endLine < lines.size()) {
        String segment = (endLine == i) ? lines.get(i).substring(openIdx + 1) : lines.get(endLine);
        if (endLine != i) {
          buf.append(' ').append(segment);
        }
        for (int c = 0; c < segment.length(); c++) {
          char ch = segment.charAt(c);
          if (ch == '(') depth++;
          else if (ch == ')') {
            depth--;
            if (depth == 0) break;
          }
        }
        if (depth > 0) endLine++;
      }
      String args = buf.toString();
      // Strip every LogSafeIds.hash(...) expression before checking for forbidden bare names.
      String scrubbed = args.replaceAll("LogSafeIds\\.hash\\([^)]*\\)", "HASHED");
      for (String bad : FORBIDDEN) {
        if (scrubbed.matches("(?s).*\\b" + bad + "\\b.*")) {
          violations.add(p + ":" + (i + 1) + " -> " + lines.get(i).trim());
          break;
        }
      }
    }
  }
}
