// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// vi.mock calls are hoisted above imports, so these refs are populated by the
// time `import useStomp` runs.
let lastClientConfig = null
let lastClientInstance = null

vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn(function (config) {
    lastClientConfig = config
    lastClientInstance = {
      activate: vi.fn(),
      deactivate: vi.fn(),
      active: true,
      subscribe: vi.fn(),
    }
    return lastClientInstance
  }),
}))

vi.mock('sockjs-client', () => ({
  default: vi.fn(function () {
    return {}
  }),
}))

import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import useStomp from '../useStomp'

// Stable references so the [url, topics] effect doesn't re-fire on rerender.
const ONE_TOPIC = ['/topic/results/abc']
const TWO_TOPICS = ['/topic/results/abc', '/topic/users/abc']

beforeEach(() => {
  lastClientConfig = null
  lastClientInstance = null
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useStomp — STOMP client wiring', () => {
  it('does not construct a Client when url is empty', () => {
    renderHook(() => useStomp({ url: '', topics: ONE_TOPIC, onMessage: vi.fn() }))
    expect(Client).not.toHaveBeenCalled()
  })

  it('does not construct a Client when topics list is empty', () => {
    renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: [], onMessage: vi.fn() }),
    )
    expect(Client).not.toHaveBeenCalled()
  })

  it('does not construct a Client when topics is undefined', () => {
    renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: undefined, onMessage: vi.fn() }),
    )
    expect(Client).not.toHaveBeenCalled()
  })

  it('calls client.activate() on mount and uses SockJS factory with the given url', () => {
    renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    expect(Client).toHaveBeenCalledTimes(1)
    expect(lastClientInstance.activate).toHaveBeenCalledOnce()
    lastClientConfig.webSocketFactory()
    expect(SockJS).toHaveBeenCalledWith('http://localhost:9000/stomp')
  })

  it('subscribes to every requested topic when onConnect fires', () => {
    renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: TWO_TOPICS, onMessage: vi.fn() }),
    )
    act(() => lastClientConfig.onConnect())
    expect(lastClientInstance.subscribe).toHaveBeenCalledTimes(2)
    expect(lastClientInstance.subscribe).toHaveBeenCalledWith(TWO_TOPICS[0], expect.any(Function))
    expect(lastClientInstance.subscribe).toHaveBeenCalledWith(TWO_TOPICS[1], expect.any(Function))
  })

  it('parses JSON from incoming message and calls onMessage', () => {
    const onMessage = vi.fn()
    const payload = [{ userName: 'alice', estimateValue: '5' }]

    renderHook(() => useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage }))

    act(() => lastClientConfig.onConnect())
    const [, messageHandler] = lastClientInstance.subscribe.mock.calls[0]
    act(() => messageHandler({ body: JSON.stringify(payload) }))

    expect(onMessage).toHaveBeenCalledWith(payload)
  })

  it('uses latest onMessage callback after re-render (ref-tracked)', () => {
    const first = vi.fn()
    const second = vi.fn()

    const { rerender } = renderHook(
      ({ onMessage }) =>
        useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage }),
      {
        initialProps: { onMessage: first },
      },
    )

    act(() => lastClientConfig.onConnect())
    const [, messageHandler] = lastClientInstance.subscribe.mock.calls[0]

    rerender({ onMessage: second })
    act(() => messageHandler({ body: JSON.stringify({ ok: true }) }))

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith({ ok: true })
  })

  it('calls client.deactivate() on cleanup when client is active', () => {
    const { unmount } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    const instance = lastClientInstance
    unmount()
    expect(instance.deactivate).toHaveBeenCalledOnce()
  })

  it('does not call deactivate when client is already inactive', () => {
    const { unmount } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    const instance = lastClientInstance
    instance.active = false
    unmount()
    expect(instance.deactivate).not.toHaveBeenCalled()
  })
})

describe('useStomp — connected state and reconnect lifecycle', () => {
  it('starts with connected === null (no banner before any attempt)', () => {
    const { result } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    expect(result.current.connected).toBeNull()
  })

  it('onConnect sets connected to true', () => {
    const { result } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    act(() => lastClientConfig.onConnect())
    expect(result.current.connected).toBe(true)
  })

  it('onDisconnect sets connected to false after prior connect', () => {
    const { result } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    act(() => lastClientConfig.onConnect())
    act(() => lastClientConfig.onDisconnect())
    expect(result.current.connected).toBe(false)
  })

  it('onStompError sets connected to false after prior connect', () => {
    const { result } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    act(() => lastClientConfig.onConnect())
    act(() => lastClientConfig.onStompError())
    expect(result.current.connected).toBe(false)
  })

  it('onWebSocketClose sets connected to false after prior connect', () => {
    const { result } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    act(() => lastClientConfig.onConnect())
    act(() => lastClientConfig.onWebSocketClose())
    expect(result.current.connected).toBe(false)
  })

  it('onDisconnect is ignored before initial connect', () => {
    const { result } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    act(() => lastClientConfig.onDisconnect())
    expect(result.current.connected).toBeNull()
  })

  it('onStompError is ignored before initial connect', () => {
    const { result } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    act(() => lastClientConfig.onStompError())
    expect(result.current.connected).toBeNull()
  })

  it('onWebSocketClose is ignored before initial connect', () => {
    const { result } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    act(() => lastClientConfig.onWebSocketClose())
    expect(result.current.connected).toBeNull()
  })

  it('flips connected to false after 5s if onConnect never fires', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    expect(result.current.connected).toBeNull()
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.connected).toBe(false)
  })

  it('does not flip to false at 5s if onConnect fires first', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: ONE_TOPIC, onMessage: vi.fn() }),
    )
    act(() => lastClientConfig.onConnect())
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(result.current.connected).toBe(true)
  })

  it('reconnect resubscribes to all topics', () => {
    renderHook(() =>
      useStomp({ url: 'http://localhost:9000/stomp', topics: TWO_TOPICS, onMessage: vi.fn() }),
    )
    act(() => lastClientConfig.onConnect())
    lastClientInstance.subscribe.mockClear()
    act(() => lastClientConfig.onConnect())
    expect(lastClientInstance.subscribe).toHaveBeenCalledTimes(2)
    expect(lastClientInstance.subscribe).toHaveBeenCalledWith(TWO_TOPICS[0], expect.any(Function))
    expect(lastClientInstance.subscribe).toHaveBeenCalledWith(TWO_TOPICS[1], expect.any(Function))
  })
})
