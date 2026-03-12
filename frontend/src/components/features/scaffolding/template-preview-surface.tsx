import { ScaffoldingPreset } from "./types";

const PREVIEW_ACCENTS: Record<string, string> = {
  saas: "from-sky-400/30 via-indigo-400/15 to-violet-500/30",
  ecommerce: "from-rose-400/30 via-orange-400/15 to-amber-500/30",
  internal: "from-slate-200/15 via-slate-400/10 to-cyan-400/25",
  personal: "from-emerald-300/25 via-teal-300/10 to-cyan-400/25",
};

interface TemplatePreviewSurfaceProps {
  preset: ScaffoldingPreset;
  variant?: "card" | "modal";
  alt?: string;
}

export function TemplatePreviewSurface({
  preset,
  variant = "card",
  alt = "",
}: TemplatePreviewSurfaceProps) {
  const projectTypeLabel = preset.defaultConfig?.projectType ?? "starter";
  const uiLibraryLabel = preset.defaultConfig?.uiLibrary ?? "template";
  const showSidebar =
    preset.category === "internal" || preset.tags.includes("dashboard");
  const showHero =
    preset.category === "personal" || preset.tags.includes("portfolio");
  const showArticleList =
    preset.tags.includes("blog") || preset.tags.includes("content");
  const isModal = variant === "modal";

  return (
    <div
      className={`relative overflow-hidden border border-white/10 bg-neutral-950/85 ${
        isModal
          ? "rounded-[1.8rem] shadow-[0_40px_120px_rgba(2,6,23,0.55)]"
          : "rounded-[1.15rem] shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${
          PREVIEW_ACCENTS[preset.category] ?? PREVIEW_ACCENTS.saas
        }`}
      />
      <div
        className={`relative overflow-hidden ${
          isModal ? "aspect-[5/4] sm:aspect-[4/3]" : "aspect-[16/10]"
        }`}
      >
        {preset.previewImage ? (
          <img
            src={preset.previewImage}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="pointer-events-none h-full w-full object-cover object-top"
          />
        ) : (
          <div
            aria-hidden="true"
            className={`pointer-events-none flex h-full gap-3 ${
              isModal ? "px-6 pb-6 pt-14" : "px-4 pb-4 pt-11"
            }`}
          >
            {showSidebar ? (
              <div
                className={`shrink-0 rounded-xl border border-white/10 bg-white/6 ${
                  isModal ? "w-20 p-3" : "w-14 p-2"
                }`}
              >
                <div
                  className={`rounded-full bg-white/45 ${
                    isModal ? "h-2.5 w-10" : "h-2 w-7"
                  }`}
                />
                <div className={`space-y-2 ${isModal ? "mt-4" : "mt-3"}`}>
                  <div className="h-2 rounded-full bg-white/20" />
                  <div className="h-2 rounded-full bg-white/15" />
                  <div className="h-2 rounded-full bg-white/15" />
                  <div
                    className={`rounded-lg bg-cyan-300/15 ${
                      isModal ? "h-16" : "h-10"
                    }`}
                  />
                </div>
              </div>
            ) : null}
            <div
              className={`flex min-w-0 flex-1 flex-col ${
                isModal ? "gap-4" : "gap-3"
              }`}
            >
              {showHero ? (
                <div
                  className={`rounded-2xl border border-white/10 bg-white/8 ${
                    isModal ? "p-5" : "p-4"
                  }`}
                >
                  <div className="h-3 w-2/3 rounded-full bg-white/70" />
                  <div className="mt-2 h-2 w-1/2 rounded-full bg-white/25" />
                  <div className={`mt-4 flex gap-2 ${isModal ? "mt-5" : ""}`}>
                    <div
                      className={`rounded-full bg-emerald-300/35 ${
                        isModal ? "h-8 w-24" : "h-7 w-20"
                      }`}
                    />
                    <div
                      className={`rounded-full bg-white/10 ${
                        isModal ? "h-8 w-20" : "h-7 w-16"
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`rounded-2xl border border-white/10 bg-sky-300/18 ${
                      isModal ? "h-24" : "h-16"
                    }`}
                  />
                  <div
                    className={`rounded-2xl border border-white/10 bg-white/8 ${
                      isModal ? "h-24" : "h-16"
                    }`}
                  />
                </div>
              )}
              {showArticleList ? (
                <div
                  className={`rounded-2xl border border-white/10 bg-white/8 ${
                    isModal ? "p-4" : "p-3"
                  }`}
                >
                  <div
                    className={`rounded-xl bg-gradient-to-r from-orange-300/35 to-rose-300/20 ${
                      isModal ? "h-28" : "h-20"
                    }`}
                  />
                  <div className={`space-y-2 ${isModal ? "mt-4" : "mt-3"}`}>
                    <div className="h-2.5 w-4/5 rounded-full bg-white/45" />
                    <div className="h-2 w-full rounded-full bg-white/15" />
                    <div className="h-2 w-3/4 rounded-full bg-white/15" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div
                    className={`rounded-2xl border border-white/10 bg-white/8 ${
                      isModal ? "h-24" : "h-20"
                    }`}
                  />
                  <div
                    className={`rounded-2xl border border-white/10 bg-indigo-300/20 ${
                      isModal ? "h-24" : "h-20"
                    }`}
                  />
                  <div
                    className={`rounded-2xl border border-white/10 bg-white/8 ${
                      isModal ? "h-24" : "h-20"
                    }`}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        <div
          className={`pointer-events-none absolute flex items-center justify-between border border-white/10 bg-neutral-950/45 backdrop-blur-sm ${
            isModal
              ? "left-3 right-3 top-3 rounded-t-[1.1rem] rounded-b-2xl px-4 py-3"
              : "left-2.5 right-2.5 top-2.5 rounded-t-[0.95rem] rounded-b-xl px-3 py-2"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span
            className={`font-medium uppercase tracking-[0.18em] text-neutral-300/90 ${
              isModal ? "text-[11px]" : "text-[10px]"
            }`}
          >
            {projectTypeLabel}
          </span>
          <span
            className={`rounded-full border border-white/10 bg-white/8 font-medium uppercase tracking-[0.14em] text-neutral-300/80 ${
              isModal ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]"
            }`}
          >
            {uiLibraryLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
