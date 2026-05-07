#!/usr/bin/env bash
# Smoke-test the GraalVM native binary by exercising every REST endpoint and
# the WebSocket. Exits non-zero on first failure.
#
# Usage:
#   ./scripts/smoke-test-native.sh [BINARY_PATH]
#
# Default BINARY_PATH: planningpoker-api/build/native/nativeCompile/planningpoker
# Default port: 9000 (override via PORT env var)

set -euo pipefail

BINARY="${1:-planningpoker-api/build/native/nativeCompile/planningpoker}"
PORT="${PORT:-9000}"
BASE="http://localhost:${PORT}"

if [[ ! -x "$BINARY" ]]; then
  echo "ERROR: binary not found or not executable: $BINARY" >&2
  exit 1
fi

LOGFILE="$(mktemp)"
echo "Starting binary: $BINARY"
echo "Logs: $LOGFILE"

# Boot the binary and time how long until /actuator/health is 200.
START_NS=$(date +%s%N)
"$BINARY" --server.port="$PORT" >"$LOGFILE" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true; wait $PID 2>/dev/null || true' EXIT

# Poll health for up to 10s
DEADLINE=$(( $(date +%s) + 10 ))
until curl -fsS "$BASE/actuator/health" >/dev/null 2>&1; do
  if [[ $(date +%s) -gt $DEADLINE ]]; then
    echo "FAIL: health check did not return 200 within 10s" >&2
    tail -30 "$LOGFILE" >&2
    exit 1
  fi
  sleep 0.05
done
END_NS=$(date +%s%N)
COLD_START_MS=$(( (END_NS - START_NS) / 1000000 ))
echo "READY: cold start = ${COLD_START_MS} ms"

fail() { echo "FAIL: $*" >&2; tail -30 "$LOGFILE" >&2; exit 1; }
pass() { echo "PASS: $*"; }

# /version (plain text)
VERSION=$(curl -fsS "$BASE/version") || fail "/version returned non-2xx"
[[ -n "$VERSION" ]] || fail "/version returned empty body"
pass "/version => $VERSION"

# /createSession (JSON body)
CREATE_RESP=$(curl -fsS -X POST "$BASE/createSession" \
  -H 'Content-Type: application/json' \
  -d '{"userName":"alice","schemeType":"fibonacci","includeUnsure":true,"isSpectator":false}') || fail "/createSession failed"
SESSION_ID=$(echo "$CREATE_RESP" | python3 -c 'import json,sys; print(json.load(sys.stdin)["sessionId"])')
[[ ${#SESSION_ID} -eq 12 ]] || fail "/createSession sessionId not 12 chars: $SESSION_ID"
pass "/createSession => sessionId=$SESSION_ID"

# /joinSession (form body) — second user
curl -fsS -X POST "$BASE/joinSession" \
  --data-urlencode "userName=bob" \
  --data-urlencode "sessionId=$SESSION_ID" \
  --data-urlencode "isSpectator=false" \
  >/dev/null || fail "/joinSession failed"
pass "/joinSession => bob joined $SESSION_ID"

# /sessionUsers
USERS=$(curl -fsS "$BASE/sessionUsers?sessionId=$SESSION_ID")
echo "$USERS" | grep -q "alice" || fail "/sessionUsers missing alice: $USERS"
echo "$USERS" | grep -q "bob" || fail "/sessionUsers missing bob: $USERS"
pass "/sessionUsers => $USERS"

# /vote
curl -fsS -X POST "$BASE/vote" \
  --data-urlencode "userName=alice" \
  --data-urlencode "sessionId=$SESSION_ID" \
  --data-urlencode "estimateValue=5" \
  >/dev/null || fail "/vote failed"
pass "/vote => alice voted 5"

# /refresh
REFRESH=$(curl -fsS "$BASE/refresh?sessionId=$SESSION_ID")
echo "$REFRESH" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["round"]==0, d; assert any(e["userName"]=="alice" and e["estimateValue"]=="5" for e in d["results"]), d' || fail "/refresh did not show alice's vote: $REFRESH"
pass "/refresh => round=0, alice voted 5"

# /reset
RESET=$(curl -fsS -X POST "$BASE/reset" \
  --data-urlencode "sessionId=$SESSION_ID" \
  --data-urlencode "userName=alice")
NEW_ROUND=$(echo "$RESET" | python3 -c 'import json,sys; print(json.load(sys.stdin)["round"])')
[[ "$NEW_ROUND" == "1" ]] || fail "/reset round != 1: $RESET"
pass "/reset => round=1"

# /setLabel
curl -fsS -X POST "$BASE/setLabel" \
  --data-urlencode "userName=alice" \
  --data-urlencode "sessionId=$SESSION_ID" \
  --data-urlencode "label=Story 42" \
  >/dev/null || fail "/setLabel failed"
pass "/setLabel => 'Story 42'"

# /setConsensus
curl -fsS -X POST "$BASE/setConsensus" \
  --data-urlencode "sessionId=$SESSION_ID" \
  --data-urlencode "userName=alice" \
  --data-urlencode "value=8" \
  >/dev/null || fail "/setConsensus failed"
pass "/setConsensus => 8"

# /promote
curl -fsS -X POST "$BASE/promote" \
  --data-urlencode "userName=alice" \
  --data-urlencode "targetUser=bob" \
  --data-urlencode "sessionId=$SESSION_ID" \
  >/dev/null || fail "/promote failed"
pass "/promote => bob is host"

# /kick (now bob is host kicking alice)
curl -fsS -X POST "$BASE/kick" \
  --data-urlencode "userName=bob" \
  --data-urlencode "targetUser=alice" \
  --data-urlencode "sessionId=$SESSION_ID" \
  >/dev/null || fail "/kick failed"
pass "/kick => alice kicked"

# /logout
curl -fsS -X POST "$BASE/logout" \
  --data-urlencode "userName=bob" \
  --data-urlencode "sessionId=$SESSION_ID" \
  >/dev/null || fail "/logout failed"
pass "/logout => bob left"

# WebSocket — verify SockJS info endpoint responds (full STOMP test deferred to Playwright)
INFO=$(curl -fsS "$BASE/stomp/info") || fail "/stomp/info failed"
echo "$INFO" | grep -q '"websocket":true' || fail "/stomp/info did not advertise websocket: $INFO"
pass "/stomp/info => websocket=true"

echo ""
echo "===================================="
echo "  ALL SMOKE TESTS PASSED"
echo "  Cold start: ${COLD_START_MS} ms"
echo "===================================="
