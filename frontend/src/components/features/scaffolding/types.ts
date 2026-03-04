export type ProjectType = "react-vite" | "nextjs" | "vue-vite" | "nuxt";

export type UILibrary = "tailwind" | "shadcn" | "none";

export type Feature =
  | "typescript"
  | "dark_mode"
  | "supabase"
  | "auth"
  | "pwa"
  | "testing";

export interface ScaffoldingConfig {
  projectType: ProjectType;
  projectName: string;
  description: string;
  author?: string;
  uiLibrary: UILibrary;
  features: Feature[];
  packageManager: "npm" | "yarn" | "pnpm";
}

export interface ProjectTypeInfo {
  id: ProjectType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const PROJECT_TYPES: ProjectTypeInfo[] = [
  {
    id: "react-vite",
    name: "React + Vite",
    description: "Modern React with Vite for fast development",
    icon: "⚛️",
    color: "#61DAFB",
  },
  {
    id: "nextjs",
    name: "Next.js",
    description: "Full-stack React framework with App Router",
    icon: "▲",
    color: "#000000",
  },
  {
    id: "vue-vite",
    name: "Vue 3 + Vite",
    description: "Progressive Vue.js with Vite",
    icon: "💚",
    color: "#42B883",
  },
  {
    id: "nuxt",
    name: "Nuxt 3",
    description: "Full-stack Vue framework",
    icon: "💎",
    color: "#00DC82",
  },
];

export const UI_LIBRARIES: {
  id: UILibrary;
  name: string;
  description: string;
}[] = [
  {
    id: "tailwind",
    name: "Tailwind CSS",
    description: "Utility-first CSS framework",
  },
  {
    id: "shadcn",
    name: "shadcn/ui",
    description: "Re-usable components built with Radix UI and Tailwind",
  },
  {
    id: "none",
    name: "No UI Library",
    description: "Start with minimal styling",
  },
];

export const FEATURES: { id: Feature; name: string; description: string }[] = [
  {
    id: "typescript",
    name: "TypeScript",
    description: "Type-safe JavaScript",
  },
  {
    id: "dark_mode",
    name: "Dark Mode",
    description: "Built-in dark/light theme support",
  },
  {
    id: "supabase",
    name: "Supabase",
    description: "Backend-as-a-Service integration",
  },
  {
    id: "auth",
    name: "Authentication",
    description: "User authentication scaffolding",
  },
  {
    id: "testing",
    name: "Testing",
    description: "Test framework configuration",
  },
];
