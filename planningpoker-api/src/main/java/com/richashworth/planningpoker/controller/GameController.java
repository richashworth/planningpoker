package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.MessagingUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import static com.richashworth.planningpoker.util.CollectionUtils.containsIgnoreCase;

@RestController
@CrossOrigin(origins = "*")
public class GameController {

    private static final int MAX_USERNAME_LENGTH = 20;
    private static final int MIN_USERNAME_LENGTH = 3;
    private static final String USERNAME_PATTERN = "^[a-zA-Z0-9 _-]+$";

    private final Logger logger = LoggerFactory.getLogger(getClass());
    private final SessionManager sessionManager;
    private final MessagingUtils messagingUtils;

    public GameController(SessionManager sessionManager, MessagingUtils messagingUtils) {
        this.sessionManager = sessionManager;
        this.messagingUtils = messagingUtils;
    }

    @PostMapping("joinSession")
    public void joinSession(
            @RequestParam(name = "sessionId") final String sessionId,
            @RequestParam(name = "userName") final String userName
    ) {
        validateUserName(userName);
        if (!sessionManager.isSessionActive(sessionId)) {
            throw new IllegalArgumentException("session not found");
        } else if (containsIgnoreCase(sessionManager.getSessionUsers(sessionId), userName)) {
            throw new IllegalArgumentException("user exists");
        } else {
            sessionManager.registerUser(userName, sessionId);
            logger.info("{} has joined session {}", userName, sessionId);
            messagingUtils.burstUsersMessages(sessionId);
        }
    }

    @PostMapping("createSession")
    public String createSession(
            @RequestParam(name = "userName") final String userName
    ) {
        validateUserName(userName);
        final String sessionId = sessionManager.createSession();
        sessionManager.registerUser(userName, sessionId);
        logger.info("{} has created session {}", userName, sessionId);
        messagingUtils.burstUsersMessages(sessionId);
        return sessionId;
    }

    @PostMapping("logout")
    public void leaveSession(
            @RequestParam(name = "userName") final String userName,
            @RequestParam(name = "sessionId") final String sessionId
    ) {
        validateSessionMembership(sessionId, userName);
        sessionManager.removeUser(userName, sessionId);
        logger.info("{} has left session {}", userName, sessionId);
        messagingUtils.burstUsersMessages(sessionId);
        messagingUtils.burstResultsMessages(sessionId);
    }

    @GetMapping("refresh")
    public void refresh(
            @RequestParam(name = "sessionId") final String sessionId
    ) {
        messagingUtils.sendResultsMessage(sessionId);
        messagingUtils.sendUsersMessage(sessionId);
    }

    @GetMapping("sessionUsers")
    public List<String> getSessionUsers(
            @RequestParam(name = "sessionId") final String sessionId
    ) {
        return sessionManager.getSessionUsers(sessionId);
    }

    @PostMapping("reset")
    public void reset(
            @RequestParam(name = "sessionId") final String sessionId,
            @RequestParam(name = "userName") final String userName
    ) {
        validateSessionMembership(sessionId, userName);
        logger.info("{} has reset session {}", userName, sessionId);
        synchronized (sessionManager) {
            sessionManager.resetSession(sessionId);
            messagingUtils.burstResultsMessages(sessionId);
        }
    }

    private void validateUserName(String userName) {
        if (userName == null || userName.length() < MIN_USERNAME_LENGTH || userName.length() > MAX_USERNAME_LENGTH) {
            throw new IllegalArgumentException("username must be between " + MIN_USERNAME_LENGTH + " and " + MAX_USERNAME_LENGTH + " characters");
        }
        if (!userName.matches(USERNAME_PATTERN)) {
            throw new IllegalArgumentException("username contains invalid characters");
        }
    }

    private void validateSessionMembership(String sessionId, String userName) {
        if (!sessionManager.isSessionActive(sessionId)) {
            throw new IllegalArgumentException("session not found");
        }
        if (!containsIgnoreCase(sessionManager.getSessionUsers(sessionId), userName)) {
            throw new IllegalArgumentException("user is not a member of this session");
        }
    }
}
