import { useTranslation } from "react-i18next";
import { Spinner } from "#/components/ui/spinner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "#/components/ui/accordion";
import { MicroagentManagementRepoMicroagents } from "./microagent-management-repo-microagents";
import { GitRepository } from "#/types/git";
import { TabType } from "#/types/microagent-management";
import { MicroagentManagementNoRepositories } from "./microagent-management-no-repositories";
import { I18nKey } from "#/i18n/declaration";
import { DOCUMENTATION_URL } from "#/utils/constants";
import { MicroagentManagementAccordionTitle } from "./microagent-management-accordion-title";

type MicroagentManagementRepositoriesProps = {
  repositories: GitRepository[];
  tabType: TabType;
  isSearchLoading?: boolean;
};

export function MicroagentManagementRepositories({
  repositories,
  tabType,
  isSearchLoading = false,
}: MicroagentManagementRepositoriesProps) {
  const { t } = useTranslation();

  const numberOfRepoMicroagents = repositories.length;

  // Show spinner when search is in progress, regardless of repository count
  if (isSearchLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Spinner size="sm" />
        <span className="text-sm text-white">
          {t("HOME$SEARCHING_REPOSITORIES")}
        </span>
      </div>
    );
  }

  if (numberOfRepoMicroagents === 0) {
    if (tabType === "personal") {
      return (
        <MicroagentManagementNoRepositories
          title={t(
            I18nKey.MICROAGENT_MANAGEMENT$YOU_DO_NOT_HAVE_USER_LEVEL_MICROAGENTS,
          )}
          documentationUrl={DOCUMENTATION_URL.MICROAGENTS.MICROAGENTS_OVERVIEW}
        />
      );
    }
    if (tabType === "repositories") {
      return (
        <MicroagentManagementNoRepositories
          title={t(I18nKey.MICROAGENT_MANAGEMENT$YOU_DO_NOT_HAVE_MICROAGENTS)}
          documentationUrl={DOCUMENTATION_URL.MICROAGENTS.MICROAGENTS_OVERVIEW}
        />
      );
    }
    if (tabType === "organizations") {
      return (
        <MicroagentManagementNoRepositories
          title={t(
            I18nKey.MICROAGENT_MANAGEMENT$YOU_DO_NOT_HAVE_ORGANIZATION_LEVEL_MICROAGENTS,
          )}
          documentationUrl={
            DOCUMENTATION_URL.MICROAGENTS.ORGANIZATION_AND_USER_MICROAGENTS
          }
        />
      );
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Repositories Accordion */}
      <Accordion type="multiple" className="w-full space-y-3">
        {repositories.map((repository) => (
          <AccordionItem
            key={repository.id}
            value={String(repository.id)}
            className="shadow-none bg-transparent border-none px-0"
          >
            <AccordionTrigger className="cursor-pointer gap-2 py-3 hover:no-underline text-white hover:bg-[#454545] rounded transition-colors duration-200">
              <MicroagentManagementAccordionTitle repository={repository} />
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <MicroagentManagementRepoMicroagents repository={repository} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
