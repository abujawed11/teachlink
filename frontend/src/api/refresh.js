// The access token cookie lives only 15 minutes, while the refresh token lasts 30 days. This
// interceptor quietly swaps in a fresh access token when a request fails with 401, then retries
// that request once, so a logged-in user isn't kicked out mid-session.

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

export function installRefreshInterceptor(client) {
  // Concurrent 401s share one refresh call instead of each firing their own.
  let refreshing = null;

  const refreshSession = () => {
    if (!refreshing) {
      refreshing = client.post("/auth/refresh").finally(() => {
        refreshing = null;
      });
    }
    return refreshing;
  };

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const { config, response } = error;
      const url = config?.url || "";

      // Auth endpoints report their own 401s (wrong password, expired refresh token...);
      // refreshing and retrying those would loop or hide the real error.
      const canRetry =
        response?.status === 401 && config && !config._retried && !url.startsWith("/auth/");
      if (!canRetry) return Promise.reject(error);

      config._retried = true;
      try {
        await refreshSession();
      } catch {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
        return Promise.reject(error);
      }
      return client(config);
    }
  );

  return refreshSession;
}
