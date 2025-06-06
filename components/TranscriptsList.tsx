'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getSessionsWithCallIds } from '@/lib/actions/companion.actions';
import { useUser } from '@clerk/nextjs';

interface SessionWithTranscript {
  id: string;
  callId: string;
  companionName: string;
  companionSubject: string;
  createdAt: string;
  transcript?: any;
  isLoading?: boolean;
  error?: string;
}

const PAGE_SIZE = 5;

const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const TranscriptsList = () => {
  const { user } = useUser();
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionWithTranscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Get the user's plan from their public metadata
      const plan = user.publicMetadata?.plan as string || 'free';
      setUserPlan(plan);
      
      if (plan === 'pro_learner') {
        loadSessions();
      }
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessionsData = await getSessionsWithCallIds();
      setSessions(
        sessionsData.map((session: any) => ({
          ...session,
          isLoading: false,
          error: undefined,
        }))
      );
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionClick = (callId: string) => {
    if (!callId || !isValidUUID(callId)) {
      console.error('❌ Invalid callId:', callId);
      return;
    }
    router.push(`/history/${callId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (userPlan === null) {
    return <div className="py-12 text-center text-gray-500">Checking subscription...</div>;
  }

  if (userPlan !== 'pro_learner') {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-800">🔒 Access Restricted</h2>
        <p className="text-gray-500 mt-2">This page is only available to Pro Learner users.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600">Loading transcripts...</span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No session transcripts available yet</p>
        <p className="text-gray-400 text-sm mt-2">Complete some sessions to see your transcripts here</p>
      </div>
    );
  }

  const totalPages = Math.ceil(sessions.length / PAGE_SIZE);
  const paginatedSessions = sessions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {paginatedSessions.map((session) => (
        <div
          key={session.id}
          className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleSessionClick(session.callId)}
        >
          <div className="w-full p-4 hover:bg-gray-50 focus:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Image
                    src={`/icons/${session.companionSubject}.svg`}
                    alt={session.companionSubject}
                    width={24}
                    height={24}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{session.companionName}</h3>
                  <p className="text-sm text-gray-500">{formatDate(session.createdAt)}</p>
                  <p className="text-xs text-gray-400 font-mono">Call ID: {session.callId || 'N/A'}</p>
                </div>
              </div>
              <div className="text-sm font-bold text-gray-800">View Transcript</div>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination Controls */}
      <div className="flex justify-center items-center gap-4 pt-6">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-1 border rounded-lg text-sm bg-white hover:bg-gray-100 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-gray-600 text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-1 border rounded-lg text-sm bg-white hover:bg-gray-100 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TranscriptsList;