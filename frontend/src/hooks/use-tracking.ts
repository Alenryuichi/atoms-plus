import { usePostHog } from "posthog-js/react";
import { useConfig } from "./query/use-config";
import { useSettings } from "./query/use-settings";
import { Provider } from "#/types/settings";

/**
 * Hook that provides tracking functions with automatic data collection
 * from available hooks (config, settings, etc.)
 */
export const useTracking = () => {
  const posthog = usePostHog();
  const { data: config } = useConfig();
  const { data: settings } = useSettings();

  // Common properties included in all tracking events
  const commonProperties = {
    app_surface: config?.app_mode || "unknown",
    plan_tier: null,
    current_url: window.location.href,
    user_email: settings?.email || settings?.git_user_email || null,
  };

  const trackLoginButtonClick = ({ provider }: { provider: Provider }) => {
    posthog.capture("login_button_clicked", {
      provider,
      ...commonProperties,
    });
  };

  const trackConversationCreated = ({
    hasRepository,
  }: {
    hasRepository: boolean;
  }) => {
    posthog.capture("conversation_created", {
      has_repository: hasRepository,
      ...commonProperties,
    });
  };

  const trackPushButtonClick = () => {
    posthog.capture("push_button_clicked", {
      ...commonProperties,
    });
  };

  const trackPullButtonClick = () => {
    posthog.capture("pull_button_clicked", {
      ...commonProperties,
    });
  };

  const trackCreatePrButtonClick = () => {
    posthog.capture("create_pr_button_clicked", {
      ...commonProperties,
    });
  };

  const trackGitProviderConnected = ({
    providers,
  }: {
    providers: string[];
  }) => {
    posthog.capture("git_provider_connected", {
      providers,
      ...commonProperties,
    });
  };

  const trackUserSignupCompleted = () => {
    posthog.capture("user_signup_completed", {
      signup_timestamp: new Date().toISOString(),
      ...commonProperties,
    });
  };

  const trackCreditsPurchased = ({
    amountUsd,
    stripeSessionId,
  }: {
    amountUsd: number;
    stripeSessionId: string;
  }) => {
    posthog.capture("credits_purchased", {
      amount_usd: amountUsd,
      stripe_session_id: stripeSessionId,
      ...commonProperties,
    });
  };

  const trackCreditLimitReached = ({
    conversationId,
  }: {
    conversationId: string;
  }) => {
    posthog.capture("credit_limit_reached", {
      conversation_id: conversationId,
      ...commonProperties,
    });
  };

  const trackAddTeamMembersButtonClick = () => {
    posthog.capture("exp_add_team_members", {
      ...commonProperties,
    });
  };

  const trackOnboardingCompleted = ({
    role,
    orgSize,
    useCase,
  }: {
    role: string;
    orgSize: string;
    useCase: string;
  }) => {
    posthog.capture("onboarding_completed", {
      role,
      org_size: orgSize,
      use_case: useCase,
      ...commonProperties,
    });
  };

  // Team Mode Clarification Analytics
  const trackClarificationTriggered = ({
    questionCount,
    priority,
    sessionId,
  }: {
    questionCount: number;
    priority: string;
    sessionId: string;
  }) => {
    posthog.capture("clarification_triggered", {
      question_count: questionCount,
      highest_priority: priority,
      session_id: sessionId,
      ...commonProperties,
    });
  };

  const trackClarificationAnswered = ({
    questionId,
    questionType,
    sessionId,
  }: {
    questionId: string;
    questionType: string;
    sessionId: string;
  }) => {
    posthog.capture("clarification_answered", {
      question_id: questionId,
      question_type: questionType,
      session_id: sessionId,
      ...commonProperties,
    });
  };

  const trackClarificationSkipped = ({
    all,
    questionId,
    sessionId,
  }: {
    all: boolean;
    questionId?: string;
    sessionId: string;
  }) => {
    posthog.capture("clarification_skipped", {
      skip_all: all,
      question_id: questionId || null,
      session_id: sessionId,
      ...commonProperties,
    });
  };

  const trackClarificationSubmitted = ({
    answeredCount,
    skippedCount,
    totalCount,
    sessionId,
  }: {
    answeredCount: number;
    skippedCount: number;
    totalCount: number;
    sessionId: string;
  }) => {
    posthog.capture("clarification_submitted", {
      answered_count: answeredCount,
      skipped_count: skippedCount,
      total_count: totalCount,
      answer_rate: totalCount > 0 ? answeredCount / totalCount : 0,
      session_id: sessionId,
      ...commonProperties,
    });
  };

  return {
    trackLoginButtonClick,
    trackConversationCreated,
    trackPushButtonClick,
    trackPullButtonClick,
    trackCreatePrButtonClick,
    trackGitProviderConnected,
    trackUserSignupCompleted,
    trackCreditsPurchased,
    trackCreditLimitReached,
    trackAddTeamMembersButtonClick,
    trackOnboardingCompleted,
    // Clarification tracking
    trackClarificationTriggered,
    trackClarificationAnswered,
    trackClarificationSkipped,
    trackClarificationSubmitted,
  };
};
