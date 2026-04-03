"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  GitBranch,
  Users,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/roles", label: "Roles", icon: Briefcase },
  { href: "/admin/scenarios", label: "Scenarios", icon: GitBranch },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/results", label: "Results", icon: BarChart3 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 bg-slate-900 text-white flex flex-col">
        <div className="px-6 pt-6 pb-4">
          <h1 className="text-xl font-bold font-[family-name:var(--font-heading)] tracking-tight">
            <span className="text-white">nymbl</span>
            <span className="text-orange-400">ascent</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-semibold">
            Admin
          </p>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "bg-slate-800 text-white border-l-[3px] border-blue-500 pl-[9px]"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-slate-50 p-8 overflow-auto">{children}</main>
    </div>
  );
}
