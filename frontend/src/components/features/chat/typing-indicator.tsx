export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1.5 bg-black/50 backdrop-blur-sm border border-amber-500/20 px-3 py-1.5 rounded-full shadow-lg shadow-black/20">
      <span
        className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-[bounce_0.6s_infinite]"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="w-1.5 h-1.5 bg-amber-500/80 rounded-full animate-[bounce_0.6s_infinite]"
        style={{ animationDelay: "100ms" }}
      />
      <span
        className="w-1.5 h-1.5 bg-amber-500/60 rounded-full animate-[bounce_0.6s_infinite]"
        style={{ animationDelay: "200ms" }}
      />
    </div>
  );
}
