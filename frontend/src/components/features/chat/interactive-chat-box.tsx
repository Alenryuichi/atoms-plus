import { isFileImage } from "#/utils/is-file-image";
import { displayErrorToast } from "#/utils/custom-toast-handlers";
import { validateFiles } from "#/utils/file-validation";
import { CustomChatInput } from "./custom-chat-input";
import { AgentState } from "#/types/agent-state";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useConversationStore } from "#/stores/conversation-store";
import { useAgentState } from "#/hooks/use-agent-state";
import { processFiles, processImages } from "#/utils/file-processing";
import { useSubConversationTaskPolling } from "#/hooks/query/use-sub-conversation-task-polling";
import { isTaskPolling } from "#/utils/utils";
import { useTeamModeStore } from "#/stores/team-mode-store";
import { useResearchStore } from "#/stores/research-store";
import { useUnifiedPauseConversationSandbox } from "#/hooks/mutation/use-unified-stop-conversation";
import { useV1PauseConversation } from "#/hooks/mutation/use-v1-pause-conversation";
import { useV1ResumeConversation } from "#/hooks/mutation/use-v1-resume-conversation";
import { useConversationId } from "#/hooks/use-conversation-id";
import { useSendMessage } from "#/hooks/use-send-message";
import { generateAgentStateChangeEvent } from "#/services/agent-state-service";

interface InteractiveChatBoxProps {
  onSubmit: (message: string, images: File[], files: File[]) => void;
}

export function InteractiveChatBox({ onSubmit }: InteractiveChatBoxProps) {
  const {
    images,
    files,
    addImages,
    addFiles,
    clearAllFiles,
    addFileLoading,
    removeFileLoading,
    addImageLoading,
    removeImageLoading,
    subConversationTaskId,
  } = useConversationStore();
  const { curAgentState } = useAgentState();
  const { data: conversation } = useActiveConversation();
  const { conversationId } = useConversationId();
  const { send } = useSendMessage();

  const isTeamModeRunning = useTeamModeStore((state) => state.isRunning);

  // Deep Research: disable input while research is in progress
  const researchPhase = useResearchStore((s) => s.phase);
  const isResearchActive =
    researchPhase === "connecting" || researchPhase === "researching";

  const pauseConversationSandboxMutation = useUnifiedPauseConversationSandbox();
  const v1PauseConversationMutation = useV1PauseConversation();
  const v1ResumeConversationMutation = useV1ResumeConversation();

  const isV1Conversation = conversation?.conversation_version === "V1";

  // Poll sub-conversation task to check if it's loading
  const { taskStatus: subConversationTaskStatus } =
    useSubConversationTaskPolling(
      subConversationTaskId,
      conversation?.conversation_id || null,
    );

  const validateAndFilterFiles = (selectedFiles: File[]) => {
    const validation = validateFiles(selectedFiles, [...images, ...files]);
    if (!validation.isValid) {
      displayErrorToast(`Error: ${validation.errorMessage}`);
      return null;
    }
    const validFiles = selectedFiles.filter((f) => !isFileImage(f));
    const validImages = selectedFiles.filter((f) => isFileImage(f));
    return { validFiles, validImages };
  };

  const showLoadingIndicators = (validFiles: File[], validImages: File[]) => {
    validFiles.forEach((file) => addFileLoading(file.name));
    validImages.forEach((image) => addImageLoading(image.name));
  };

  const handleSuccessfulFiles = (fileResults: { successful: File[] }) => {
    if (fileResults.successful.length > 0) {
      addFiles(fileResults.successful);
      fileResults.successful.forEach((file) => removeFileLoading(file.name));
    }
  };

  const handleSuccessfulImages = (imageResults: { successful: File[] }) => {
    if (imageResults.successful.length > 0) {
      addImages(imageResults.successful);
      imageResults.successful.forEach((image) =>
        removeImageLoading(image.name),
      );
    }
  };

  const handleFailedFiles = (
    fileResults: { failed: { file: File; error: Error }[] },
    imageResults: { failed: { file: File; error: Error }[] },
  ) => {
    fileResults.failed.forEach(({ file, error }) => {
      removeFileLoading(file.name);
      displayErrorToast(
        `Failed to process file ${file.name}: ${error.message}`,
      );
    });
    imageResults.failed.forEach(({ file, error }) => {
      removeImageLoading(file.name);
      displayErrorToast(
        `Failed to process image ${file.name}: ${error.message}`,
      );
    });
  };

  const clearLoadingStates = (validFiles: File[], validImages: File[]) => {
    validFiles.forEach((file) => removeFileLoading(file.name));
    validImages.forEach((image) => removeImageLoading(image.name));
  };

  const handleUpload = async (selectedFiles: File[]) => {
    const result = validateAndFilterFiles(selectedFiles);
    if (!result) return;
    const { validFiles, validImages } = result;
    showLoadingIndicators(validFiles, validImages);
    try {
      const [fileResults, imageResults] = await Promise.all([
        processFiles(validFiles),
        processImages(validImages),
      ]);
      handleSuccessfulFiles(fileResults);
      handleSuccessfulImages(imageResults);
      handleFailedFiles(fileResults, imageResults);
    } catch {
      clearLoadingStates(validFiles, validImages);
      displayErrorToast("An unexpected error occurred while processing files");
    }
  };

  const handleSubmit = (message: string) => {
    onSubmit(message, images, files);
    clearAllFiles();
  };

  const handleStop = () => {
    if (isV1Conversation) {
      v1PauseConversationMutation.mutate({ conversationId });
      return;
    }
    send(generateAgentStateChangeEvent(AgentState.STOPPED));
  };

  const handleResume = () => {
    if (isV1Conversation) {
      v1ResumeConversationMutation.mutate({ conversationId });
      return;
    }
    send(generateAgentStateChangeEvent(AgentState.RUNNING));
  };

  const isPausing =
    pauseConversationSandboxMutation.isPending ||
    v1PauseConversationMutation.isPending;

  const isDisabled =
    curAgentState === AgentState.LOADING ||
    curAgentState === AgentState.RUNNING ||
    curAgentState === AgentState.AWAITING_USER_CONFIRMATION ||
    isTaskPolling(subConversationTaskStatus) ||
    isTeamModeRunning ||
    isResearchActive;

  return (
    <div data-testid="interactive-chat-box">
      <CustomChatInput
        disabled={isDisabled}
        onSubmit={handleSubmit}
        onStop={handleStop}
        onResume={handleResume}
        agentState={curAgentState}
        isPausing={isPausing}
        onFilesPaste={handleUpload}
        conversationStatus={conversation?.status || null}
      />
    </div>
  );
}
