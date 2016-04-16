package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.service.SessionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

/**
 * Created by rich on 09/04/2016.
 */
@RestController
public class GameController {

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private final SessionManager sessionManager;

    @Autowired
    public GameController(SessionManager sessionManager) {
        this.sessionManager = sessionManager;
    }

    @RequestMapping("validateSession")
    public void validateSession(
            @RequestParam(name = "sessionId") Integer sessionId,
            @RequestParam(name = "userName") String userName
    ) {
        if (!sessionManager.isSessionLive(sessionId)) {
            throw new IllegalArgumentException("session not found");
        } else {
            logger.info(userName + " has joined session " + sessionId);
        }
    }

    @RequestMapping("createSession")
    public long createSession(
            @RequestParam(name = "userName") String userName
    ) {
        final long sessionId = sessionManager.createSession();
        logger.info(userName + " has created session " + sessionId);
        return sessionId;
    }

    @RequestMapping("reset")
    public void reset(
            @RequestParam(name = "sessionId") Integer sessionId,
            @RequestParam(name = "userName") String userName
    ) {
        logger.info(userName + " has reset session " + sessionId);
        sessionManager.clearSession(sessionId);
    }

    @RequestMapping("results")
    public List<Estimate> results(@RequestParam(name = "sessionId") int sessionId) {
        List<Estimate> results = new ArrayList<>(sessionManager.getResults(sessionId));
        return results;
    }
}
