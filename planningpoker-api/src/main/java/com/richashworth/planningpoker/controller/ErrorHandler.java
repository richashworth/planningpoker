package com.richashworth.planningpoker.controller;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

@ControllerAdvice
public class ErrorHandler {

  private final Logger logger = LoggerFactory.getLogger(getClass());

  @ExceptionHandler(HostActionException.class)
  public ResponseEntity<Map<String, String>> handleForbidden(HostActionException e) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, String>> handleBadRequest(IllegalArgumentException e) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
  }

  @ExceptionHandler(Exception.class)
  @ResponseBody
  @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
  public Map<String, String> handleGenericException(Exception e, HttpServletRequest request) {
    logger.error("Unexpected error on {} {}", request.getMethod(), request.getRequestURI(), e);
    return Collections.singletonMap("error", "Internal server error");
  }
}
