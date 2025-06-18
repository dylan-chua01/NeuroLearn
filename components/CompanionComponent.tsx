'use client';

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils'
import { vapi } from '@/lib/vapi.sd';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react'
import soundwaves from '@/constants/soundwaves.json'
import { createSessionHistory, updateSessionHistory } from '@/lib/actions/companion.actions';
import { AssistantOverrides } from '@vapi-ai/web/dist/api';

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED'
}

const CompanionComponent = ({
    companionId, subject, topic, name, userName, userImage,
    style, voice, language, pdf_content, pdf_name
}: CompanionComponentProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [vapiCallId, setVapiCallId] = useState<string | null>(null);
    const [sessionHistoryId, setSessionHistoryId] = useState<string | null>(null);

    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if (lottieRef) {
            isSpeaking ? lottieRef.current?.play() : lottieRef.current?.stop();
        }
    }, [isSpeaking, lottieRef]);

    useEffect(() => {
        const onCallStart = () => {
            setCallStatus(CallStatus.ACTIVE);

            setTimeout(() => {
                try {
                    const callId = (vapi as any)?.call?.id || (vapi as any)?.callId;

                    if (callId) {
                        setVapiCallId(callId);
                        if (sessionHistoryId) {
                            updateSessionHistory(sessionHistoryId, callId)
                                .then(() => console.log('Session history updated with call ID:', callId))
                                .catch(err => console.error("Failed to update session with call ID:", err));
                        }
                    } else {
                        const altCallId = typeof (vapi as any).getCallId === 'function'
                            ? (vapi as any).getCallId()
                            : null;

                        if (altCallId) {
                            setVapiCallId(altCallId);
                            if (sessionHistoryId) {
                                updateSessionHistory(sessionHistoryId, altCallId)
                                    .then(() => console.log('Session history updated with alt call ID:', altCallId))
                                    .catch(err => console.error("Failed to update session with alt call ID:", err));
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error getting call ID:', error);
                }
            }, 100);
        };

        const onCallEnd = async () => {
            setCallStatus(CallStatus.FINISHED);
            const callId = (vapi as any)?.call?.id || (vapi as any)?.callId;
            if (callId && sessionHistoryId) {
                try {
                    await updateSessionHistory(sessionHistoryId, callId);
                } catch (err) {
                    console.error("❌ Failed to update session with call ID on call end:", err);
                }
            }
            setVapiCallId(null);
            setSessionHistoryId(null);
        }

        const onMessage = (message: Message) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage = { role: message.role, content: message.transcript };
                setMessages(prev => [newMessage, ...prev]);
            }
        };

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onError = (error: Error) => {
            console.log('Vapi Error:', error);
            setVapiCallId(null);
            setSessionHistoryId(null);
        };

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('message', onMessage);
        vapi.on('error', onError);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('message', onMessage);
            vapi.off('error', onError);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
        };
    }, [companionId, sessionHistoryId]);

    const toggleMicrophone = () => {
        const isMuted = vapi.isMuted();
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted);
    }

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);

        try {
            const sessionData = await createSessionHistory(companionId);
            setSessionHistoryId(sessionData.id);

            const assistantOverrides: AssistantOverrides = {
              variableValues: { subject, topic, style },
          };

            const response = await vapi.start(
                configureAssistant(
                    voice as "male" | "female",
                    style as "casual" | "formal",
                    language as "en" | "zh" | "ms",
                    topic,
                    subject,
                    pdf_content,
                    pdf_name
                ),
                assistantOverrides
            );

            let callId: string | undefined;
            if (response?.id) {
                callId = response.id;
            } else if ((vapi as any)?.call?.id) {
                callId = (vapi as any).call.id;
            } else if (typeof (vapi as any).getCallId === 'function') {
                callId = await (vapi as any).getCallId();
            }

            if (callId) {
                setVapiCallId(callId);
                await updateSessionHistory(sessionData.id, callId);
            } else {
                console.warn('Call ID not found immediately, will try in onCallStart');
            }
        } catch (error) {
            console.error('Failed to start call:', error);
            setCallStatus(CallStatus.INACTIVE);
            setSessionHistoryId(null);
        }
    };

    const handleDisconnect = async () => {
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();
    }

    return (
        <section className='flex flex-col h-[70vh]'>
            <section className='flex gap-8 max-sm:flex-col'>
                <div className='companion-section'>
                    <div className='companion-avatar' style={{ backgroundColor: getSubjectColor(subject) }}>
                        <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100' : 'opacity-0', callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse')}>
                            <Image src={`/icons/${subject}.svg`} alt={subject} width={150} height={150} className='max-sm:w-fit' />
                        </div>
                        <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0')}>
                            <Lottie lottieRef={lottieRef} animationData={soundwaves} autoplay={false} className='companion-lottie' />
                        </div>
                    </div>
                    <p className='font-bold text-2xl'>{name}</p>
                </div>

                <div className='user-section'>
                    <div className='user-avatar'>
                        <Image src={userImage} alt={`${userName} Image`} width={130} height={130} className='rounded-lg' />
                        <p className='font-bold text-2xl'>{userName}</p>
                    </div>
                    <button className='btn-mic' onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE}>
                        <Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} alt={`${userName} mic`} width={36} height={36} />
                        <p className='max-sm:hidden'>{isMuted ? 'Turn on microphone' : 'Turn off microphone'}</p>
                    </button>
                    <button className={cn('rounded-lg py-2 cursor-pointer transition-colors w-full text-white', callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary', callStatus === CallStatus.CONNECTING && 'animate-pulse')} onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}>
                        {callStatus === CallStatus.ACTIVE ? "End Session" : callStatus === CallStatus.CONNECTING ? 'Connecting' : 'Start Session'}
                    </button>
                </div>
            </section>

            <section className='transcript'>
                <div className='transcript-message no-scrollbar'>
                    {messages.map((message, index) => (
                        <p key={index} className={message.role === 'assistant' ? 'max-sm:text-sm' : 'text-primary max-sm:text-sm'}>
                            {message.role === 'assistant'
                                ? `${name.split(' ')[0].replace(/[.]/g, '')}: ${message.content}`
                                : `${userName}: ${message.content}`
                            }
                        </p>
                    ))}
                </div>
                <div className='transcript-fade' />
            </section>
        </section>
    );
}

export default CompanionComponent;
