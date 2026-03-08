import { useTranslation } from "react-i18next";

interface SystemMessageHeaderProps {
  agentClass: string | null;
  openhandsVersion: string | null;
}

export function SystemMessageHeader({
  agentClass,
  openhandsVersion,
}: SystemMessageHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Modal title with refined typography */}
      <h2 className="text-lg font-semibold text-white/90 tracking-tight">
        {t("SYSTEM_MESSAGE_MODAL$TITLE")}
      </h2>

      {/* Metadata badges */}
      {(agentClass || openhandsVersion) && (
        <div className="flex flex-wrap gap-3">
          {agentClass && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="text-xs text-white/50">
                {t("SYSTEM_MESSAGE_MODAL$AGENT_CLASS")}
              </span>
              <span className="text-xs font-medium text-white/80">
                {agentClass}
              </span>
            </div>
          )}
          {openhandsVersion && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="text-xs text-white/50">
                {t("SYSTEM_MESSAGE_MODAL$OPENHANDS_VERSION")}
              </span>
              <span className="text-xs font-medium text-white/80">
                {openhandsVersion}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
