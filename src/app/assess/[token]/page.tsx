"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface ValidateResponse {
  candidateId: string;
  name: string;
  roleName: string;
  status: string;
  currentStage: number;
}

export default function WelcomePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [data, setData] = useState<ValidateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/assess/validate?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          const body = await res.json();
          setError(body.error || "Invalid token");
          return;
        }
        const json: ValidateResponse = await res.json();
        setData(json);
      } catch {
        setError("Failed to validate token. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    validate();
  }, [token]);

  function handleBegin() {
    if (!data) return;
    if (data.status === "in_progress" && data.currentStage >= 1) {
      const stage = Math.min(data.currentStage, 3);
      router.push(`/assess/${token}/stage${stage}`);
    } else {
      router.push(`/assess/${token}/stage1`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">&#x26A0;&#xFE0F;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (data.status === "completed" || data.status === "scored") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">&#x2705;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Already Completed</h1>
          <p className="text-gray-600">
            You have already completed this assessment. Thank you!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-lg text-center px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Welcome to Nymbl Ascent
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Hi <span className="font-semibold">{data.name}</span>, you&apos;re being
          assessed for the <span className="font-semibold">{data.roleName}</span> role.
        </p>

        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-8 text-left">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What to expect
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Quick-Fire Games</p>
                <p className="text-sm text-gray-500">
                  Three fast activities to see how you prioritize, match values,
                  and spot the odd one out. ~3 minutes.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Workplace Scenarios</p>
                <p className="text-sm text-gray-500">
                  Navigate realistic branching scenarios and make decisions
                  under pressure. ~5 minutes.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Role Challenge</p>
                <p className="text-sm text-gray-500">
                  A challenge tailored to the role you&apos;re applying for.
                  Show us your skills.
                </p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleBegin}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 transition"
        >
          {data.status === "in_progress" ? "Resume Assessment" : "Begin Assessment"}
        </button>
      </div>
    </div>
  );
}
