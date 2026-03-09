import React from "react";
import { IconLoader2 } from "@tabler/icons-react";
import { RemoveFileButton } from "./remove-file-button";
import { cn } from "#/utils/utils";

interface UploadedImageProps {
  image: File;
  onRemove: () => void;
  isLoading?: boolean;
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

export function UploadedImage({
  image,
  onRemove,
  isLoading = false,
}: UploadedImageProps) {
  const [imageUrl, setImageUrl] = React.useState<string>("");
  const fileSize = formatFileSize(image.size);

  React.useEffect(() => {
    // Create object URL for image preview
    const url = URL.createObjectURL(image);
    setImageUrl(url);

    // Cleanup function to revoke object URL
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [image]);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 p-3 bg-neutral-900/60 rounded-xl border border-white/5 transition-all min-w-[200px]",
        !isLoading && "hover:border-blue-500/30",
        isLoading && "border-amber-500/30",
      )}
    >
      {/* Image thumbnail */}
      <div className="w-10 h-10 bg-blue-500/10 rounded-lg overflow-hidden flex items-center justify-center">
        {isLoading ? (
          <IconLoader2
            size={20}
            className="text-amber-400 animate-spin"
            stroke={2}
          />
        ) : (
          imageUrl && (
            <img
              src={imageUrl}
              alt={image.name}
              className="w-full h-full object-cover"
            />
          )
        )}
      </div>

      {/* Image info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white/90 truncate">
          {image.name}
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
