import { useTranslation } from "react-i18next";
import { BlurText } from "#/components/ui/blur-text";

export function HomeHeaderTitle() {
  const { t } = useTranslation();

  return (
    <div className="h-[80px] flex items-center">
      <BlurText
        text={t("HOME$LETS_START_BUILDING")}
        className="text-[32px] text-white font-bold leading-tight -tracking-[0.02em] text-balance"
        delay={80}
        animateBy="words"
        direction="top"
      />
    </div>
  );
}
