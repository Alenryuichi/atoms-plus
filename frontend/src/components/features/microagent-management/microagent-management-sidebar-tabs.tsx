import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { MicroagentManagementRepositories } from "./microagent-management-repositories";
import { I18nKey } from "#/i18n/declaration";
import { useMicroagentManagementStore } from "#/stores/microagent-management-store";

interface MicroagentManagementSidebarTabsProps {
  isSearchLoading?: boolean;
}

export function MicroagentManagementSidebarTabs({
  isSearchLoading = false,
}: MicroagentManagementSidebarTabsProps) {
  const { t } = useTranslation();

  const { repositories, personalRepositories, organizationRepositories } =
    useMicroagentManagementStore();

  return (
    <div className="flex w-full flex-col py-6">
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full bg-transparent border border-[#ffffff40] rounded-[6px]">
          <TabsTrigger
            value="personal"
            className="px-2 h-[22px] text-white text-[12px] font-normal data-[state=active]:bg-[#C9B97480] data-[state=active]:rounded-sm"
          >
            {t(I18nKey.COMMON$PERSONAL)}
          </TabsTrigger>
          <TabsTrigger
            value="repositories"
            className="px-2 h-[22px] text-white text-[12px] font-normal data-[state=active]:bg-[#C9B97480] data-[state=active]:rounded-sm"
          >
            {t(I18nKey.COMMON$REPOSITORIES)}
          </TabsTrigger>
          <TabsTrigger
            value="organizations"
            className="px-2 h-[22px] text-white text-[12px] font-normal data-[state=active]:bg-[#C9B97480] data-[state=active]:rounded-sm"
          >
            {t(I18nKey.COMMON$ORGANIZATIONS)}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="personal" className="p-0">
          <MicroagentManagementRepositories
            repositories={personalRepositories}
            tabType="personal"
            isSearchLoading={isSearchLoading}
          />
        </TabsContent>
        <TabsContent value="repositories" className="p-0">
          <MicroagentManagementRepositories
            repositories={repositories}
            tabType="repositories"
            isSearchLoading={isSearchLoading}
          />
        </TabsContent>
        <TabsContent value="organizations" className="p-0">
          <MicroagentManagementRepositories
            repositories={organizationRepositories}
            tabType="organizations"
            isSearchLoading={isSearchLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
