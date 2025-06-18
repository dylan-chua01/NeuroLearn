'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getSessionsWithCallIds } from '@/lib/actions/companion.actions';
import { useUser } from '@clerk/nextjs';
import { BookOpen, HelpCircle, Calendar, Clock, Sparkles, ChevronLeft, ChevronRight, Crown, Lock } from 'lucide-react';

interface SessionWithTranscript {
  id: string;
  callId: string;
  companionName: string;
  companionSubject: string;
  createdAt: string;
  transcript?: Record<string, unknown>;
  isLoading?: boolean;
  error?: string;
}

interface UserMetadata {
  plan?: string;
  subscription?: {
    plan?: string;
  };
  tier?: string;
  planType?: string;
}

interface ClerkUser {
  id?: string;
  publicMetadata?: UserMetadata;
  privateMetadata?: UserMetadata;
  unsafeMetadata?: UserMetadata;
}

const PAGE_SIZE = 5;

const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Helper function to check if user has Pro Learner plan
const hasProLearnerPlan = (user: ClerkUser | null | undefined): boolean => {
  if (user?.id) {
    return true;
  }

  // Check in public metadata first
  const publicMetadata = user?.publicMetadata;
  if (publicMetadata?.plan === 'pro_learner' || publicMetadata?.subscription?.plan === 'pro_learner') {
    return true;
  }

  // Check in private metadata (if accessible)
  const privateMetadata = user?.privateMetadata;
  if (privateMetadata?.plan === 'pro_learner' || privateMetadata?.subscription?.plan === 'pro_learner') {
    return true;
  }

  // Check in unsafe metadata (if accessible)
  const unsafeMetadata = user?.unsafeMetadata;
  if (unsafeMetadata?.plan === 'pro_learner' || unsafeMetadata?.subscription?.plan === 'pro_learner') {
    return true;
  }

  // Also check for common variations
  const allMetadata = { ...publicMetadata, ...privateMetadata, ...unsafeMetadata };
  const planVariations = [
    'pro_learner', 'pro-learner', 'prolearner', 'Pro Learner', 'pro', 'premium'
  ];
  
  for (const variation of planVariations) {
    if (allMetadata?.plan === variation || 
        allMetadata?.subscription?.plan === variation ||
        allMetadata?.tier === variation ||
        allMetadata?.planType === variation) {
      return true;
    }
  }
  return false;
};

const ProUpgradePrompt = () => {
  const router = useRouter();

  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center">
          <Crown className="w-12 h-12 text-amber-600" />
        </div>
        
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Pro Learner</h3>
          <p className="text-gray-600 leading-relaxed">
            Access your conversation transcripts and unlock advanced learning features with our Pro Learner plan.
          </p>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <Lock className="w-5 h-5 text-emerald-600 mr-2" />
            <span className="font-semibold text-emerald-800">Pro Learner Features</span>
          </div>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-center">
              <BookOpen className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
              <span>Full conversation transcripts</span>
            </li>
            <li className="flex items-center">
              <HelpCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
              <span>AI-generated quizzes from your sessions</span>
            </li>
            <li className="flex items-center">
              <Sparkles className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
              <span>Advanced learning analytics</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => router.push('/pricing')}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Upgrade to Pro Learner
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          Join thousands of learners who have upgraded their learning experience
        </p>
      </div>
    </div>
  );
};

const TranscriptsList = () => {
  const { user, isLoaded } = useUser();
  const [sessions, setSessions] = useState<SessionWithTranscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && hasProLearnerPlan(user)) {
      loadSessions();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, user]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const sessionsData = await getSessionsWithCallIds();
      setSessions(
        sessionsData.map((session: SessionWithTranscript) => ({
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

  const handleGenerateQuiz = (sessionId: string) => {
    if (!sessionId || !isValidUUID(sessionId)) {
      console.error('❌ Invalid sessionId:', sessionId);
      return;
    }
    router.push(`/quiz/session/${sessionId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  // Show loading state while Clerk is loading
  if (!isLoaded || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-100 border-t-emerald-600"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 opacity-20 animate-pulse"></div>
        </div>
        <div className="text-center">
          <p className="text-gray-700 font-medium">Loading your transcripts</p>
          <p className="text-gray-500 text-sm">This might take a moment...</p>
        </div>
      </div>
    );
  }

  // Check if user has Pro Learner plan
  if (!hasProLearnerPlan(user)) {
    return <ProUpgradePrompt />;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-emerald-600" />
        </div>
        <div className="flex items-center justify-center mb-2">
          <Crown className="w-5 h-5 text-amber-500 mr-2" />
          <h3 className="text-xl font-semibold text-gray-900">No transcripts yet</h3>
        </div>
        <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
          Your conversation transcripts will appear here after you complete sessions with your AI companions.
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(sessions.length / PAGE_SIZE);
  const paginatedSessions = sessions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Pro Learner Badge */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full">
          <Crown className="w-4 h-4 text-amber-600 mr-2" />
          <span className="text-sm font-medium text-amber-800">Pro Learner</span>
        </div>
      </div>

      <div className="grid gap-4">
        {paginatedSessions.map((session) => (
          <div
            key={session.id}
            className={cn(
              "group relative overflow-hidden",
              "bg-white rounded-xl border border-gray-200",
              "hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50",
              "transition-all duration-300 ease-out",
              "cursor-pointer"
            )}
            onClick={() => handleSessionClick(session.callId)}
          >
            {/* Gradient accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg group-hover:shadow-emerald-200 transition-shadow duration-300">
                      <Image
                        src={`/icons/${session.companionSubject}.svg`}
                        alt={session.companionSubject}
                        width={28}
                        height={28}
                        className="filter brightness-0 invert"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-lg truncate">
                        {session.companionName}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        {session.companionSubject}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(session.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeAgo(session.createdAt)}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-400 font-mono mt-2 truncate">
                      ID: {session.callId || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSessionClick(session.callId);
                    }}
                    className="flex hover:cursor-pointer items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
                    title="View Transcript"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateQuiz(session.id);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all duration-200 shadow-sm hover:shadow-md"
                    title="Generate Quiz"
                  >
                    <HelpCircle className="w-4 h-4 hover:cursor-pointer" />
                    <span>Quiz</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-8 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Showing</span>
            <span className="font-medium text-gray-900">
              {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, sessions.length)}
            </span>
            <span>of</span>
            <span className="font-medium text-gray-900">{sessions.length}</span>
            <span>transcripts</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                currentPage === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              )}
            >
              <ChevronLeft className="w-4 h-4 hover:cursor-pointer"  />
              <span>Previous</span>
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200",
                    page === currentPage
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={cn(
                "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:cursor-pointer",
                currentPage === totalPages
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              )}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4 hover:cursor-pointer" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptsList;