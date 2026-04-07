package com.richashworth.planningpoker.controller;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ErrorHandlerTest {

    private final ErrorHandler errorHandler = new ErrorHandler();

    @Test
    void testHandleForbidden() {
        HostActionException exception = new HostActionException("only the host can perform this action");
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
        Map<String, String> body = errorHandler.handleGenericException(exception);
        assertNotNull(body.get("error"));
    }
}
