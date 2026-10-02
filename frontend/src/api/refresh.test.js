import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { installRefreshInterceptor, SESSION_EXPIRED_EVENT } from "./refresh";

// A minimal stand-in for the axios instance: captures the response interceptor
// and exposes it as `runInterceptor(error)`, and `client(config)` is the retry call.
function createMockClient() {
  let errorInterceptor;
  const client = vi.fn((config) => Promise.resolve({ config, retried: true }));
  client.post = vi.fn(() => Promise.resolve({}));
  client.interceptors = {
    response: {
      use: (onFulfilled, onRejected) => {
        errorInterceptor = onRejected;
      },
    },
  };
  client.runInterceptor = (error) => errorInterceptor(error);
  return client;
}

describe("installRefreshInterceptor", () => {
  let client;

  beforeEach(() => {
    client = createMockClient();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries a 401 response exactly once after a successful refresh", async () => {
    installRefreshInterceptor(client);

    const error = { response: { status: 401 }, config: { url: "/teachers/me" } };
    const result = await client.runInterceptor(error);

    expect(client.post).toHaveBeenCalledWith("/auth/refresh");
    expect(client).toHaveBeenCalledWith(error.config);
    expect(error.config._retried).toBe(true);
    expect(result).toEqual({ config: error.config, retried: true });
  });

  it("does not retry a request that has already been retried", async () => {
    installRefreshInterceptor(client);

    const error = {
      response: { status: 401 },
      config: { url: "/teachers/me", _retried: true },
    };

    await expect(client.runInterceptor(error)).rejects.toBe(error);
    expect(client.post).not.toHaveBeenCalled();
  });

  it("does not retry 401s from auth endpoints themselves", async () => {
    installRefreshInterceptor(client);

    const error = { response: { status: 401 }, config: { url: "/auth/login" } };
    await expect(client.runInterceptor(error)).rejects.toBe(error);
    expect(client.post).not.toHaveBeenCalled();
  });

  it("passes through non-401 errors untouched", async () => {
    installRefreshInterceptor(client);

    const error = { response: { status: 500 }, config: { url: "/teachers/me" } };
    await expect(client.runInterceptor(error)).rejects.toBe(error);
    expect(client.post).not.toHaveBeenCalled();
  });

  it("dispatches SESSION_EXPIRED_EVENT and rejects when the refresh call itself fails", async () => {
    client.post = vi.fn(() => Promise.reject(new Error("refresh token expired")));
    installRefreshInterceptor(client);

    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);

    const error = { response: { status: 401 }, config: { url: "/teachers/me" } };
    await expect(client.runInterceptor(error)).rejects.toBe(error);

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
  });

  it("shares one refresh call across concurrent 401s", async () => {
    let resolveRefresh;
    client.post = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRefresh = resolve;
        })
    );
    installRefreshInterceptor(client);

    const errorA = { response: { status: 401 }, config: { url: "/a" } };
    const errorB = { response: { status: 401 }, config: { url: "/b" } };

    const promiseA = client.runInterceptor(errorA);
    const promiseB = client.runInterceptor(errorB);

    resolveRefresh({});
    await Promise.all([promiseA, promiseB]);

    expect(client.post).toHaveBeenCalledTimes(1);
  });
});
