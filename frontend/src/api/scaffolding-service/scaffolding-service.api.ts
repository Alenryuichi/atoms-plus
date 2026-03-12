import {
  ScaffoldingConfig,
  ScaffoldingCreateResult,
  ScaffoldingLaunchResult,
  ScaffoldingPreset,
  ScaffoldingTemplate,
} from "#/components/features/scaffolding/types";
import { openHands } from "../open-hands-axios";
import {
  ScaffoldingCreateRequestDto,
  ScaffoldingCreateResponseDto,
  ScaffoldingFeaturesResponseDto,
  ScaffoldingLaunchResponseDto,
  ScaffoldingPresetsResponseDto,
  ScaffoldingProjectTypesResponseDto,
  ScaffoldingTemplatesResponseDto,
  ScaffoldingUiLibrariesResponseDto,
} from "./scaffolding-service.types";

const mapTemplate = (
  template: ScaffoldingTemplatesResponseDto["templates"][number],
): ScaffoldingTemplate => ({
  id: template.id,
  name: template.name,
  description: template.description,
  projectType: template.project_type,
  supportedUiLibraries: template.supported_ui_libraries,
  previewImage: template.preview_image,
  tags: template.tags,
});

const mapPreset = (
  preset: ScaffoldingPresetsResponseDto["presets"][number],
): ScaffoldingPreset => ({
  id: preset.id,
  title: preset.title,
  description: preset.description,
  category: preset.category,
  templateId: preset.template_id,
  previewImage: preset.preview_image,
  tags: preset.tags,
  defaultConfig: preset.default_config
    ? {
        projectType: preset.default_config.project_type,
        uiLibrary: preset.default_config.ui_library,
        features: preset.default_config.features,
        description: preset.default_config.description,
        packageManager: preset.default_config.package_manager,
      }
    : undefined,
  supportedOverrides: {
    uiLibrary: preset.supported_overrides.ui_library,
    features: preset.supported_overrides.features,
    projectName: preset.supported_overrides.project_name,
    description: preset.supported_overrides.description,
    packageManager: preset.supported_overrides.package_manager,
  },
});

const mapCreateResult = (
  result: ScaffoldingCreateResponseDto,
): ScaffoldingCreateResult => ({
  success: result.success,
  projectPath: result.project_path,
  filesCreated: result.files_created,
  generatedFiles: result.generated_files,
  errors: result.errors,
  warnings: result.warnings,
  nextSteps: result.next_steps,
  templateId: result.template_id,
  presetId: result.preset_id,
});

const mapLaunchResult = (
  result: ScaffoldingLaunchResponseDto,
): ScaffoldingLaunchResult => ({
  success: result.success,
  navigationId: result.conversation_id,
  startTaskId: result.start_task_id,
  status: result.status,
  detail: result.detail,
  errors: result.errors,
  warnings: result.warnings,
  templateId: result.template_id,
  presetId: result.preset_id,
  projectName: result.project_name,
});

class ScaffoldingService {
  static async getTemplates(): Promise<{
    templates: ScaffoldingTemplate[];
    total: number;
  }> {
    const { data } = await openHands.get<ScaffoldingTemplatesResponseDto>(
      "/api/v1/scaffolding/templates",
    );
    return {
      templates: data.templates.map(mapTemplate),
      total: data.total,
    };
  }

  static async getPresets(): Promise<{
    presets: ScaffoldingPreset[];
    total: number;
  }> {
    const { data } = await openHands.get<ScaffoldingPresetsResponseDto>(
      "/api/v1/scaffolding/presets",
    );
    return {
      presets: data.presets.map(mapPreset),
      total: data.total,
    };
  }

  static async getProjectTypes(): Promise<ScaffoldingProjectTypesResponseDto> {
    const { data } = await openHands.get<ScaffoldingProjectTypesResponseDto>(
      "/api/v1/scaffolding/project-types",
    );
    return data;
  }

  static async getUiLibraries(): Promise<ScaffoldingUiLibrariesResponseDto> {
    const { data } = await openHands.get<ScaffoldingUiLibrariesResponseDto>(
      "/api/v1/scaffolding/ui-libraries",
    );
    return data;
  }

  static async getFeatures(): Promise<ScaffoldingFeaturesResponseDto> {
    const { data } = await openHands.get<ScaffoldingFeaturesResponseDto>(
      "/api/v1/scaffolding/features",
    );
    return data;
  }

  static async createProject(
    config: ScaffoldingConfig,
  ): Promise<ScaffoldingCreateResult> {
    const payload: ScaffoldingCreateRequestDto = {
      name: config.projectName,
      project_type: config.projectType,
      template_id: config.templateId,
      preset_id: config.presetId,
      description: config.description,
      author: config.author,
      ui_library: config.uiLibrary,
      features: config.features,
      package_manager: config.packageManager,
      supabase_url: config.supabaseUrl,
      supabase_anon_key: config.supabaseAnonKey,
    };
    const { data } = await openHands.post<ScaffoldingCreateResponseDto>(
      "/api/v1/scaffolding/create",
      payload,
    );
    return mapCreateResult(data);
  }

  static async launchProject(
    config: ScaffoldingConfig,
  ): Promise<ScaffoldingLaunchResult> {
    const { data } = await openHands.post<ScaffoldingLaunchResponseDto>(
      "/api/v1/scaffolding/launch",
      {
        preset_id: config.presetId,
        template_id: config.templateId,
        project_name: config.projectName,
        description: config.description,
        author: config.author,
        ui_library: config.uiLibrary,
        features: config.features,
        package_manager: config.packageManager,
        supabase_url: config.supabaseUrl,
        supabase_anon_key: config.supabaseAnonKey,
      },
    );
    return mapLaunchResult(data);
  }
}

export default ScaffoldingService;
