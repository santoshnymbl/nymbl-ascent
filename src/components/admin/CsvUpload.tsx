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
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="group flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-colors duration-150 cursor-pointer"
      >
        <Upload
          size={24}
          className="mb-2 text-slate-400 group-hover:text-blue-500 transition-colors duration-150"
        />
        <span className="font-medium">Upload CSV</span>
        <span className="text-xs text-slate-400 mt-1">
          Must have &quot;name&quot; and &quot;email&quot; columns
        </span>
      </button>

      {fileName && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-700">
          <FileText size={16} className="shrink-0" />
          {fileName}
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
