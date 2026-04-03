package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.MessagingUtils;
import org.junit.jupiter.api.BeforeEach;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import static org.mockito.Mockito.inOrder;

@MockitoSettings(strictness = Strictness.STRICT_STUBS)
public abstract class AbstractControllerTest {

    @Mock
    protected MessagingUtils messagingUtils;
    @Mock
    protected SessionManager sessionManager;
    protected InOrder inOrder;

    @BeforeEach
    void setUp() {
        inOrder = inOrder(sessionManager, messagingUtils);
    }
}
