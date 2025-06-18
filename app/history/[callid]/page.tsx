import { fetchCallTranscript } from "@/lib/vapi";

interface PageProps {
  params: Promise<{ callid: string }>;
}

export default async function CallHistoryPage({ params }: PageProps) {
  // Await the params before using them
  const { callid } = await params;
  
  const callData = await fetchCallTranscript(callid);
  const transcript = callData?.transcript;

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            📝 Call Transcript
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Call ID: <span className="font-mono text-gray-600">{callid}</span>
          </p>
        </div>

        {transcript ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Transcript Text</h2>
            <pre className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed font-mono">
              {transcript}
            </pre>
          </div>
        ) : (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
            <p>No transcript available for this call.</p>
          </div>
        )}
      </div>
    </main>
  );
};