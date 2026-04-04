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
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 260,
          flexShrink: 0,
          background: "var(--sidebar-bg)",
          color: "var(--sidebar-text)",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ padding: "24px 24px 16px" }}>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              fontFamily: "var(--font-heading), 'Space Grotesk', sans-serif",
              letterSpacing: "-0.025em",
              lineHeight: 1.2,
            }}
          >
            <span style={{ color: "var(--accent)" }}>nymbl</span>
            <span style={{ color: "var(--cta)" }}>ascent</span>
          </h1>
          <p
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              marginTop: 4,
              fontWeight: 600,
            }}
          >
            Admin
          </p>
        </div>

        <nav style={{ flex: 1, padding: "8px 12px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: active ? "10px 12px 10px 9px" : "10px 12px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    transition: "all var(--transition-fast)",
                    textDecoration: "none",
                    borderLeft: active
                      ? "3px solid var(--accent)"
                      : "3px solid transparent",
                    background: active ? "var(--sidebar-active)" : "transparent",
                    color: active ? "var(--text-primary)" : "var(--sidebar-text)",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "var(--sidebar-active)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--sidebar-text)";
                    }
                  }}
                >
                  <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Theme Toggle at bottom */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <ThemeToggle />
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            Theme
          </span>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          background: "var(--bg-base)",
          padding: 32,
          overflowY: "auto",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}
