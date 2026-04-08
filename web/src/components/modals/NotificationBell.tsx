import { Bell } from "lucide-react";

type NotificationBellProps = {
  prefix?: string;
  unreadCount: number;
  onToggle: () => void;
};

export default function NotificationBell({ unreadCount, onToggle }: NotificationBellProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
      aria-label="Notifications"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
