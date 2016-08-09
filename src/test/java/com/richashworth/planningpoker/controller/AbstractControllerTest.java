package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.MessagingUtils;
import org.junit.Before;
import org.mockito.InOrder;
import org.mockito.Mock;

import static org.mockito.Mockito.inOrder;

/**
 * Created by Rich Ashworth on 09/08/2016.
 */
public class AbstractControllerTest {

    static final Long SESSION_ID = 1L;
    static final String USER_NAME = "Rich";
    static final Double ESTIMATE_VALUE = 2D;
    static final Estimate ESTIMATE = new Estimate(USER_NAME, ESTIMATE_VALUE);

    InOrder inOrder;

    @Mock
    protected MessagingUtils messagingUtils;

    @Mock
    protected SessionManager sessionManager;

    @Before
    public void setUp() {
        inOrder = inOrder(sessionManager, messagingUtils);
    }
}
