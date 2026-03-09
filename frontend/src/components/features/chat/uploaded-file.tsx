import {
  IconLoader2,
  IconFile,
  IconFileTypePdf,
  IconFileCode,
} from "@tabler/icons-react";
import { RemoveFileButton } from "./remove-file-button";
import { cn, getFileExtension } from "#/utils/utils";

interface UploadedFileProps {
  file: File;
  onRemove: () => void;
  isLoading?: boolean;
}

// Get file type icon and color based on extension
const getFileTypeInfo = (fileName: string) => {
  const ext = getFileExtension(fileName).toLowerCase();

  // PDF files
  if (ext === "pdf") {
    return {
      icon: IconFileTypePdf,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    };
  }

  // Code files
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "go",
      "rs",
      "rb",
      "php",
      "swift",
      "kt",
    ].includes(ext)
  ) {
    return {
      icon: IconFileCode,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    };
  }

  // Document files
  if (["doc", "docx", "txt", "md", "rtf"].includes(ext)) {
    return {
      icon: IconFile,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    };
  }

  // Default
  return {
    icon: IconFile,
    color: "text-neutral-400",
    bgColor: "bg-neutral-500/10",
    borderColor: "border-neutral-500/30",
  };
};

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

export function UploadedFile({
  file,
  onRemove,
  isLoading = false,
}: UploadedFileProps) {
  const fileTypeInfo = getFileTypeInfo(file.name);
  const FileIconComponent = fileTypeInfo.icon;
  const fileSize = formatFileSize(file.size);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 p-3 bg-neutral-900/60 rounded-xl border border-white/5 transition-all min-w-[200px]",
        !isLoading && `hover:${fileTypeInfo.borderColor}`,
        isLoading && "border-amber-500/30",
      )}
    >
      {/* File icon */}
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          fileTypeInfo.bgColor,
        )}
      >
        {isLoading ? (
          <IconLoader2
            size={20}
            className="text-amber-400 animate-spin"
            stroke={2}
          />
        ) : (
          <FileIconComponent
            size={20}
            className={fileTypeInfo.color}
            stroke={2}
          />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white/90 truncate">
          {file.name}
        </div>
        <div className="text-xs text-white/40 flex items-center gap-2">
          <span>{fileSize}</span>
          {!isLoading && (
            <>
              <span>•</span>
              <span className="text-emerald-400">✓ Uploaded</span>
            </>
          )}
          {isLoading && (
            <>
              <span>•</span>
              <span className="text-amber-400">Uploading...</span>
            </>
          )}
        </div>
      </div>

      {/* Remove button (hover to show) */}
      {!isLoading && <RemoveFileButton onClick={onRemove} />}
    </div>
  );
}
