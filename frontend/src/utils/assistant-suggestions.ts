const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;
const SUGGESTION_HEADER_PATTERN =
  /(?:^|\n)\s*(?:suggestions?|next steps?|try asking|建议|下一步)[：:]\s*\n?/i;
const BULLET_PATTERN = /^\s*(?:[-*•]|\d+[.)])\s+(.+?)\s*$/;
const INLINE_SPLIT_PATTERN = /[;；]/;
const INLINE_BULLET_SPLIT_PATTERN = /\s+-\s+/;
const INLINE_BULLET_DETECT_PATTERN = /\s+-\s+/g;
const LEADING_SUGGESTION_PATTERN =
  /^(?:如需|如果需要|你也可以|可以继续|接下来可以|建议(?:你)?|可继续)(.+)$/;

const normalizeSuggestion = (text: string): string => {
  let normalized = text
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/\[[^\]]+\]\([^)]+\)/g, "")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/[。！!？?；;，,]+$/g, "")
    .trim();

  normalized = normalized
    .replace(/^请\b/, "")
    .replace(/^直接\b/, "")
    .replace(/^帮我\b/, "")
    .replace(/^继续\b/, "")
    .replace(/，?直接告诉我即可$/g, "")
    .replace(/，?告诉我即可$/g, "")
    .replace(/即可$/g, "")
    .trim();

  return normalized;
};

const isUsefulSuggestion = (text: string): boolean =>
  text.length >= 4 &&
  text.length <= 40 &&
  !/^#+\s/.test(text) &&
  !text.includes("```");

const splitInlineBulletSuggestions = (text: string): string[] => {
  const normalized = normalizeSuggestion(text);
  if (!normalized) {
    return [];
  }

  const hasMultipleBullets =
    (normalized.match(INLINE_BULLET_DETECT_PATTERN) || []).length >= 2;

  if (!hasMultipleBullets) {
    return [normalized];
  }

  return normalized
    .split(INLINE_BULLET_SPLIT_PATTERN)
    .map((part) => normalizeSuggestion(part))
    .filter(isUsefulSuggestion);
};

const collectBulletSuggestions = (content: string): string[] => {
  const suggestions: string[] = [];
  let hasStarted = false;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    const bulletMatch = trimmed.match(BULLET_PATTERN);
    if (bulletMatch) {
      splitInlineBulletSuggestions(bulletMatch[1]).forEach((suggestion) => {
        suggestions.push(suggestion);
        hasStarted = true;
      });
      continue;
    }

    if (hasStarted) {
      break;
    }
  }

  return suggestions;
};

export const parseAssistantSuggestions = (content: string): string[] => {
  if (!content.trim()) return [];

  const cleaned = content.replace(CODE_BLOCK_PATTERN, "").trim();

  const headerMatch = cleaned.match(SUGGESTION_HEADER_PATTERN);
  if (headerMatch?.index !== undefined) {
    const section = cleaned.slice(headerMatch.index + headerMatch[0].length);
    return collectBulletSuggestions(section).slice(0, 3);
  }

  const suggestions: string[] = [];
  cleaned.split("\n").forEach((line) => {
    const trimmed = line.trim();
    const leadingMatch = trimmed.match(LEADING_SUGGESTION_PATTERN);
    if (leadingMatch) {
      leadingMatch[1]
        .split(INLINE_SPLIT_PATTERN)
        .flatMap((part) => splitInlineBulletSuggestions(part))
        .filter(isUsefulSuggestion)
        .forEach((part) => suggestions.push(part));
    }
  });

  return suggestions.slice(0, 3);
};
