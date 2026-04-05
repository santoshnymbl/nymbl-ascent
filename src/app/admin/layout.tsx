"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, GitBranch, Users, BarChart3, Calculator,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/roles", label: "Roles", icon: Briefcase },
  { href: "/admin/scenarios", label: "Scenarios", icon: GitBranch },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/results", label: "Results", icon: BarChart3 },
  { href: "/admin/scoring", label: "Scoring", icon: Calculator },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", position: "relative" }}>
      {/* Ambient gradient mesh behind everything */}
      <div className="ambient-mesh">
        <div className="ambient-blob" style={{ width: 400, height: 400, background: "var(--accent)", top: "20%", right: "15%", opacity: 0.04 }} />
      </div>

      {/* Sidebar */}
      <aside className="sidebar-modern" style={{ width: 240, flexShrink: 0, display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        {/* Logo */}
        <div style={{ padding: "20px 20px 8px" }}>
          <h1 style={{ fontSize: "1.15rem", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em", margin: 0 }}>
            <span style={{ color: "var(--accent)" }}>nymbl</span>
            <span style={{ color: "var(--cta)" }}>ascent</span>
          </h1>
          <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginTop: 2, fontWeight: 700 }}>Admin</p>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", margin: "1px 0",
                  borderRadius: "var(--radius-md)", fontSize: "0.82rem", fontWeight: active ? 600 : 500,
                  textDecoration: "none", transition: "all 150ms ease",
                  borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
                  paddingLeft: active ? 9 : 12,
                  background: active ? "var(--sidebar-active)" : "transparent",
                  color: active ? "var(--accent-light)" : "var(--sidebar-text)",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--sidebar-active)"; e.currentTarget.style.color = "var(--accent-light)"; }}}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-text)"; }}}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 10 }}>
          <ThemeToggle />
          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>Theme</span>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, padding: "24px 16px", overflowY: "auto", overflowX: "hidden", position: "relative", zIndex: 1, minHeight: "100vh" }}>
        <div style={{ animation: "fadeIn 200ms ease" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
