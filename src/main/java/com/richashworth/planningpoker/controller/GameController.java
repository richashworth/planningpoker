package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.model.SessionManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Created by rich on 09/04/2016.
 */
@RestController
public class GameController {

    private final SessionManager sessionManager;

    @Autowired
    public GameController(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @RequestMapping("validateSession")
    public void validateSessionId(
            @RequestParam(name = "sessionId") String sessionId) {
        System.out.println("called with id "+sessionId);

        if (!sessionManager.isSessionLive(sessionId)) {
            System.out.println("returning 404...");
            throw new IllegalArgumentException("session not found");
        }
    }

}
