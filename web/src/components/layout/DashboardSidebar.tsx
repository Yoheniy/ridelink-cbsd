import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";

export type NavItem<T extends string> = { key: T; label: string; icon?: ReactNode };

export type NavGroup<T extends string> = {
  label?: string;
  items: Array<NavItem<T>>;
};

type DashboardSidebarProps<T extends string> = {
  logoText: string;
  collapsed: boolean;
  onToggle: () => void;
  navGroups: Array<NavGroup<T>>;
  activeKey: T;
  onSelect: (key: T) => void;
  onLogout: () => void;
};

export default function DashboardSidebar<T extends string>({
  logoText,
  collapsed,
  onToggle,
  navGroups,
  activeKey,
  onSelect,
  onLogout,
}: DashboardSidebarProps<T>) {
  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-screen flex flex-col border-r border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      <div className="flex items-center justify-between px-4 h-16 shrink-0">
        <span className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
          {collapsed ? "RL" : logoText}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <div className="h-px bg-slate-200/60 dark:bg-white/10 mx-3" />

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4" aria-label="Main">
        {navGroups.map((group, groupIndex) => (
          <div key={group.label ?? groupIndex}>
            {group.label && !collapsed && (
              <span className="block px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {group.label}
              </span>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer",
                    activeKey === item.key
                      ? "bg-primary-50 dark:bg-white/[0.08] text-primary-600 dark:text-primary-400"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-white"
                  )}
                  onClick={() => onSelect(item.key)}
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto shrink-0">
        <div className="h-px bg-slate-200/60 dark:bg-white/10 mx-3" />
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-5 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut size={16} />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
