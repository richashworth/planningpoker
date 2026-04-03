package com.richashworth.planningpoker.controller;

import com.google.common.collect.Multimaps;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.MessagingUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import static com.richashworth.planningpoker.service.SessionManager.SESSION_SEQ_START_VALUE;
import static com.richashworth.planningpoker.util.CollectionUtils.containsIgnoreCase;

@RestController
@CrossOrigin(origins = "*")
public class GameController {

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private final SessionManager sessionManager;
    private final MessagingUtils messagingUtils;

    public GameController(SessionManager sessionManager, MessagingUtils messagingUtils) {
        this.sessionManager = sessionManager;
        this.messagingUtils = messagingUtils;
    }

    @PostMapping("joinSession")
    public void joinSession(
            @RequestParam(name = "sessionId") final Long sessionId,
            @RequestParam(name = "userName") final String userName
    ) {
        if (sessionId < SESSION_SEQ_START_VALUE || !sessionManager.isSessionActive(sessionId)) {
            throw new IllegalArgumentException("session not found");
        } else if (containsIgnoreCase(sessionManager.getSessionUsers(sessionId), userName)) {
            throw new IllegalArgumentException("user exists");
        } else {
            sessionManager.registerUser(userName, sessionId);
            logger.info(userName + " has joined session " + sessionId);
            messagingUtils.burstUsersMessages(sessionId);
        }
    }

    @PostMapping("createSession")
    public long createSession(
            @RequestParam(name = "userName") final String userName
    ) {
        final long sessionId = sessionManager.createSession();
        sessionManager.registerUser(userName, sessionId);
        logger.info(userName + " has created session " + sessionId);
        messagingUtils.burstUsersMessages(sessionId);
        return sessionId;
    }

    @PostMapping("logout")
    public void leaveSession(
            @RequestParam(name = "userName") final String userName,
            @RequestParam(name = "sessionId") final Long sessionId
    ) {
        sessionManager.removeUser(userName, sessionId);
        logger.info(userName + " has left session " + sessionId);
        messagingUtils.burstUsersMessages(sessionId);
        messagingUtils.burstResultsMessages(sessionId);
    }

    @GetMapping("refresh")
    public void refresh(
            @RequestParam(name = "sessionId") final Long sessionId
    ) {
        messagingUtils.sendResultsMessage(sessionId);
        messagingUtils.sendUsersMessage(sessionId);
    }

    @GetMapping("sessionUsers")
    public List<String> getSessionUsers(
            @RequestParam(name = "sessionId") final Long sessionId
    ) {
        return sessionManager.getSessionUsers(sessionId);
    }

    @GetMapping("sessions")
    public Map<Long, List<String>> getSessions() {
        return Multimaps.asMap(sessionManager.getSessions());
    }

    @PostMapping("reset")
    public void reset(
            @RequestParam(name = "sessionId") final Long sessionId,
            @RequestParam(name = "userName") final String userName
    ) {
        logger.info(userName + " has reset session " + sessionId);
        synchronized (sessionManager) {
            sessionManager.resetSession(sessionId);
            messagingUtils.burstResultsMessages(sessionId);
        }
    }
}
