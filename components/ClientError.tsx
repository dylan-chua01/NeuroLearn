'use client';

export default function ClientError({ message }: { message: string }) {
  return (
    <div className="max-w-xl mx-auto py-12 text-center space-y-4">
      <div className="text-red-600 font-semibold text-lg">
        ❌ Failed to generate quiz
      </div>
      <p className="text-gray-600">{message}</p>
      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  );
}
