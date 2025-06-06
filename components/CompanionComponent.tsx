'use client';

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils'
import { vapi } from '@/lib/vapi.sd';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react'
import soundwaves from '@/constants/soundwaves.json'
import { createSessionHistory, updateSessionHistory } from '@/lib/actions/companion.actions';

enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED'
}

const CompanionComponent = ({ companionId, subject, topic, name, userName, userImage, style, voice, language }: CompanionComponentProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [vapiCallId, setVapiCallId] = useState<string | null>(null);
    const [sessionHistoryId, setSessionHistoryId] = useState<string | null>(null);

    const lottieRef = useRef<LottieRefCurrentProps>(null);

    useEffect(() => {
        if(lottieRef) {
            if(isSpeaking) {
                lottieRef.current?.play()
            }
            else {
                lottieRef.current?.stop()
            }
        }
    }, [isSpeaking, lottieRef])

    useEffect(() => {
        const onCallStart = () => {
            setCallStatus(CallStatus.ACTIVE);
            
            
            // Get the call ID from Vapi after the call starts
            setTimeout(() => {
                try {
                    // Try to get call ID from vapi instance
                    const callId = (vapi as any)?.call?.id || (vapi as any)?.callId;
                    
                    if (callId) {
                        setVapiCallId(callId);
                        console.log('Call started with ID:', callId);
                        
                        // Update the existing session history row with the call ID
                        if (sessionHistoryId) {
                            updateSessionHistory(sessionHistoryId, callId)
                                .then(() => {
                                    console.log('Session history updated with call ID:', callId);
                                })
                                .catch((err) => {
                                    console.error("Failed to update session with call ID:", err);
                                });
                        }
                    } else {
                        console.warn('No call ID found on vapi instance');
                        // Try alternative method - check if vapi has a getCallId method
                        const altCallId = typeof (vapi as any).getCallId === 'function' 
                            ? (vapi as any).getCallId() 
                            : null;
                        
                        if (altCallId) {
                            setVapiCallId(altCallId);
                            console.log('Call ID found via getCallId:', altCallId);
                            
                            // Update session history with alternative call ID
                            if (sessionHistoryId) {
                                updateSessionHistory(sessionHistoryId, altCallId)
                                    .then(() => {
                                        console.log('Session history updated with alt call ID:', altCallId);
                                    })
                                    .catch((err) => {
                                        console.error("Failed to update session with alt call ID:", err);
                                    });
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error getting call ID:', error);
                }
            }, 100); // Small delay to ensure call object is populated
        };

        const onCallEnd = async () => {
            setCallStatus(CallStatus.FINISHED);
        
            const callId = (vapi as any)?.call?.id || (vapi as any)?.callId;
        
            console.log("📞 Call ended. Final Call ID:", callId);
        
            if (callId && sessionHistoryId) {
                try {
                    await updateSessionHistory(sessionHistoryId, callId);
                    console.log("✅ Session history updated on call end with Call ID:", callId);
                } catch (err) {
                    console.error("❌ Failed to update session with call ID on call end:", err);
                }
            } else {
                console.warn("⚠️ Call ID or sessionHistoryId missing at call end.");
            }
        
            // Clean up state
            setVapiCallId(null);
            setSessionHistoryId(null);
        }

        const onMessage = (message: Message) => {
            if(message.type === 'transcript' && message.transcriptType === 'final') {
                const newMessage = {role: message.role, content: message.transcript}
                setMessages((prev) => [newMessage, ...prev])
            }
        }

        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);

        const onError = (error: Error) => {
            console.log('Vapi Error:', error);
            // Reset IDs on error
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
        }
    }, [companionId, sessionHistoryId]) // Added sessionHistoryId to dependencies

    const toggleMicrophone = () => {
        const isMuted = vapi.isMuted();
        vapi.setMuted(!isMuted);
        setIsMuted(!isMuted)
    }

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);
    
        try {
            // 1. Create session history row first
            const sessionData = await createSessionHistory(companionId);
            setSessionHistoryId(sessionData.id);
            console.log('Session history created with ID:', sessionData.id);
    
            const assistantOverrides = {
                variableValues: { subject, topic, style },
                clientMessages: ['transcript'],
                serverMessages: [],
            };
    
            // 2. Start the Vapi call
            // @ts-expect-error
            const response = await vapi.start(
                configureAssistant(voice, style, language), 
                assistantOverrides
            );
    
            // 3. Get call ID - try multiple approaches
            let callId: string | undefined;
            
            // Try direct response property
            if (response?.id) {
                callId = response.id;
            } 
            // Try vapi instance property
            else if ((vapi as any)?.call?.id) {
                callId = (vapi as any).call.id;
            }
            // Try function call if available
            else if (typeof (vapi as any).getCallId === 'function') {
                callId = await (vapi as any).getCallId();
            }
    
            if (callId) {
                setVapiCallId(callId);
                console.log('Call ID:', callId);
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
        setCallStatus(CallStatus.FINISHED)
        vapi.stop()
    }

    return (
        <section className='flex flex-col h-[70vh]'>
            <section className='flex gap-8 max-sm:flex-col'>
                <div className='companion-section'>
                    <div className='companion-avatar' style={{ backgroundColor: getSubjectColor(subject)}}>
                        <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100' : 'opacity-0', callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse')}>
                            <Image src={`/icons/${subject}.svg`} alt={subject} width={150} height={150} className='max-sm:w-fit' />
                        </div>

                        <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0')}>
                            <Lottie
                                lottieRef={lottieRef}
                                animationData={soundwaves}
                                autoplay={false}
                                className='companion-lottie'
                            />
                        </div>
                    </div>

                    <p className='font-bold text-2xl'>{name}</p>
                </div>

                <div className='user-section'>
                    <div className='user-avatar'>
                        <Image src={userImage} alt={`${userName} Image`} width={130} height={130} className='rounded-lg' />
                        <p className='font-bold text-2xl'>
                            {userName}
                        </p>
                    </div>
                    <button className='btn-mic' onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE} >
                        <Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} alt={`${userName} mic`} width={36} height={36} />
                        <p className='max-sm:hidden'>
                            {isMuted ? 'Turn on microphone' : 'Turn off microphone'}
                        </p>
                    </button>
                    <button className={cn('rounded-lg py-2 cursor-pointer transition-colors w-full text-white', callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary', callStatus === CallStatus.CONNECTING && 'animate-pulse')} onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}>
                        {callStatus === CallStatus.ACTIVE ? "End Session" : callStatus === CallStatus.CONNECTING ? 'Connecting' : 'Start Session'}
                    </button>
                </div>
            </section>

            <section className='transcript'>
                <div className='transcript-message no-scrollbar'>
                {messages.map((message, index) => {
                    if (message.role === 'assistant') {
                        return (
                            <p key={index} className='max-sm:text-sm'>
                                {name.split(' ')[0].replace(/[.]/g, '')}: {message.content}
                            </p>
                        );
                    } else {
                        return <p key={index} className='text-primary max-sm:text-sm'>
                            {userName}: {message.content}
                        </p>
                    }
                })}
                </div>

                <div className='transcript-fade' />
            </section>
        </section>
    )
}

export default CompanionComponent