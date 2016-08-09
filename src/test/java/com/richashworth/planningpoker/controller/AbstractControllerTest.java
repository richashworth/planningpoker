package com.richashworth.planningpoker.controller;

import com.richashworth.planningpoker.model.Estimate;
import com.richashworth.planningpoker.service.SessionManager;
import com.richashworth.planningpoker.util.MessagingUtils;
import org.junit.Before;
import org.junit.runner.RunWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.runners.MockitoJUnitRunner;

import static org.mockito.Mockito.inOrder;

/**
 * Created by Rich Ashworth on 09/08/2016.
 */
@RunWith(MockitoJUnitRunner.class)
public class AbstractControllerTest {

    public static final Long SESSION_ID = 1L;
    public static final String USER_NAME = "Rich";
    public static final Double ESTIMATE_VALUE = 2D;
    public static final Estimate ESTIMATE = new Estimate(USER_NAME, ESTIMATE_VALUE);

    protected InOrder inOrder;

    @Mock protected MessagingUtils messagingUtils;

    @Mock protected SessionManager sessionManager;

    @Before
    public void setup() {
        inOrder = inOrder(sessionManager, messagingUtils);
    }
}
