import { http, delay, HttpResponse } from "msw";
import {
  Conversation,
  GetMicroagentsResponse,
  ResultSet,
} from "#/api/open-hands.types";
import type {
  V1AppConversation,
  V1AppConversationStartTask,
} from "#/api/conversation-service/v1-conversation-service.types";

const conversations: Conversation[] = [
  {
    conversation_id: "1",
    title: "My New Project",
    selected_repository: null,
    git_provider: null,
    selected_branch: null,
    last_updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    status: "RUNNING",
    runtime_status: "STATUS$READY",
    url: null,
    session_api_key: null,
  },
  {
    conversation_id: "2",
    title: "Repo Testing",
    selected_repository: "octocat/hello-world",
    git_provider: "github",
    selected_branch: null,
    last_updated_at: new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "STOPPED",
    runtime_status: null,
    url: null,
    session_api_key: null,
  },
  {
    conversation_id: "3",
    title: "Another Project",
    selected_repository: "octocat/earth",
    git_provider: null,
    selected_branch: "main",
    last_updated_at: new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "STOPPED",
    runtime_status: null,
    url: null,
    session_api_key: null,
  },
];

const CONVERSATIONS = new Map<string, Conversation>(
  conversations.map((c) => [c.conversation_id, c]),
);

// V1 App Conversations (mock data)
const v1AppConversations: V1AppConversation[] = [
  {
    conversation_id: "1",
    title: "My New Project",
    created_at: new Date().toISOString(),
    last_updated_at: new Date().toISOString(),
    status: "RUNNING",
    selected_repository: null,
    selected_branch: null,
    git_provider: null,
    conversation_version: "V1",
    public: false,
  },
  {
    conversation_id: "2",
    title: "Repo Testing",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    last_updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "STOPPED",
    selected_repository: "octocat/hello-world",
    selected_branch: null,
    git_provider: "github",
    conversation_version: "V1",
    public: false,
  },
];

const V1_APP_CONVERSATIONS = new Map<string, V1AppConversation>(
  v1AppConversations.map((c) => [c.conversation_id, c]),
);

// V1 Start Tasks (for tracking conversation creation)
const V1_START_TASKS = new Map<string, V1AppConversationStartTask>();

export const CONVERSATION_HANDLERS = [
  http.get("/api/conversations", async () => {
    const values = Array.from(CONVERSATIONS.values());
    const results: ResultSet<Conversation> = {
      results: values,
      next_page_id: null,
    };
    return HttpResponse.json(results);
  }),

  http.get("/api/conversations/:conversationId", async ({ params }) => {
    const conversationId = params.conversationId as string;
    const project = CONVERSATIONS.get(conversationId);
    if (project) return HttpResponse.json(project);
    return HttpResponse.json(null, { status: 404 });
  }),

  http.post("/api/conversations", async () => {
    await delay();
    const conversation: Conversation = {
      conversation_id: (Math.random() * 100).toString(),
      title: "New Conversation",
      selected_repository: null,
      git_provider: null,
      selected_branch: null,
      last_updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      status: "RUNNING",
      runtime_status: "STATUS$READY",
      url: null,
      session_api_key: null,
    };
    CONVERSATIONS.set(conversation.conversation_id, conversation);
    return HttpResponse.json(conversation, { status: 201 });
  }),

  http.patch(
    "/api/conversations/:conversationId",
    async ({ params, request }) => {
      const conversationId = params.conversationId as string;
      const conversation = CONVERSATIONS.get(conversationId);

      if (conversation) {
        const body = await request.json();
        if (typeof body === "object" && body?.title) {
          CONVERSATIONS.set(conversationId, {
            ...conversation,
            title: body.title,
          });
          return HttpResponse.json(null, { status: 200 });
        }
      }
      return HttpResponse.json(null, { status: 404 });
    },
  ),

  http.delete("/api/conversations/:conversationId", async ({ params }) => {
    const conversationId = params.conversationId as string;
    if (CONVERSATIONS.has(conversationId)) {
      CONVERSATIONS.delete(conversationId);
      return HttpResponse.json(null, { status: 200 });
    }
    return HttpResponse.json(null, { status: 404 });
  }),

  // Conversation config endpoint - required for chat interface
  http.get("/api/conversations/:conversationId/config", async () => {
    return HttpResponse.json({
      agent: "CodeActAgent",
      security_analyzer: null,
      llm_config: {
        model: "mock-model",
        base_url: "https://mock.api",
        api_key: "mock-key",
        temperature: 0.7,
      },
    });
  }),

  // Git changes endpoint - required for preview panel
  http.get("/api/conversations/:conversationId/git/changes", async () => {
    return HttpResponse.json({
      changes: [],
      has_uncommitted: false,
      current_branch: "main",
      remote_url: null,
    });
  }),

  http.get("/api/conversations/:conversationId/microagents", async () => {
    const response: GetMicroagentsResponse = {
      microagents: [
        {
          name: "init",
          type: "agentskills",
          content: "Initialize an AGENTS.md file for the repository",
          triggers: ["/init"],
        },
        {
          name: "releasenotes",
          type: "agentskills",
          content: "Generate a changelog from the most recent release",
          triggers: ["/releasenotes"],
        },
        {
          name: "test-runner",
          type: "agentskills",
          content: "Run the test suite and report results",
          triggers: ["/test"],
        },
        {
          name: "code-search",
          type: "knowledge",
          content: "Search the codebase semantically",
          triggers: ["/search"],
        },
        {
          name: "docker",
          type: "agentskills",
          content: "Docker usage guide for container environments",
          triggers: ["docker", "container"],
        },
        {
          name: "github",
          type: "agentskills",
          content: "GitHub API interaction guide",
          triggers: ["github", "git"],
        },
        {
          name: "work_hosts",
          type: "repo",
          content: "Available hosts for web applications",
          triggers: [],
        },
      ],
    };
    return HttpResponse.json(response);
  }),

  // ============================================
  // V1 App Conversations API Handlers
  // ============================================

  // Create V1 conversation (returns start task)
  http.post("/api/v1/app-conversations", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as Record<string, unknown>;

    const taskId = `task-${Date.now()}`;
    const conversationId = `conv-${Date.now()}`;

    // Create start task (simulates async conversation creation)
    const startTask: V1AppConversationStartTask = {
      id: taskId,
      status: "READY", // Immediately ready for mock
      app_conversation_id: conversationId,
      title: (body.title as string) || "New Conversation",
      created_at: new Date().toISOString(),
    };

    V1_START_TASKS.set(taskId, startTask);

    // Also create the conversation
    const newConversation: V1AppConversation = {
      conversation_id: conversationId,
      title: (body.title as string) || "New Conversation",
      created_at: new Date().toISOString(),
      last_updated_at: new Date().toISOString(),
      status: "RUNNING",
      selected_repository: (body.selected_repository as string) || null,
      selected_branch: (body.selected_branch as string) || null,
      git_provider: (body.git_provider as string) || null,
      conversation_version: "V1",
      public: false,
    };

    V1_APP_CONVERSATIONS.set(conversationId, newConversation);

    return HttpResponse.json(startTask, { status: 201 });
  }),

  // Get start task by ID
  http.get("/api/v1/app-conversations/start-tasks", async ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.get("ids")?.split(",") || [];

    const tasks = ids.map((id) => V1_START_TASKS.get(id) || null);
    return HttpResponse.json(tasks);
  }),

  // Search start tasks
  http.get("/api/v1/app-conversations/start-tasks/search", async () => {
    const tasks = Array.from(V1_START_TASKS.values());
    return HttpResponse.json({ items: tasks });
  }),

  // Batch get V1 app conversations
  http.get("/api/v1/app-conversations", async ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.getAll("ids");

    if (ids.length > 0) {
      // Batch get by IDs
      const results = ids.map((id) => V1_APP_CONVERSATIONS.get(id) || null);
      return HttpResponse.json(results);
    }

    // List all conversations
    const values = Array.from(V1_APP_CONVERSATIONS.values());
    return HttpResponse.json(values);
  }),

  // Get single V1 app conversation
  http.get("/api/v1/app-conversations/:conversationId", async ({ params }) => {
    const conversationId = params.conversationId as string;
    const conversation = V1_APP_CONVERSATIONS.get(conversationId);

    if (conversation) {
      return HttpResponse.json(conversation);
    }
    return HttpResponse.json(null, { status: 404 });
  }),

  // Update V1 app conversation
  http.patch(
    "/api/v1/app-conversations/:conversationId",
    async ({ params, request }) => {
      const conversationId = params.conversationId as string;
      const conversation = V1_APP_CONVERSATIONS.get(conversationId);

      if (conversation) {
        const body = (await request.json()) as Record<string, unknown>;
        const updated: V1AppConversation = {
          ...conversation,
          ...body,
          last_updated_at: new Date().toISOString(),
        };
        V1_APP_CONVERSATIONS.set(conversationId, updated);
        return HttpResponse.json(updated);
      }
      return HttpResponse.json(null, { status: 404 });
    },
  ),

  // Get V1 conversation skills
  http.get(
    "/api/v1/app-conversations/:conversationId/skills",
    async () => {
      return HttpResponse.json({
        skills: [
          { name: "code-review", description: "Review code changes" },
          { name: "refactor", description: "Refactor code" },
        ],
      });
    },
  ),

  // V1 conversation events search
  http.post(
    "/api/v1/conversation/:conversationId/events/search",
    async () => {
      return HttpResponse.json({
        events: [],
        has_more: false,
      });
    },
  ),

  // ============================================
  // V1 Sandbox API Handlers
  // ============================================

  // List sandboxes
  http.get("/api/v1/sandboxes", async () => {
    return HttpResponse.json({
      items: [
        {
          id: "sandbox-1",
          status: "running",
          created_at: new Date().toISOString(),
        },
      ],
    });
  }),

  // Pause sandbox
  http.post("/api/v1/sandboxes/:sandboxId/pause", async () => {
    return HttpResponse.json({ success: true });
  }),

  // Resume sandbox
  http.post("/api/v1/sandboxes/:sandboxId/resume", async () => {
    return HttpResponse.json({ success: true });
  }),
];
