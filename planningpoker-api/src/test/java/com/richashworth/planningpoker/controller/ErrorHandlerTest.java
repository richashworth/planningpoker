package com.richashworth.planningpoker.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

class ErrorHandlerTest {

  private final ErrorHandler errorHandler = new ErrorHandler();

  @Test
  void testHandleForbidden() {
    HostActionException exception =
        new HostActionException("only the host can perform this action");
    ResponseEntity<Map<String, String>> response = errorHandler.handleForbidden(exception);
    assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
    assertEquals("only the host can perform this action", response.getBody().get("error"));
  }

  @Test
  void testHandleBadRequestStillReturns400() {
    IllegalArgumentException exception = new IllegalArgumentException("invalid input");
    ResponseEntity<Map<String, String>> response = errorHandler.handleBadRequest(exception);
    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    assertEquals("invalid input", response.getBody().get("error"));
  }

  @Test
  void testHandleGenericExceptionReturns500WithErrorBody() {
    RuntimeException exception = new RuntimeException("unexpected");
    HttpServletRequest request = mock(HttpServletRequest.class);
    when(request.getMethod()).thenReturn("POST");
    when(request.getRequestURI()).thenReturn("/vote");
    Map<String, String> body = errorHandler.handleGenericException(exception, request);
    assertNotNull(body.get("error"));
    assertEquals("Internal server error", body.get("error"));
  }
}
