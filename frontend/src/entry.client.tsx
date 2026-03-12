/* eslint-disable react/react-in-jsx-scope */
/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { HydratedRouter } from "react-router/dom";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import "./i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./query-client-config";
import {
  loadPostHogClientKey,
  PostHogWrapper,
} from "./components/providers/posthog-wrapper";
import { SupabaseAuthProvider } from "./context/supabase-auth-context";

async function prepareApp() {
  const posthogClientKeyPromise = loadPostHogClientKey();

  if (
    process.env.NODE_ENV === "development" &&
    import.meta.env.VITE_MOCK_API === "true"
  ) {
    const { worker } = await import("./mocks/browser");

    await worker.start({
      onUnhandledRequest: "bypass",
    });
  }

  const posthogClientKey = await posthogClientKeyPromise;

  return { posthogClientKey };
}

prepareApp().then(({ posthogClientKey }) =>
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <SupabaseAuthProvider>
            <PostHogWrapper posthogClientKey={posthogClientKey}>
              <HydratedRouter />
            </PostHogWrapper>
          </SupabaseAuthProvider>
        </QueryClientProvider>
      </StrictMode>,
    );
  }),
);
