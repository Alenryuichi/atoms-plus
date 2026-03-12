import type {
  Feature,
  PackageManager,
  ProjectType,
  ScaffoldingConfig,
  UILibrary,
} from "#/components/features/scaffolding/types";

export interface ScaffoldingTemplateDto {
  id: string;
  name: string;
  description: string;
  project_type: ProjectType;
  supported_ui_libraries: UILibrary[];
  preview_image?: string;
  tags: string[];
}

export interface ScaffoldingTemplatesResponseDto {
  templates: ScaffoldingTemplateDto[];
  total: number;
}

export interface ScaffoldingPresetDefaultConfigDto {
  project_type: ProjectType;
  ui_library: UILibrary;
  features: Feature[];
  description?: string;
  package_manager?: PackageManager;
}

export interface ScaffoldingPresetSupportedOverridesDto {
  ui_library: boolean;
  features: boolean;
  project_name: boolean;
  description: boolean;
  package_manager: boolean;
}

export interface ScaffoldingPresetDto {
  id: string;
  title: string;
  description: string;
  category: "saas" | "ecommerce" | "internal" | "personal";
  template_id: string;
  preview_image?: string;
  tags: string[];
  default_config?: ScaffoldingPresetDefaultConfigDto | null;
  supported_overrides: ScaffoldingPresetSupportedOverridesDto;
}

export interface ScaffoldingPresetsResponseDto {
  presets: ScaffoldingPresetDto[];
  total: number;
}

export interface ScaffoldingOptionDto<T extends string> {
  id: T;
  name: string;
}

export interface ScaffoldingLaunchRequestDto {
  preset_id?: string;
  template_id?: string;
  project_name: string;
  description: string;
  author?: string;
  ui_library: UILibrary;
  features: Feature[];
  package_manager: PackageManager;
  supabase_url?: string;
  supabase_anon_key?: string;
}

export interface ScaffoldingLaunchResponseDto {
  success: boolean;
  conversation_id: string;
  start_task_id: string;
  status: string;
  detail?: string | null;
  warnings: string[];
  errors: string[];
  template_id?: string | null;
  preset_id?: string | null;
  project_name: string;
}

export interface ScaffoldingCreateRequestDto {
  name: string;
  project_type: ProjectType;
  template_id?: string;
  preset_id?: string;
  description: string;
  author?: string;
  ui_library: UILibrary;
  features: Feature[];
  package_manager: PackageManager;
  supabase_url?: string;
  supabase_anon_key?: string;
}

export interface ScaffoldingCreateResponseDto {
  success: boolean;
  project_path: string;
  files_created: string[];
  generated_files: string[];
  errors: string[];
  warnings: string[];
  next_steps: string[];
  template_id?: string | null;
  preset_id?: string | null;
}

export interface ScaffoldingFeaturesResponseDto {
  features: ScaffoldingOptionDto<Feature>[];
}

export interface ScaffoldingUiLibrariesResponseDto {
  ui_libraries: ScaffoldingOptionDto<UILibrary>[];
}

export interface ScaffoldingProjectTypesResponseDto {
  project_types: ScaffoldingOptionDto<ProjectType>[];
}

export type ScaffoldingLaunchInput = ScaffoldingConfig;
