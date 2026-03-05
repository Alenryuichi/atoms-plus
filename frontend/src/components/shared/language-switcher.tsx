import React from "react";
import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { motion } from "framer-motion";
import { AvailableLanguages } from "#/i18n";
import { Button } from "#/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { cn } from "#/lib/utils";

interface LanguageSwitcherProps {
  variant?: "icon" | "full";
  className?: string;
}

export function LanguageSwitcher({
  variant = "icon",
  className,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const currentLanguage = AvailableLanguages.find(
    (lang) => lang.value === i18n.language,
  );

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="ghost"
            size={variant === "icon" ? "icon" : "sm"}
            className={cn(
              "text-neutral-300 hover:text-white hover:bg-white/10",
              className,
            )}
            aria-label="Change language"
          >
            <Globe className="h-4 w-4" />
            {variant === "full" && (
              <span className="ml-2 text-sm">
                {currentLanguage?.label || "English"}
              </span>
            )}
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-[300px] overflow-y-auto bg-neutral-900 border-neutral-700/50"
      >
        {AvailableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => handleLanguageChange(lang.value)}
            className={cn(
              "flex items-center justify-between gap-3 cursor-pointer",
              "text-neutral-300 hover:text-white hover:bg-neutral-800",
              i18n.language === lang.value && "text-amber-400",
            )}
          >
            <span>{lang.label}</span>
            {i18n.language === lang.value && (
              <Check className="h-4 w-4 text-amber-400" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
