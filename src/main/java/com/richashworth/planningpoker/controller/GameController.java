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
    public void validateSession(
            @RequestParam(name = "sessionId") String sessionId) {

        if (!sessionManager.isSessionLive(sessionId)) {
            throw new IllegalArgumentException("session not found");
        }
    }

    @RequestMapping("createSession")
    public int createSession() {
        return sessionManager.createSession();
    }

}
