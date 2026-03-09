interface SystemMessageContentProps {
  content: string;
}

export function SystemMessageContent({ content }: SystemMessageContentProps) {
  return (
    <div className="pt-2">
      <pre className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap font-mono bg-black/20 border border-white/5 rounded-lg p-4 max-h-[50vh] overflow-auto custom-scrollbar-always">
        {content}
      </pre>
    </div>
  );
}
