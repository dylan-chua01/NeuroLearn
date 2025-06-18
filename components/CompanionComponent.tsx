'use client';

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils';
import { vapi } from '@/lib/vapi.sd';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import soundwaves from '@/constants/soundwaves.json';
import { createSessionHistory, updateSessionHistory } from '@/lib/actions/companion.actions';

interface VapiCall {
  id?: string;
}

interface VapiInstance {
  call?: VapiCall;
  callId?: string;
  getCallId?: () => Promise<string> | string;
  isMuted: () => boolean;
  setMuted: (muted: boolean) => void;
  start: (
    assistant: Record<string, unknown>,
    overrides: {
      variableValues: Record<string, string>;
      clientMessages: string[];
      serverMessages: string[];
    }
  ) => Promise<unknown>;
  stop: () => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback: (...args: unknown[]) => void) => void;
}

interface Message {
  type: string;
  transcriptType?: string;
  role: string;
  transcript?: string;
}

interface SavedMessage {
  role: string;
  content: string;
}

interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  style: string;
  voice: string;
  language: string;
  pdf_content?: string;
  pdf_name?: string;
}

enum CallStatus {
  INACTIVE = 'INACTIVE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED'
}

const CompanionComponent = ({
  companionId,
  subject,
  topic,
  name,
  userName,
  userImage,
  style,
  voice,
  language,
  pdf_content,
  pdf_name
}: CompanionComponentProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [sessionHistoryId, setSessionHistoryId] = useState<string | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (lottieRef.current) {
      if (isSpeaking) {
        lottieRef.current.play();
      } else {
        lottieRef.current.stop();
      }
    }
  }, [isSpeaking]);

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);

      const getCallId = async () => {
        try {
          const vapiInstance = vapi as unknown as VapiInstance;
          let callId: string | undefined;

          if (vapiInstance.call?.id) {
            callId = vapiInstance.call.id;
          } else if (vapiInstance.callId) {
            callId = vapiInstance.callId;
          } else if (vapiInstance.getCallId) {
            callId = await vapiInstance.getCallId();
          }

          if (callId && sessionHistoryId) {
            await updateSessionHistory(sessionHistoryId, callId);
          }
        } catch (error) {
          console.error('Error getting call ID:', error);
        }
      };

      getCallId();
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      setSessionHistoryId(null);
    };

    const onMessage = (...args: unknown[]) => {
      const message = args[0] as Message;
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const newMessage = { role: message.role, content: message.transcript || '' };
        setMessages((prev) => [newMessage, ...prev]);
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    const vapiInstance = vapi as unknown as VapiInstance;

    vapiInstance.on('call-start', onCallStart);
    vapiInstance.on('call-end', onCallEnd);
    vapiInstance.on('message', onMessage);
    vapiInstance.on('speech-start', onSpeechStart);
    vapiInstance.on('speech-end', onSpeechEnd);

    return () => {
      vapiInstance.off('call-start', onCallStart);
      vapiInstance.off('call-end', onCallEnd);
      vapiInstance.off('message', onMessage);
      vapiInstance.off('speech-start', onSpeechStart);
      vapiInstance.off('speech-end', onSpeechEnd);
    };
  }, [companionId, sessionHistoryId]);

  const toggleMicrophone = () => {
    const vapiInstance = vapi as unknown as VapiInstance;
    const muted = vapiInstance.isMuted();
    vapiInstance.setMuted(!muted);
    setIsMuted(!muted);
  };

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    try {
      const sessionData = await createSessionHistory(companionId);
      setSessionHistoryId(sessionData.id);

      const assistantOverrides = {
        variableValues: { subject, topic, style },
        clientMessages: ['transcript'],
        serverMessages: []
      };

      const assistantConfig = configureAssistant(
        voice as 'male' | 'female',
        style as 'casual' | 'formal',
        language as 'en' | 'zh' | 'ms',
        topic,
        subject,
        pdf_content,
        pdf_name
      );

      const vapiInstance = vapi as unknown as VapiInstance;
      await vapiInstance.start(
        assistantConfig as Record<string, unknown>,
        assistantOverrides
      );
    } catch (error) {
      console.error('Failed to start call:', error);
      setCallStatus(CallStatus.INACTIVE);
      setSessionHistoryId(null);
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    const vapiInstance = vapi as unknown as VapiInstance;
    vapiInstance.stop();
  };

  return (
    <section className="flex flex-col h-[70vh]">
      <section className="flex gap-8 max-sm:flex-col">
        <div className="companion-section">
          <div className="companion-avatar" style={{ backgroundColor: getSubjectColor(subject) }}>
            <div className={cn(
              'absolute transition-opacity duration-1000',
              callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100' : 'opacity-0',
              callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse'
            )}>
              <Image 
                src={`/icons/${subject}.svg`} 
                alt={subject} 
                width={150} 
                height={150} 
                className="max-sm:w-fit" 
              />
            </div>

            <div className={cn(
              'absolute transition-opacity duration-1000', 
              callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0'
            )}>
              <Lottie
                lottieRef={lottieRef}
                animationData={soundwaves}
                autoplay={false}
                className="companion-lottie"
              />
            </div>
          </div>
          <p className="font-bold text-2xl">{name}</p>
        </div>

        <div className="user-section">
          <div className="user-avatar">
            <Image 
              src={userImage} 
              alt={`${userName} Image`} 
              width={130} 
              height={130} 
              className="rounded-lg" 
            />
            <p className="font-bold text-2xl">{userName}</p>
          </div>

          <button 
            className="btn-mic" 
            onClick={toggleMicrophone} 
            disabled={callStatus !== CallStatus.ACTIVE}
          >
            <Image 
              src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} 
              alt={`${userName} mic`} 
              width={36} 
              height={36} 
            />
            <p className="max-sm:hidden">
              {isMuted ? 'Turn on microphone' : 'Turn off microphone'}
            </p>
          </button>

          <button
            className={cn(
              'rounded-lg py-2 cursor-pointer transition-colors w-full text-white',
              callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary',
              callStatus === CallStatus.CONNECTING && 'animate-pulse'
            )}
            onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
          >
            {callStatus === CallStatus.ACTIVE 
              ? 'End Session' 
              : callStatus === CallStatus.CONNECTING 
                ? 'Connecting' 
                : 'Start Session'}
          </button>
        </div>
      </section>

      <section className="transcript">
        <div className="transcript-message no-scrollbar">
          {messages.map((message, index) => (
            message.role === 'assistant' ? (
              <p key={index} className="max-sm:text-sm">
                {name.split(' ')[0].replace(/[.]/g, '')}: {message.content}
              </p>
            ) : (
              <p key={index} className="text-primary max-sm:text-sm">
                {userName}: {message.content}
              </p>
            )
          ))}
        </div>
        <div className="transcript-fade" />
      </section>
    </section>
  );
};

export default CompanionComponent;