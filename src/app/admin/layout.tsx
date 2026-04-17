"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, GitBranch, Users, BarChart3, Calculator, BookOpen,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Tooltip } from "@/components/ui/Tooltip";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/roles", label: "Roles", icon: Briefcase },
  { href: "/admin/scenarios", label: "Scenarios", icon: GitBranch },
  { href: "/admin/candidates", label: "Candidates", icon: Users },
  { href: "/admin/results", label: "Results", icon: BarChart3 },
  { href: "/admin/scoring", label: "Scoring", icon: Calculator },
  { href: "/admin/guide", label: "How-To", icon: BookOpen },
];

const COLLAPSED_KEY = "nymbl-sidebar-collapsed";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration after mount
      if (saved === "1") setCollapsed(true);
    } catch {}
    setMounted(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0"); } catch {}
      return next;
    });
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div style={{ minHeight: "100vh", display: "flex", position: "relative" }}>
      {/* Ambient gradient mesh behind everything */}
      <div className="ambient-mesh">
        <div className="ambient-blob" style={{ width: 400, height: 400, background: "var(--accent)", top: "20%", right: "15%", opacity: 0.04 }} />
      </div>

      {/* Sidebar */}
      <aside
        className="sidebar-modern"
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          zIndex: 10,
          transition: "width 200ms var(--ease-spring)",
        }}
      >
        {/* Logo (links to dashboard) */}
        <div style={{ padding: collapsed ? "18px 12px 8px" : "20px 20px 8px", display: "flex", flexDirection: "column", alignItems: collapsed ? "center" : "flex-start" }}>
          <Link href="/admin" style={{ display: "block", textDecoration: "none" }} aria-label="Go to dashboard">
            {mounted && collapsed ? (
              <Image src="/nymbl-fox.png" alt="Nymbl" width={36} height={36} priority style={{ display: "block" }} />
            ) : (
              <Image src="/nymbl-logo.png" alt="Nymbl" width={140} height={44} priority style={{ display: "block", height: "auto" }} />
            )}
          </Link>
          {!collapsed && (
            <p style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-muted)", marginTop: 6, fontWeight: 700 }}>Admin</p>
          )}
        </div>

        {/* Collapse toggle */}
        <div style={{ padding: collapsed ? "4px 12px 8px" : "4px 14px 8px", display: "flex", justifyContent: collapsed ? "center" : "flex-end" }}>
          <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} position="right">
            <button
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "var(--radius-sm)",
                background: "transparent",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sidebar-active)"; e.currentTarget.style.color = "var(--accent-light)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            </button>
          </Tooltip>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: collapsed ? "8px 8px" : "12px 10px" }}>
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            const linkEl = (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: 10,
                  padding: collapsed ? "10px 0" : "9px 12px",
                  margin: "1px 0",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.82rem",
                  fontWeight: active ? 600 : 500,
                  textDecoration: "none",
                  transition: "all 150ms ease",
                  borderLeft: (!collapsed && active) ? "3px solid var(--accent)" : "3px solid transparent",
                  paddingLeft: (!collapsed && active) ? 9 : (collapsed ? 0 : 12),
                  background: active ? "var(--sidebar-active)" : "transparent",
                  color: active ? "var(--accent-light)" : "var(--sidebar-text)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--sidebar-active)"; e.currentTarget.style.color = "var(--accent-light)"; }}}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sidebar-text)"; }}}
              >
                <Icon size={collapsed ? 19 : 17} strokeWidth={active ? 2.2 : 1.8} />
                {!collapsed && item.label}
              </Link>
            );

            return collapsed ? (
              <Tooltip key={item.href} content={item.label} position="right" fill>
                {linkEl}
              </Tooltip>
            ) : linkEl;
          })}
        </nav>

        {/* Theme toggle */}
        <div style={{ padding: collapsed ? "12px 8px" : "12px 16px", borderTop: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-start", gap: 10 }}>
          {collapsed ? (
            <Tooltip content="Toggle theme" position="right">
              <ThemeToggle />
            </Tooltip>
          ) : (
            <>
              <ThemeToggle />
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 500 }}>Theme</span>
            </>
          )}
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
