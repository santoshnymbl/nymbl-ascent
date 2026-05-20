"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";

interface LinkInfo {
  code: string;
  roleName: string;
  roleDescription: string;
  allowedDomains: string | null;
  isAccepting: boolean;
  reason?: string;
}

export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLink() {
      try {
        const res = await fetch(`/api/join/${params.code}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.reason || "This assessment link is not available.");
          return;
        }
        setLinkInfo(data);
      } catch {
        setError("Failed to load assessment. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchLink();
  }, [params.code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/join/${params.code}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Registration failed.");
        return;
      }
      router.push(data.redirectUrl);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <Loader2 size={32} style={{ color: "var(--cta)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: 24 }}>
        <div className="glass-card" style={{ maxWidth: 480, width: "100%", padding: 48, textAlign: "center" }}>
          <AlertCircle size={48} style={{ color: "var(--error)", margin: "0 auto 16px", display: "block" }} />
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-heading), 'Montserrat', sans-serif", marginBottom: 8 }}>
            Link Unavailable
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!linkInfo) return null;

  const domainHint = linkInfo.allowedDomains
    ? linkInfo.allowedDomains.split(",").map((d) => `@${d.trim()}`).join(" or ")
    : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)", padding: 24 }}>
      <div className="glass-card" style={{ maxWidth: 520, width: "100%", padding: 48 }}>
        <h1 style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "var(--font-heading), 'Montserrat', sans-serif",
          marginBottom: 8,
        }}>
          {linkInfo.roleName} Assessment
        </h1>

        {linkInfo.roleDescription && (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: 16 }}>
            {linkInfo.roleDescription}
          </p>
        )}

        <div style={{
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-md)",
          padding: "12px 16px",
          marginBottom: 24,
          fontSize: "0.875rem",
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}>
          This assessment has 3 stages and takes approximately 15 minutes. You can pause and resume at any time.
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
              Name
            </label>
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              style={{ width: "100%" }}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
              Email
            </label>
            <input
              type="email"
              placeholder={domainHint ? `you${domainHint.split(" or ")[0]}` : "you@company.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              style={{ width: "100%" }}
              required
            />
            {domainHint && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                Use your {domainHint} email
              </p>
            )}
          </div>

          {formError && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", color: "var(--error)" }}>
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "12px 24px",
              fontSize: "1rem",
              opacity: submitting ? 0.5 : 1,
            }}
          >
            {submitting ? (
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <>
                Start Assessment
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
