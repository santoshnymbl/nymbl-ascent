import Link from "next/link";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/scenarios", label: "Scenarios" },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/results", label: "Results" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-900 text-white p-6">
        <h1 className="text-xl font-bold mb-8">Nymbl Ascent</h1>
        <p className="text-gray-400 text-xs mb-6 uppercase">Admin Panel</p>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-gray-50">{children}</main>
    </div>
  );
}
