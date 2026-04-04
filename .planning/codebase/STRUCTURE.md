# Codebase Structure

**Analysis Date:** 2026-04-04

## Directory Layout

```
planningpoker/                        # Gradle root project
├── planningpoker-api/                # Spring Boot 3.4 backend module
│   └── src/
│       ├── main/
│       │   ├── java/com/richashworth/planningpoker/
│       │   │   ├── config/           # Spring configuration beans
│       │   │   ├── controller/       # REST controllers + error handler
│       │   │   ├── model/            # Domain model classes
│       │   │   ├── service/          # Business logic / state
│       │   │   ├── tasks/            # Scheduled background tasks
│       │   │   └── util/             # Shared utilities
│       │   └── resources/
│       │       └── application.properties
│       ├── test/java/...             # JUnit 5 tests mirroring main structure
│       └── gatling/                  # Gatling load-test simulations
├── planningpoker-web/                # React 18 + Vite frontend module
│   ├── src/
│   │   ├── actions/                  # Redux action creators + axios calls
│   │   ├── components/               # Presentational (dumb) components
│   │   ├── config/                   # Constants (API URL, legal estimates)
│   │   ├── containers/               # Redux-connected (smart) components
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── pages/                    # Route-level page components
│   │   ├── reducers/                 # Redux reducers + __tests__/
│   │   ├── App.jsx                   # Root component, router, store, theme
│   │   ├── index.jsx                 # React DOM entry point
│   │   └── theme.js                  # MUI dark/light theme definitions
│   ├── public/                       # Static assets served verbatim
│   ├── tests/                        # Playwright e2e test files
│   ├── build/                        # Vite output (gitignored)
│   └── dist/libs/                    # Gradle output JAR (gitignored)
├── .planning/                        # GSD planning documents
│   ├── codebase/                     # Codebase analysis docs (this dir)
│   └── phases/                       # Phase implementation plans
├── docs/                             # Design specs and superpowers docs
├── scripts/                          # Utility shell scripts
├── specs/                            # Gatling/integration specs
├── Dockerfile                        # Multi-stage build (node → jdk → jre)
├── railway.toml                      # Railway deployment config
├── settings.gradle                   # Gradle module declarations
└── build.gradle                      # Root Gradle build config
```

## Directory Purposes

**`planningpoker-api/src/main/java/.../config/`:**
- Purpose: Spring `@Configuration` classes
- Contains: `WebSocketConfig.java`, `SpaWebConfig.java`, `AsyncConfig.java`, `CorsConfig.java`
- Key files: `SpaWebConfig.java` (SPA fallback), `WebSocketConfig.java` (STOMP endpoint)

**`planningpoker-api/src/main/java/.../controller/`:**
- Purpose: `@RestController` classes handling HTTP requests
- Contains: `GameController.java`, `VoteController.java`, `AppController.java`, `ErrorHandler.java`
- Key files: `GameController.java` (session lifecycle), `ErrorHandler.java` (global `@ControllerAdvice`)

**`planningpoker-api/src/main/java/.../service/`:**
- Purpose: Stateful singleton holding all in-memory session data
- Contains: `SessionManager.java`
- Key files: `SessionManager.java` — the only service class; owns all runtime state

**`planningpoker-api/src/main/java/.../model/`:**
- Purpose: Plain domain objects
- Contains: `Estimate.java` (Lombok `@Data`, fields: `userName`, `estimateValue`)

**`planningpoker-api/src/main/java/.../util/`:**
- Purpose: Shared stateless helpers
- Contains: `MessagingUtils.java` (WebSocket burst sender), `CollectionUtils.java`, `Clock.java` (abstracted sleep for testability)

**`planningpoker-api/src/main/java/.../tasks/`:**
- Purpose: Spring `@Scheduled` background jobs
- Contains: `ClearSessionsTask.java` (weekly full clear + 5-min idle eviction)

**`planningpoker-web/src/pages/`:**
- Purpose: One component per client-side route; orchestrate data fetching and navigation
- Contains: `Welcome.jsx`, `CreateGame.jsx`, `JoinGame.jsx`, `PlayGame.jsx`

**`planningpoker-web/src/containers/`:**
- Purpose: Redux-connected components; read store state, dispatch actions
- Contains: `Header.jsx`, `GamePane.jsx`, `Vote.jsx`, `Results.jsx`, `UsersTable.jsx`

**`planningpoker-web/src/components/`:**
- Purpose: Presentational components with no Redux dependency
- Contains: `Footer.jsx`, `NameInput.jsx`, `ResultsChart.jsx`, `ResultsTable.jsx`

**`planningpoker-web/src/actions/`:**
- Purpose: Redux action type constants and action creator functions; axios HTTP calls live here
- Contains: `index.js`

**`planningpoker-web/src/reducers/`:**
- Purpose: Pure reducer functions for each Redux state slice; tests co-located in `__tests__/`
- Contains: `index.js` (combineReducers), `reducer_game.js`, `reducer_results.js`, `reducer_users.js`, `reducer_vote.js`

**`planningpoker-web/src/hooks/`:**
- Purpose: Custom React hooks for shared behaviour
- Contains: `useStomp.js` (STOMP/SockJS connection lifecycle)

**`planningpoker-web/src/config/`:**
- Purpose: Compile-time constants shared across the frontend
- Contains: `Constants.js` (`API_ROOT_URL`, `LEGAL_ESTIMATES`, `COFFEE_SYMBOL`)

**`planningpoker-web/tests/`:**
- Purpose: Playwright e2e tests
- Contains: test files run against the live backend at port 9000

## Key File Locations

**Entry Points:**
- `planningpoker-web/src/index.jsx`: React DOM mount
- `planningpoker-web/src/App.jsx`: Redux store creation, router, theme provider, route definitions
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/PlanningPokerApplication.java`: Spring Boot main

**Configuration:**
- `planningpoker-api/src/main/resources/application.properties`: Port, WebSocket limits, actuator, logging, CORS
- `planningpoker-web/src/config/Constants.js`: `API_ROOT_URL` and `LEGAL_ESTIMATES`
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/config/WebSocketConfig.java`: STOMP endpoint
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/config/SpaWebConfig.java`: SPA fallback routing

**Core Logic:**
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`: All session state
- `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java`: WebSocket push
- `planningpoker-web/src/actions/index.js`: All REST mutations
- `planningpoker-web/src/hooks/useStomp.js`: WebSocket subscription

**Testing:**
- `planningpoker-api/src/test/java/com/richashworth/planningpoker/`: JUnit 5 unit tests
- `planningpoker-web/tests/`: Playwright e2e tests
- `planningpoker-web/src/reducers/__tests__/`: Reducer unit tests

## Naming Conventions

**Backend Files:**
- Java classes: PascalCase matching the class name (`GameController.java`, `SessionManager.java`)
- Test classes: suffix `Test` (`GameControllerTest.java`, `SessionManagerTest.java`)
- Package structure mirrors layer: `controller`, `service`, `model`, `config`, `util`, `tasks`

**Frontend Files:**
- React components: PascalCase with `.jsx` extension (`PlayGame.jsx`, `ResultsChart.jsx`)
- Redux reducers: `reducer_` prefix with snake_case slice name (`reducer_game.js`, `reducer_results.js`)
- Hooks: `use` prefix camelCase (`useStomp.js`)
- Config/utility: camelCase with `.js` extension (`Constants.js`, `theme.js`)

**Frontend Directories:**
- Split by concern: `pages/` for routes, `containers/` for Redux-connected, `components/` for presentational

## Where to Add New Code

**New REST endpoint:**
- Controller: `planningpoker-api/src/main/java/com/richashworth/planningpoker/controller/` (add to existing controller or create new one)
- Service method: `planningpoker-api/src/main/java/com/richashworth/planningpoker/service/SessionManager.java`
- Tests: `planningpoker-api/src/test/java/com/richashworth/planningpoker/controller/`

**New WebSocket topic:**
- Add topic constant to `planningpoker-api/src/main/java/com/richashworth/planningpoker/util/MessagingUtils.java`
- Subscribe in `planningpoker-web/src/pages/PlayGame.jsx` `useStomp` topics array
- Handle message type in the `onMessage` switch in `PlayGame.jsx`
- Add action type in `planningpoker-web/src/actions/index.js`
- Handle in the relevant reducer in `planningpoker-web/src/reducers/`

**New Redux state slice:**
- Reducer: `planningpoker-web/src/reducers/reducer_{name}.js`
- Register in: `planningpoker-web/src/reducers/index.js` via `combineReducers`
- Action constants and creators: `planningpoker-web/src/actions/index.js`

**New UI page/route:**
- Page component: `planningpoker-web/src/pages/{Name}.jsx`
- Register route: `planningpoker-web/src/App.jsx` (add lazy import + `<Route>`)

**New smart component (Redux-connected):**
- File: `planningpoker-web/src/containers/{Name}.jsx`
- Use `useSelector` and `useDispatch` from react-redux

**New presentational component:**
- File: `planningpoker-web/src/components/{Name}.jsx`
- Props only; no Redux imports

**New custom hook:**
- File: `planningpoker-web/src/hooks/use{Name}.js`

**Shared frontend constant:**
- Add to `planningpoker-web/src/config/Constants.js`

## Special Directories

**`planningpoker-web/build/`:**
- Purpose: Vite production build output
- Generated: Yes (by `npm run build`)
- Committed: No

**`planningpoker-web/dist/`:**
- Purpose: Gradle build output directory for the web module (overrides default `build/`)
- Generated: Yes (by `planningpoker-web:jar`)
- Committed: No
- Note: Contains `libs/planningpoker-web.jar` which is consumed by the API module via `flatDir`

**`.planning/`:**
- Purpose: GSD planning documents (codebase analysis, phase plans)
- Generated: No (hand-authored)
- Committed: Yes

**`planningpoker-api/src/gatling/`:**
- Purpose: Gatling load test simulations
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-04*
