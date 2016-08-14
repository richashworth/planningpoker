package com.richashworth.planningpoker.controller;

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
public abstract class AbstractControllerTest {

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
