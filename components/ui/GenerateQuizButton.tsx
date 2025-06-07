'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

export default function GenerateQuizButton({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch(`/api/generate-quiz?sessionId=${sessionId}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message);
      setSuccess(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-2
        ${
          loading
            ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
            : success
            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
        }`}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating...</span>
        </>
      ) : success ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          <span>Quiz Ready</span>
        </>
      ) : (
        <span>Generate Quiz</span>
      )}
    </button>
  );
}
