import type { ReactNode } from "react";

type DashboardTopbarProps = {
  brandName?: string;
  searchId: string;
  searchPlaceholder: string;
  searchIcon?: ReactNode;
  userName?: string;
  userRole?: string;
  avatarSlot?: ReactNode;
  rightActions: ReactNode;
  notifications?: string[];
  showNotifications?: boolean;
};

export default function DashboardTopbar({
  searchId,
  searchPlaceholder,
  searchIcon,
  userName,
  userRole,
  avatarSlot,
  rightActions,
  notifications,
  showNotifications,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-30 h-16 flex items-center gap-4 px-6 border-b border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
      <label className="relative flex-1 max-w-md" htmlFor={searchId}>
        {searchIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {searchIcon}
          </span>
        )}
        <input
          id={searchId}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
        />
      </label>

      <div className="ml-auto flex items-center gap-3">
        {rightActions}

        {(userName || userRole) && (
          <div className="hidden sm:flex flex-col items-end text-right">
            {userName && <span className="text-sm font-semibold text-slate-900 dark:text-white">{userName}</span>}
            {userRole && <span className="text-[10px] text-slate-400 uppercase tracking-wider">{userRole}</span>}
          </div>
        )}

        {avatarSlot}
      </div>

      {showNotifications && notifications && notifications.length > 0 && (
        <div className="absolute top-full right-6 mt-2 w-80 glass-strong rounded-2xl p-3 shadow-xl z-50 space-y-1">
          {notifications.map((note, i) => (
            <p key={`${note}-${i}`} className="text-sm text-slate-600 dark:text-slate-300 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors">
              {note}
            </p>
          ))}
        </div>
      )}
    </header>
  );
}
