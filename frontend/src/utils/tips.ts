import { I18nKey } from "#/i18n/declaration";

export interface Tip {
  key: I18nKey;
  link?: string;
}

export const TIPS: Tip[] = [
  { key: I18nKey.TIPS$DEEP_RESEARCH },
  { key: I18nKey.TIPS$SPECIFY_FILES },
  { key: I18nKey.TIPS$SAVE_WORK },
  { key: I18nKey.TIPS$ROLE_SELECTION },
  { key: I18nKey.TIPS$APP_PREVIEW },
  { key: I18nKey.TIPS$ITERATIVE_REFINEMENT },
];

export function getRandomTip(): Tip {
  const randomIndex = Math.floor(Math.random() * TIPS.length);
  return TIPS[randomIndex];
}
