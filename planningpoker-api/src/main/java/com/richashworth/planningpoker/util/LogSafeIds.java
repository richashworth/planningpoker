package com.richashworth.planningpoker.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Produces short, deterministic, non-reversible identifiers for log correlation. Used instead of
 * raw session IDs or usernames so logs carry no PII.
 *
 * <p>NOTE on reversibility: SHA-256 on an 8-char session ID is theoretically brute-forceable
 * offline, but session IDs are ephemeral (evicted after 24h idle) and contain no user data. This
 * residual risk is explicitly accepted (see phase 13 threat model T-13-04).
 */
public final class LogSafeIds {

  private static final String EMPTY_MARKER = "none";
  private static final int HASH_PREFIX_CHARS = 8;

  private LogSafeIds() {}

  /**
   * Returns the first 8 hex chars of SHA-256(value), or "none" if value is null/empty. Safe to log:
   * non-reversible, stable across calls, short enough for grep-friendly correlation.
   */
  public static String hash(String value) {
    if (value == null || value.isEmpty()) {
      return EMPTY_MARKER;
    }
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      byte[] digest = md.digest(value.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder(HASH_PREFIX_CHARS);
      for (int i = 0; i < HASH_PREFIX_CHARS / 2; i++) {
        sb.append(String.format("%02x", digest[i]));
      }
      return sb.toString();
    } catch (NoSuchAlgorithmException e) {
      // SHA-256 is guaranteed by the JRE; this is unreachable.
      throw new IllegalStateException("SHA-256 not available", e);
    }
  }
}
