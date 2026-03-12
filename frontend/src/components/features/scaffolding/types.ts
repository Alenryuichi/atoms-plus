export type ProjectType = "react-vite" | "nextjs" | "vue-vite" | "nuxt";

export type UILibrary = "tailwind" | "shadcn" | "primevue" | "none";

export type Feature =
  | "typescript"
  | "eslint"
  | "prettier"
  | "testing"
  | "supabase"
  | "auth"
  | "dark-mode"
  | "responsive"
  | "pwa"
  | "i18n";

export type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

export type PresetCategory =
  | "saas"
  | "ecommerce"
  | "internal"
  | "personal";

export interface ScaffoldingConfig {
  projectType: ProjectType;
  projectName: string;
  description: string;
  author?: string;
  templateId?: string;
  presetId?: string;
  uiLibrary: UILibrary;
  features: Feature[];
  packageManager: PackageManager;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface ScaffoldingTemplate {
  id: string;
  name: string;
  description: string;
  projectType: ProjectType;
  supportedUiLibraries: UILibrary[];
  previewImage?: string;
  tags: string[];
}

export interface ScaffoldingPresetDefaultConfig {
  projectType: ProjectType;
  uiLibrary: UILibrary;
  features: Feature[];
  description?: string;
  packageManager?: PackageManager;
}

export interface ScaffoldingPresetSupportedOverrides {
  uiLibrary: boolean;
  features: boolean;
  projectName: boolean;
  description: boolean;
  packageManager: boolean;
}

export interface ScaffoldingPreset {
  id: string;
  title: string;
  description: string;
  category: PresetCategory;
  templateId: string;
  previewImage?: string;
  tags: string[];
  defaultConfig?: ScaffoldingPresetDefaultConfig;
  supportedOverrides: ScaffoldingPresetSupportedOverrides;
}

export interface ScaffoldingLaunchResult {
  success: boolean;
  navigationId: string;
  startTaskId: string;
  status: string;
  detail?: string | null;
  errors: string[];
  warnings: string[];
  templateId?: string | null;
  presetId?: string | null;
  projectName: string;
}

export interface ScaffoldingCreateResult {
  success: boolean;
  projectPath: string;
  filesCreated: string[];
  generatedFiles: string[];
  errors: string[];
  warnings: string[];
  nextSteps: string[];
  templateId?: string | null;
  presetId?: string | null;
}

export interface ProjectTypeInfo {
  id: ProjectType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const PROJECT_TYPE_METADATA: Record<ProjectType, ProjectTypeInfo> = {
  "react-vite": {
    id: "react-vite",
    name: "React + Vite",
    description: "Modern React with Vite for fast development",
    icon: "⚛️",
    color: "#61DAFB",
  },
  nextjs: {
    id: "nextjs",
    name: "Next.js",
    description: "Full-stack React framework with App Router",
    icon: "▲",
    color: "#000000",
  },
  "vue-vite": {
    id: "vue-vite",
    name: "Vue 3 + Vite",
    description: "Progressive Vue.js with Vite",
    icon: "💚",
    color: "#42B883",
  },
  nuxt: {
    id: "nuxt",
    name: "Nuxt 3",
    description: "Full-stack Vue framework",
    icon: "💎",
    color: "#00DC82",
  },
};

export const UI_LIBRARY_METADATA: Record<
  UILibrary,
  { id: UILibrary; name: string; description: string }
> = {
  tailwind: {
    id: "tailwind",
    name: "Tailwind CSS",
    description: "Utility-first CSS framework",
  },
  shadcn: {
    id: "shadcn",
    name: "shadcn/ui",
    description: "Reusable components built with Radix UI and Tailwind",
  },
  primevue: {
    id: "primevue",
    name: "PrimeVue",
    description: "Vue-first component suite for dashboards and data-heavy apps",
  },
  none: {
    id: "none",
    name: "No UI Library",
    description: "Start with minimal styling",
  },
};

export const FEATURE_METADATA: Record<
  Feature,
  { id: Feature; name: string; description: string }
> = {
  typescript: {
    id: "typescript",
    name: "TypeScript",
    description: "Type-safe JavaScript setup",
  },
  eslint: {
    id: "eslint",
    name: "ESLint",
    description: "Linting configuration for code quality",
  },
  prettier: {
    id: "prettier",
    name: "Prettier",
    description: "Automatic formatting configuration",
  },
  testing: {
    id: "testing",
    name: "Testing",
    description: "Test runner and starter test files",
  },
  supabase: {
    id: "supabase",
    name: "Supabase",
    description: "Backend-as-a-service integration hooks",
  },
  auth: {
    id: "auth",
    name: "Authentication",
    description: "Starter auth flows and gated sections",
  },
  "dark-mode": {
    id: "dark-mode",
    name: "Dark Mode",
    description: "Built-in theme toggling support",
  },
  responsive: {
    id: "responsive",
    name: "Responsive",
    description: "Mobile-first responsive layout defaults",
  },
  pwa: {
    id: "pwa",
    name: "PWA",
    description: "Progressive web app configuration",
  },
  i18n: {
    id: "i18n",
    name: "i18n",
    description: "Internationalization starter wiring",
  },
};
