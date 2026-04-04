"use client";

import { useRef, useState } from "react";
import { Upload, AlertCircle, FileText } from "lucide-react";

interface CsvCandidate {
  name: string;
  email: string;
}

interface CsvUploadProps {
  onParsed: (candidates: CsvCandidate[]) => void;
}

function parseCsvText(text: string): CsvCandidate[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV must contain a header row and at least one data row.");
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const nameIdx = headers.indexOf("name");
  const emailIdx = headers.indexOf("email");

  if (nameIdx === -1 || emailIdx === -1) {
    throw new Error(
      'CSV must contain "name" and "email" columns in the header row.',
    );
  }

  const candidates: CsvCandidate[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const name = cols[nameIdx] ?? "";
    const email = cols[emailIdx] ?? "";

    if (!name || !email) {
      throw new Error(
        `Row ${i + 1}: missing name or email ("${name}", "${email}").`,
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Row ${i + 1}: invalid email "${email}".`);
    }

    candidates.push({ name, email });
  }

  return candidates;
}

export default function CsvUpload({ onParsed }: CsvUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setFileName(null);

    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please select a .csv file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const candidates = parseCsvText(text);
        setFileName(`${file.name} (${candidates.length} candidates)`);
        onParsed(candidates);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse CSV.");
      }
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);

    // Reset so re-uploading the same file triggers onChange
    e.target.value = "";
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="glass-card"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "24px 16px",
          border: "2px dashed var(--border-default)",
          fontSize: "0.875rem",
          color: "var(--text-muted)",
          cursor: "pointer",
          transition: "all var(--transition-fast)",
          background: "var(--bg-surface)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--accent)";
          e.currentTarget.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-default)";
          e.currentTarget.style.color = "var(--text-muted)";
        }}
      >
        <Upload
          size={24}
          style={{
            marginBottom: 8,
            transition: "color var(--transition-fast)",
          }}
        />
        <span style={{ fontWeight: 500 }}>Upload CSV</span>
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          Must have &quot;name&quot; and &quot;email&quot; columns
        </span>
      </button>

      {fileName && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.875rem",
            color: "var(--success)",
          }}
        >
          <FileText size={16} style={{ flexShrink: 0 }} />
          {fileName}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.875rem",
            color: "var(--error)",
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}
    </div>
  );
}
