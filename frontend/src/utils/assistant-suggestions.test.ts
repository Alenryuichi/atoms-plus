import { describe, expect, it } from "vitest";
import { parseAssistantSuggestions } from "./assistant-suggestions";

describe("parseAssistantSuggestions", () => {
  it("extracts bullet suggestions from an explicit suggestions section", () => {
    const content = `已完成页面。\n\n下一步：\n- 添加深色模式\n- 补充移动端适配\n- 增加交互动效`;

    expect(parseAssistantSuggestions(content)).toEqual([
      "添加深色模式",
      "补充移动端适配",
      "增加交互动效",
    ]);
  });

  it("supports spaced markdown bullet lists under a suggestions heading", () => {
    const content =
      "Suggestions:\n\n- Add a testimonials section\n\n- Improve mobile spacing\n\n- Add a CTA footer";

    expect(parseAssistantSuggestions(content)).toEqual([
      "Add a testimonials section",
      "Improve mobile spacing",
      "Add a CTA footer",
    ]);
  });

  it("splits single-line bullet suggestions under a heading into 3 chips", () => {
    const content = "下一步： - 霓虹按钮配色 - 卡片悬浮阴影 - 页脚联系方式";

    expect(parseAssistantSuggestions(content)).toEqual([
      "霓虹按钮配色",
      "卡片悬浮阴影",
      "页脚联系方式",
    ]);
  });

  it("extracts inline suggestions from leading suggestion phrasing", () => {
    const content =
      "如需修改日期信息；添加报名成功提示；优化嘉宾介绍布局，直接告诉我即可！";

    expect(parseAssistantSuggestions(content)).toEqual([
      "修改日期信息",
      "添加报名成功提示",
      "优化嘉宾介绍布局",
    ]);
  });

  it("ignores code blocks and returns empty when no suggestion exists", () => {
    const content = `这是最终结果。\n\n\`\`\`tsx\nconst a = 1;\n\`\`\`\n\n页面已经完成。`;

    expect(parseAssistantSuggestions(content)).toEqual([]);
  });

  it("does not treat ordinary summary bullets as suggestions", () => {
    const content = `已完成以下内容：\n- 用户登录\n- 权限校验\n- 仪表盘布局`;

    expect(parseAssistantSuggestions(content)).toEqual([]);
  });
});
