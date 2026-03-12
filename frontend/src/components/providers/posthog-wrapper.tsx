import React from "react";
import { AxiosError } from "axios";
import { PostHogProvider } from "posthog-js/react";
import OptionService from "#/api/option-service/option-service.api";

const POSTHOG_BOOTSTRAP_KEY = "posthog_bootstrap";
const POSTHOG_MAX_RETRIES = 2;
const POSTHOG_MAX_RETRY_DELAY_MS = 5000;

const isTransientConfigError = (error: unknown): boolean => {
  if (!(error instanceof AxiosError)) {
    return true;
  }

  const status = error.response?.status ?? error.status;
  if (!status) {
    return true;
  }

  return status >= 500;
};

const getPostHogRetryDelay = (attemptIndex: number): number =>
  Math.min(1000 * 2 ** attemptIndex, POSTHOG_MAX_RETRY_DELAY_MS);

const sleep = (ms: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

function getBootstrapIds() {
  // Try to extract from URL hash (e.g. #distinct_id=abc&session_id=xyz)
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const distinctId = params.get("distinct_id");
  const sessionId = params.get("session_id");

  if (distinctId && sessionId) {
    const bootstrap = { distinctID: distinctId, sessionID: sessionId };

    // Persist to sessionStorage so IDs survive full-page OAuth redirects
    sessionStorage.setItem(POSTHOG_BOOTSTRAP_KEY, JSON.stringify(bootstrap));

    // Clean the hash from the URL
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
    return bootstrap;
  }

  // Fallback: check sessionStorage (covers return from OAuth redirect)
  const stored = sessionStorage.getItem(POSTHOG_BOOTSTRAP_KEY);
  if (stored) {
    sessionStorage.removeItem(POSTHOG_BOOTSTRAP_KEY);
    return JSON.parse(stored) as { distinctID: string; sessionID: string };
  }

  return undefined;
}

export async function loadPostHogClientKey(): Promise<string | null> {
  let failureCount = 0;

  while (failureCount <= POSTHOG_MAX_RETRIES) {
    try {
      const config = await OptionService.getConfig();
      return config.posthog_client_key;
    } catch (error) {
      if (
        failureCount >= POSTHOG_MAX_RETRIES ||
        !isTransientConfigError(error)
      ) {
        return null;
      }

      await sleep(getPostHogRetryDelay(failureCount));
      failureCount += 1;
    }
  }

  return null;
}

export function PostHogWrapper({
  children,
  posthogClientKey,
}: {
  children: React.ReactNode;
  posthogClientKey: string | null;
}) {
  const bootstrapIds = React.useMemo(() => getBootstrapIds(), []);

  if (!posthogClientKey) {
    return children;
  }

  return (
    <PostHogProvider
      apiKey={posthogClientKey}
      options={{
        api_host: "https://us.i.posthog.com",
        person_profiles: "identified_only",
        bootstrap: bootstrapIds,
      }}
    >
      {children}
    </PostHogProvider>
  );
}
