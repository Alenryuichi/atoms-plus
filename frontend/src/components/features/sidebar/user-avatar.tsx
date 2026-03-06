import Avatar from "boring-avatars";
import { LoadingSpinner } from "#/components/shared/loading-spinner";
import { cn } from "#/lib/utils";
import { Avatar as RealAvatar } from "./avatar";

// Atoms Plus 配色方案
const AVATAR_COLORS = [
  "#d4a855", // atoms-accent-primary (金色)
  "#f5d799", // 浅金色
  "#b8860b", // 深金色
  "#1a1a1a", // atoms-bg-primary (深色)
  "#2a2a2a", // atoms-bg-secondary
];

// localStorage key for guest avatar seed
const GUEST_SEED_KEY = "atoms-guest-avatar-seed";

/**
 * 获取或生成访客的唯一种子
 * 同一浏览器的访客会看到一致的头像
 */
function getGuestSeed(): string {
  if (typeof window === "undefined") return "guest-ssr";

  let seed = localStorage.getItem(GUEST_SEED_KEY);
  if (!seed) {
    seed = `guest-${crypto.randomUUID()}`;
    localStorage.setItem(GUEST_SEED_KEY, seed);
  }
  return seed;
}

interface UserAvatarProps {
  onClick: () => void;
  avatarUrl?: string;
  userEmail?: string;
  userName?: string;
  isLoading?: boolean;
}

export function UserAvatar({
  onClick,
  avatarUrl,
  userEmail,
  userName,
  isLoading,
}: UserAvatarProps) {
  // 确定 avatar 种子：email > userName > guest seed
  const avatarSeed = userEmail || userName || getGuestSeed();

  return (
    <button
      type="button"
      data-testid="user-avatar"
      className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center cursor-pointer overflow-hidden",
        "ring-2 ring-transparent hover:ring-primary/30 transition-all duration-200",
        isLoading && "bg-transparent",
      )}
      onClick={onClick}
    >
      {!isLoading && avatarUrl && <RealAvatar src={avatarUrl} />}
      {!isLoading && !avatarUrl && (
        <Avatar
          size={36}
          name={avatarSeed}
          variant="beam"
          colors={AVATAR_COLORS}
        />
      )}
      {isLoading && <LoadingSpinner size="small" />}
    </button>
  );
}
