"use client";

import { useEffect, useState } from "react";
import { Plus, Briefcase, Pencil, Trash2, X, AlertCircle } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
  corePoolSize: number;
  createdAt: string;
  _count: { candidates: number; roleScenarios: number };
}

const emptyForm = { name: "", description: "", corePoolSize: 2 };

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRoles() {
    try {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data: Role[] = await res.json();
      setRoles(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load roles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  }

  function openEdit(role: Role) {
    setEditingId(role.id);
    setForm({
      name: role.name,
      description: role.description,
      corePoolSize: role.corePoolSize,
    });
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Role name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const isEdit = editingId !== null;
      const res = await fetch("/api/admin/roles", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { id: editingId, ...form, corePoolSize: Number(form.corePoolSize) }
            : { ...form, corePoolSize: Number(form.corePoolSize) }
        ),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Save failed");
      }

      closeForm();
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role: Role) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: role.id }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Delete failed");
      }
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-800">
          Roles
        </h2>
        <button
          onClick={showForm ? closeForm : openAdd}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
            showForm
              ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {showForm ? (
            <>
              <X size={16} />
              Cancel
            </>
          ) : (
            <>
              <Plus size={16} />
              Add Role
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-white rounded-xl border border-slate-200 p-6"
        >
          <h3 className="text-lg font-semibold font-[family-name:var(--font-heading)] text-slate-800 mb-4">
            {editingId ? "Edit Role" : "New Role"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-150"
                placeholder="e.g. Frontend Engineer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-150"
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Core Pool Size
              </label>
              <input
                type="number"
                min={1}
                value={form.corePoolSize}
                onChange={(e) =>
                  setForm({ ...form, corePoolSize: Number(e.target.value) })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-150"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Role" : "Create Role"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-5 py-2 rounded-lg bg-transparent text-slate-600 text-sm font-medium hover:bg-slate-100 transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-400 text-sm">Loading roles...</p>
      ) : roles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Briefcase size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-400 text-lg">No roles yet.</p>
          <p className="text-slate-400 text-sm mt-1">
            Click &quot;Add Role&quot; to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-500 transition-colors duration-150"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Briefcase size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-800 truncate">
                    {role.name}
                  </h3>
                  {role.description && (
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                      {role.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  {role._count.candidates}{" "}
                  {role._count.candidates === 1 ? "candidate" : "candidates"}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  {role._count.roleScenarios}{" "}
                  {role._count.roleScenarios === 1 ? "scenario" : "scenarios"}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                  Pool: {role.corePoolSize}
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openEdit(role)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors duration-150"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(role)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-red-600 text-xs font-medium hover:bg-red-50 transition-colors duration-150"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
