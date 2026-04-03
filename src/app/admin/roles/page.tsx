"use client";

import { useEffect, useState } from "react";

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
        <h2 className="text-2xl font-bold">Roles</h2>
        <button
          onClick={showForm ? closeForm : openAdd}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
        >
          {showForm ? "Cancel" : "Add Role"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Role" : "New Role"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="e.g. Frontend Engineer"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Brief description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Core Pool Size
              </label>
              <input
                type="number"
                min={1}
                value={form.corePoolSize}
                onChange={(e) =>
                  setForm({ ...form, corePoolSize: Number(e.target.value) })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update Role" : "Create Role"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500">Loading roles...</p>
      ) : roles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-400 text-lg">No roles yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Click &quot;Add Role&quot; to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="bg-indigo-600 h-1.5" />
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900">
                  {role.name}
                </h3>
                {role.description && (
                  <p className="text-sm text-gray-500 mt-1">
                    {role.description}
                  </p>
                )}
                <div className="flex gap-4 mt-3 text-sm text-gray-600">
                  <span>
                    <span className="font-medium">{role._count.candidates}</span>{" "}
                    {role._count.candidates === 1 ? "candidate" : "candidates"}
                  </span>
                  <span>
                    <span className="font-medium">
                      {role._count.roleScenarios}
                    </span>{" "}
                    {role._count.roleScenarios === 1 ? "scenario" : "scenarios"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Pool size: {role.corePoolSize}
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEdit(role)}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(role)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
