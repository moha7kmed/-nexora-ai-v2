import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import type { Message, ChatSession, Action, Part, SpecialistMode, Settings, UserProfile } from './types';
import { 
    startChat as startGeminiChat, initializeAi, handleImageEditing, handleVideoTranscript, 
    handleContentWriting, handleInteriorDesign, handleBrandIdentity, handleMeetingSummary, handleTripPlanning, 
    handleHealthPlan, handleVideoTranslation, handleImageEnhancement, handleImageEnhancementV2,
    InvalidApiKeyError,
    handleGenerateImage
} from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import type { Content, GenerateContentResponse } from '@google/genai';
import { ALL_ACADEMIC_SUBJECTS, ALL_PROGRAMMING_SUBJECTS } from './types';
import useSettings from './hooks/useSettings';
import useProfile from './hooks/useProfile';
import SuspenseLoader from './components/SuspenseLoader';

// Lazy load components for performance optimization
const Sidebar = lazy(() => import('./components/Sidebar'));
const ChatMessage = lazy(() => import('./components/ChatMessage'));
const ChatInput = lazy(() => import('./components/ChatInput'));
const ChatSuggestions = lazy(() => import('./components/ChatSuggestions'));
const VisionModeUI = lazy(() => import('./components/VisionModeUI'));
const VoiceModeUI = lazy(() => import('./components/VoiceModeUI'));
const CommandLoader = lazy(() => import('./components/CommandLoader'));
const FeaturesMenu = lazy(() => import('./components/FeaturesMenu'));
const VideoTranscriptUI = lazy(() => import('./components/VideoTranscriptUI'));
const ContentWriterUI = lazy(() => import('./components/ContentWriterUI'));
const InteriorDesignerUI = lazy(() => import('./components/InteriorDesignerUI'));
const BrandIdentityUI = lazy(() => import('./components/BrandIdentityUI'));
const MeetingSummarizerUI = lazy(() => import('./components/MeetingSummarizerUI'));
const TripPlannerUI = lazy(() => import('./components/TripPlannerUI'));
const HealthCoachUI = lazy(() => import('./components/HealthCoachUI'));
const VideoTranslatorUI = lazy(() => import('./components/VideoTranslatorUI'));
const Header = lazy(() => import('./components/Header'));
const Landing = lazy(() => import('./components/Landing'));
const PhotoshopModeUI = lazy(() => import('./components/PhotoshopModeUI'));
const SpecialistModeUI = lazy(() => import('./components/SpecialistModeUI'));
const ImageEnhancerUI = lazy(() => import('./components/ImageEnhancerUI'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
const ApiKeySetup = lazy(() => import('./components/ApiKeySetup'));

type ModelType = 'standard' | 'pro';
type SessionsState = { [key in ModelType]: ChatSession[] };
type ActiveSessionIdsState = { [key in ModelType]: string | null };
type ProUsageState = { count: number; resetTime: number };

interface SplashScreenProps {
    onFinished: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
    const [phase, setPhase] = useState('entering');

    useEffect(() => {
        const visibleTimer = setTimeout(() => {
            setPhase('exiting');
        }, 2200); 

        const exitTimer = setTimeout(() => {
            onFinished();
        }, 2700);

        return () => {
            clearTimeout(visibleTimer);
            clearTimeout(exitTimer);
        };
    }, [onFinished]);

    return (
        <div className={`splash-screen ${phase}`}>
            <div className="splash-icon">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                      <linearGradient id="splash-gemini-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#4285F4' }} />
                          <stop offset="33%" style={{ stopColor: '#9B59B6' }} />
                          <stop offset="66%" style={{ stopColor: '#EA4335' }} />
                          <stop offset="100%" style={{ stopColor: '#F4B400' }} />
                      </linearGradient>
                  </defs>
                  <g transform="translate(12.5, 12.5) scale(0.75)">
                    <path
                        fill="url(#splash-gemini-gradient)"
                        d="M50 0 L61.8 38.2 L100 50 L61.8 61.8 L50 100 L38.2 61.8 L0 50 L38.2 38.2 Z"
                    />
                  </g>
                </svg>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [isSplashing, setIsSplashing] = useState(true);
    const [view, setView] = useState<'hero' | 'chat'>('hero');
    
    // State refactored to handle separate models
    const [sessions, setSessions] = useState<SessionsState>({ standard: [], pro: [] });
    const [activeSessionIds, setActiveSessionIds] = useState<ActiveSessionIdsState>({ standard: null, pro: null });
    const [activeModel, setActiveModel] = useState<ModelType>('standard');

    const [isLoading, setIsLoading] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [showScrollDownButton, setShowScrollDownButton] = useState(false);
    
    const [settings, updateSettings] = useSettings();
    const [isApiReady, setIsApiReady] = useState<boolean>(!!settings.userApiKey);
    const [profile, saveProfile] = useProfile();

    const [proUsage, setProUsage] = useState<ProUsageState>({ count: 0, resetTime: 0 });
    const PRO_MESSAGE_LIMIT = 7;
    const PRO_RESET_HOURS = 7;

    const [isVisionMode, setVisionMode] = useState(false);
    const [isVoiceMode, setVoiceMode] = useState(false);
    const [isFeaturesMenuOpen, setFeaturesMenuOpen] = useState(false);
    const [commandLoaderState, setCommandLoaderState] = useState<'idle' | 'listening' | 'executing'>('idle');
    const [specialistMode, setSpecialistMode] = useState<SpecialistMode>(null);
    const [isSpecialistModeModalOpen, setSpecialistModeModalOpen] = useState(false);
    const [thinkingProgress, setThinkingProgress] = useState<{ steps: string[]; percentage: number } | null>(null);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
    const [isAppInstalled, setIsAppInstalled] = useState(false);

    const [isPhotoshopMode, setPhotoshopMode] = useState(false);
    const [isVideoTranscriptMode, setVideoTranscriptMode] = useState(false);
    const [isContentWriterMode, setContentWriterMode] = useState(false);
    const [isInteriorDesignerMode, setInteriorDesignerMode] = useState(false);
    const [isBrandIdentityMode, setBrandIdentityMode] = useState(false);
    const [isMeetingSummarizerMode, setMeetingSummarizerMode] = useState(false);
    const [isTripPlannerMode, setTripPlannerMode] = useState(false);
    const [isHealthCoachMode, setHealthCoachMode] = useState(false);
    const [isVideoTranslatorMode, setVideoTranslatorMode] = useState(false);
    const [isImageEnhancerMode, setImageEnhancerMode] = useState(false);
    const [isImageEnhancerV2Mode, setImageEnhancerV2Mode] = useState(false);

    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    const isGeneratingRef = useRef(false);
    
    useEffect(() => {
        try {
            initializeAi(settings.userApiKey || undefined);
            setIsApiReady(true);
        } catch (error) {
             console.error("Failed to initialize AI:", error);
             setIsApiReady(false);
        }
    }, [settings.userApiKey]);

    // Create default profile if it doesn't exist
    useEffect(() => {
        if (!profile) {
            const defaultProfile: UserProfile = {
                name: 'مستخدم جديد',
                avatar: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${Math.random()}`,
                userId: Math.random().toString(36).substring(2, 12).toUpperCase(),
            };
            saveProfile(defaultProfile);
        }
    }, [profile, saveProfile]);

    // PWA Install handler
    useEffect(() => {
        const mediaQuery = window.matchMedia('(display-mode: standalone)');
        if (mediaQuery.matches) {
            setIsAppInstalled(true);
        }

        const beforeInstallHandler = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        };
        
        const appInstalledHandler = () => {
            setIsAppInstalled(true);
            setDeferredInstallPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', beforeInstallHandler);
        window.addEventListener('appinstalled', appInstalledHandler);

        return () => {
            window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
            window.removeEventListener('appinstalled', appInstalledHandler);
        };
    }, []);

    const handlePwaInstall = async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        setDeferredInstallPrompt(null);
    };
    
    const showPwaInstallButton = !!deferredInstallPrompt && !isAppInstalled;

    // Theme effect & model-based theme switching
    useEffect(() => {
        const isDark = (activeModel === 'standard' && (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)));
        
        if (isDark) {
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
        }
        
        // Add class for persistent pro-mode animation
        if (activeModel === 'pro') {
            document.body.classList.add('pro-mode-active');
        } else {
            document.body.classList.remove('pro-mode-active');
        }
    }, [settings.theme, activeModel]);

    const handleModelChange = (newModel: ModelType) => {
        if (newModel === activeModel) return;
    
        document.body.classList.add('theme-transition');
        
        setActiveModel(newModel);
        
        setTimeout(() => {
            document.body.classList.remove('theme-transition');
        }, 2200);
    };

    // Load sessions from localStorage
    useEffect(() => {
        if (!settings.saveHistory) return;
        try {
            // One-time migration
            const oldSessionsRaw = localStorage.getItem('nexora-sessions');
            if (oldSessionsRaw) {
                localStorage.setItem('nexora-sessions-standard', oldSessionsRaw);
                localStorage.removeItem('nexora-sessions');
                const oldActiveId = localStorage.getItem('nexora-active-session');
                if (oldActiveId) {
                    localStorage.setItem('nexora-active-session-standard', oldActiveId);
                    localStorage.removeItem('nexora-active-session');
                }
            }

            const loadedSessions: SessionsState = { standard: [], pro: [] };
            const loadedActiveIds: ActiveSessionIdsState = { standard: null, pro: null };

            for (const model of ['standard', 'pro'] as ModelType[]) {
                const saved = localStorage.getItem(`nexora-sessions-${model}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        loadedSessions[model] = parsed.map((s: any) => ({ ...s, messages: s.messages || [] }));
                        const savedActiveId = localStorage.getItem(`nexora-active-session-${model}`);
                        if (savedActiveId && parsed.some((s: any) => s.id === savedActiveId)) {
                            loadedActiveIds[model] = savedActiveId;
                            if (model === activeModel) setView('chat');
                        }
                    }
                }
            }
            setSessions(loadedSessions);
            setActiveSessionIds(loadedActiveIds);
        } catch (error) {
            console.error("Failed to load sessions from localStorage", error);
        }
    }, [settings.saveHistory]);

    // Save sessions to localStorage
    useEffect(() => {
        if (!settings.saveHistory) {
            ['standard', 'pro'].forEach(model => {
                localStorage.removeItem(`nexora-sessions-${model}`);
                localStorage.removeItem(`nexora-active-session-${model}`);
            });
            return;
        }
        try {
            for (const model of ['standard', 'pro'] as ModelType[]) {
                const modelSessions = sessions[model];
                const modelActiveId = activeSessionIds[model];

                if (modelSessions.length > 0) {
                    const sessionsForStorage = modelSessions.map(session => ({
                        ...session,
                        messages: session.messages.map(message => {
                            const { inlineData, ...restPart } = message.parts[0];
                            return { ...message, parts: [restPart] };
                        })
                    }));
                    localStorage.setItem(`nexora-sessions-${model}`, JSON.stringify(sessionsForStorage));
                } else {
                    localStorage.removeItem(`nexora-sessions-${model}`);
                }
                if (modelActiveId) {
                    localStorage.setItem(`nexora-active-session-${model}`, modelActiveId);
                } else {
                    localStorage.removeItem(`nexora-active-session-${model}`);
                }
            }
        } catch (error) {
            console.error("Failed to save sessions to localStorage", error);
        }
    }, [sessions, activeSessionIds, settings.saveHistory]);
    
    // Pro Usage Rate Limiter
    useEffect(() => {
        const savedUsage = localStorage.getItem('nexora-pro-usage');
        if (savedUsage) {
            const parsed: ProUsageState = JSON.parse(savedUsage);
            if (Date.now() > parsed.resetTime) {
                // Reset if time has passed
                const newUsage = { count: 0, resetTime: 0 };
                setProUsage(newUsage);
                localStorage.setItem('nexora-pro-usage', JSON.stringify(newUsage));
            } else {
                setProUsage(parsed);
            }
        }
    }, []);

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
        messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior });
    };

    useEffect(() => {
        const container = messagesContainerRef.current;
        const handleScroll = () => {
            if (container) {
                const isScrolledToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                setShowScrollDownButton(!isScrolledToBottom);
            }
        };
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [activeSessionIds[activeModel]]);

    const executeAction = useCallback((action: Action) => {
        setCommandLoaderState('executing');
        // ... (rest of executeAction is unchanged)
    }, []);

    const handleSend = useCallback(async (text: string, files: File[] = [], options: { visionSpecialistMode?: SpecialistMode } = {}) => {
        if (activeModel === 'pro') {
            const now = Date.now();
            if (now > proUsage.resetTime) {
                const newUsage: ProUsageState = { count: 1, resetTime: now + PRO_RESET_HOURS * 60 * 60 * 1000 };
                setProUsage(newUsage);
                localStorage.setItem('nexora-pro-usage', JSON.stringify(newUsage));
            } else if (proUsage.count >= PRO_MESSAGE_LIMIT) {
                alert("لقد وصلت للحد الأقصى لاستخدام نموذج Pro حاليًا بسبب قوته والضغط على الموارد. يمكنك المتابعة مع النموذج العادي.");
                return;
            } else {
                const newUsage = { ...proUsage, count: proUsage.count + 1 };
                setProUsage(newUsage);
                localStorage.setItem('nexora-pro-usage', JSON.stringify(newUsage));
            }
        }

        const { visionSpecialistMode = null } = options;
        
        if (!text.trim() && files.length === 0) return;

        if (isVisionMode) setVisionMode(false);
        if (isVoiceMode) setVoiceMode(false);
        if (view !== 'chat') setView('chat');
        
        isGeneratingRef.current = true;
        setIsLoading(true);

        const finalSpecialistMode = activeModel === 'pro' ? null : (visionSpecialistMode || specialistMode);
        let isAutoSpecialistSession = false;
        if (activeModel === 'pro') {
             setThinkingProgress({ steps: ["بدء التفكير..."], percentage: 0 });
        }

        const userParts: Part[] = [];
        if(text) userParts.push({ text });

        const attachedFileNames: string[] = [];
        for (const file of files) {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const [header, data] = dataUrl.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || file.type;
            userParts.push({ inlineData: { mimeType, data } });
            if (!file.type.startsWith('image/')) attachedFileNames.push(file.name);
        }

        const userMessage: Message = { id: uuidv4(), role: 'user', parts: userParts, attachedFiles: attachedFileNames.length > 0 ? attachedFileNames : undefined };
        const modelMessage: Message = { id: uuidv4(), role: 'model', parts: [{ text: '' }] };
        
        const currentActiveId = activeSessionIds[activeModel];
        let sessionForContext: ChatSession;
        let isNewSession = false;
        let finalSessionId: string;

        if (!currentActiveId) {
            isNewSession = true;
            finalSessionId = uuidv4();
            const newTitle = text ? text.substring(0, 40) : (files.length > 0 ? files[0].name : "محادثة جديدة");
            sessionForContext = { id: finalSessionId, title: newTitle, messages: [userMessage, modelMessage], memory: [], lastModified: Date.now() };
        } else {
            finalSessionId = currentActiveId;
            const currentSession = sessions[activeModel].find(s => s.id === currentActiveId)!;
            sessionForContext = { ...currentSession, messages: [...currentSession.messages, userMessage, modelMessage], lastModified: Date.now() };
        }
        
        setSessions(prev => {
            const newModelSessions = isNewSession
                ? [sessionForContext, ...prev[activeModel]]
                : prev[activeModel].map(s => s.id === finalSessionId ? sessionForContext : s);
            setTimeout(() => scrollToBottom('smooth'), 0);
            return { ...prev, [activeModel]: newModelSessions };
        });

        if (isNewSession) {
            setActiveSessionIds(prev => ({...prev, [activeModel]: finalSessionId }));
        }
        
        const history: Content[] = sessionForContext.messages.slice(0, -2).map(msg => ({
            role: msg.role,
            parts: msg.parts.map(p => p.inlineData ? { inlineData: p.inlineData } : { text: p.text ?? '' })
        }));

        const memoryString = sessionForContext.memory.map(m => `${m.key}: ${m.fact}`).join('\n');
        
        const recentHistorySummary = sessionForContext.messages.slice(-8, -2)
            .map(msg => `${msg.role === 'user' ? 'انت' : 'Nexora'}: ${msg.parts.map(p => p.text || '[ملف مرفق]').join(' ')}`).join('\n');

        let fullResponse = '';
        let lastChunk: GenerateContentResponse | null = null;
        const thinkingStepRegex = /<thinking step="([^"]+)" \/>/g;
        const generateImageRegex = /<generate_image prompt="([^"]+)" \/>/g;
        const autoSpecialistStartRegex = /<auto_specialist_mode subject="([^"]+)">/g;
        const autoSpecialistEndRegex = /<\/auto_specialist_mode>/g;
        const totalEstimatedSteps = 8;
        
        try {
            const geminiChat = startGeminiChat(history, memoryString, recentHistorySummary, finalSpecialistMode, settings, activeModel);
            const stream = await geminiChat.sendMessageStream({ message: userParts });

            setSessions(current => ({...current, [activeModel]: current[activeModel].map(s => {
                if (s.id === finalSessionId) {
                    const updatedMessages = s.messages.map(m => m.id === modelMessage.id ? { ...m, streamState: 'streaming' as const } : m);
                    return { ...s, messages: updatedMessages };
                }
                return s;
            })}));
            
            for await (const chunk of stream) {
                 if (!isGeneratingRef.current) break;
                lastChunk = chunk;
                fullResponse += chunk.text;
                
                if (!finalSpecialistMode && activeModel === 'standard') {
                    const autoSpecialistMatch = autoSpecialistStartRegex.exec(fullResponse);
                    if (autoSpecialistMatch && !isAutoSpecialistSession) {
                        isAutoSpecialistSession = true;
                        setSpecialistMode(autoSpecialistMatch[1]);
                    }
                }

                if (activeModel === 'pro') {
                    const newSteps = [...fullResponse.matchAll(thinkingStepRegex)].map(match => match[1]);
                    setThinkingProgress(prev => ({ steps: Array.from(new Set([...(prev?.steps || []), ...newSteps])), percentage: Math.min(90, (newSteps.length / totalEstimatedSteps) * 100) }));
                }

                if (activeModel !== 'pro') {
                    const cleanForDisplay = fullResponse.replace(thinkingStepRegex, '').replace(generateImageRegex, '').replace(autoSpecialistStartRegex, '').replace(autoSpecialistEndRegex, '').trimStart();
                    setSessions(current => ({...current, [activeModel]: current[activeModel].map(s => {
                        if (s.id === finalSessionId) {
                            return { ...s, messages: s.messages.map(m => m.id === modelMessage.id ? { ...m, parts: [{ text: cleanForDisplay }] } : m) };
                        }
                        return s;
                    })}));
                }
            }
            
             if (activeModel === 'pro') {
                setThinkingProgress(prev => ({ steps: [...(prev?.steps || []), "صياغة الإجابة النهائية..."], percentage: 100 }));
            }
            
            const actionRegex = /<action>(.*?)<\/action>/gs;
            const groundingChunks = lastChunk?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
            
            let action: Action | null = null;
            let match = actionRegex.exec(fullResponse);
            if (match) { try { action = JSON.parse(match[1]); } catch(e) { console.error("Failed to parse action JSON:", e); } }

            const imageGenMatch = [...fullResponse.matchAll(generateImageRegex)].pop();
            let generatedImagePart: Part | null = null;
            if (imageGenMatch && imageGenMatch[1]) {
                const imagePrompt = imageGenMatch[1];
                try {
                    const imageBase64 = await handleGenerateImage(imagePrompt);
                    if (imageBase64) {
                        const [header, data] = imageBase64.split(',');
                        const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
                        generatedImagePart = { inlineData: { mimeType, data } };
                    }
                } catch (imgError) { console.error("Failed to generate image:", imgError); }
            }
            
            const cleanResponse = fullResponse.replace(actionRegex, '').replace(thinkingStepRegex, '').replace(generateImageRegex, '').replace(autoSpecialistStartRegex, '').replace(autoSpecialistEndRegex, '').trim();

            setSessions(current => ({...current, [activeModel]: current[activeModel].map(s => {
                if(s.id === finalSessionId) {
                    const finalParts: Part[] = [{ text: cleanResponse || "..." }];
                    if (generatedImagePart) finalParts.push(generatedImagePart);
                    const updatedMessages = s.messages.map(m => m.id === modelMessage.id ? { ...m, parts: finalParts, action: action || undefined, groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined, streamState: 'done' as const } : m);
                    if (action) executeAction(action);
                    return {...s, messages: updatedMessages };
                }
                return s;
            })}));

        } catch (error: any) {
            console.error("Error sending message to Gemini:", error);
            let errorMessage = "عفواً، حصل خطأ في الاتصال.";
            if (error instanceof InvalidApiKeyError) {
                errorMessage = "مفتاح API المخصص الذي أدخلته غير صالح أو انتهت صلاحيته. يرجى التحقق منه في الإعدادات أو مسحه للعودة إلى المفتاح الموحد.";
                setIsApiReady(false);
            }
            setSessions(current => ({...current, [activeModel]: current[activeModel].map(s => s.id === finalSessionId ? {...s, messages: s.messages.map(m => m.id === modelMessage.id ? { ...m, parts: [{ text: errorMessage }], streamState: 'done' } : m)}: s)}));
        } finally {
             isGeneratingRef.current = false;
             setIsLoading(false);
             if (isAutoSpecialistSession) setSpecialistMode(null);
             setTimeout(() => setThinkingProgress(null), 500);
        }
    }, [activeSessionIds, view, sessions, isVisionMode, isVoiceMode, executeAction, specialistMode, settings, activeModel, proUsage]);
    
    const handleStopGeneration = () => { isGeneratingRef.current = false; setIsLoading(false); };

    const createNewChat = () => {
        if (activeSessionIds[activeModel] || view === 'chat') {
            setView('hero');
        }
        setActiveSessionIds(p => ({...p, [activeModel]: null}));
        setSpecialistMode(null);
        setSidebarOpen(false);
    };
    
    const handleDeleteSession = (sessionId: string) => {
        const remainingSessions = sessions[activeModel].filter(s => s.id !== sessionId);
        setSessions(p => ({...p, [activeModel]: remainingSessions}));
        if (activeSessionIds[activeModel] === sessionId) {
            if (remainingSessions.length > 0) setActiveSessionIds(p => ({...p, [activeModel]: remainingSessions.sort((a,b) => b.lastModified - a.lastModified)[0].id}));
            else createNewChat();
        }
    };
    
    const handleClearAllSessions = () => {
        setSessions(p => ({...p, [activeModel]: []}));
        setActiveSessionIds(p => ({...p, [activeModel]: null}));
        setView('hero');
    };

    const handleRenameSession = (sessionId: string, newTitle: string) => {
        setSessions(p => ({...p, [activeModel]: p[activeModel].map(s => s.id === sessionId ? { ...s, title: newTitle, lastModified: Date.now() } : s)}));
    };
    
    const createFeatureActivator = (setter: React.Dispatch<React.SetStateAction<boolean>>) => () => { setFeaturesMenuOpen(false); setter(true); };

    const activeSession = sessions[activeModel].find(s => s.id === activeSessionIds[activeModel]);
    const showSuggestions = settings.showChatSuggestions && activeSession && activeSession.messages.length === 0;

    const getSpecialistName = (mode: SpecialistMode): string => {
        if (!mode) return '';
        const allSubjects = [...ALL_ACADEMIC_SUBJECTS, ...ALL_PROGRAMMING_SUBJECTS];
        return allSubjects.find(s => s.key === mode)?.name || mode;
    };
    
    if (!isApiReady) {
        return <Suspense fallback={<SuspenseLoader />}><ApiKeySetup onKeyVerified={(apiKey) => updateSettings({ userApiKey: apiKey })} /></Suspense>;
    }
    
    if (!profile) {
        return <SuspenseLoader />;
    }

    return (
        <>
            {isSplashing && <SplashScreen onFinished={() => setIsSplashing(false)} />}
            <Suspense fallback={<SuspenseLoader />}>
                <div className="vignette"></div>
                <div className="noise" aria-hidden="true"></div>
                
                {commandLoaderState !== 'idle' && <CommandLoader state={commandLoaderState} />}
                {isVisionMode && <VisionModeUI onSend={(text, img, mode) => {
                    const blob = (dataUrl: string) => {
                        const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)![1], bstr = atob(arr[1]); let n = bstr.length; const u8arr = new Uint8Array(n); while(n--) u8arr[n] = bstr.charCodeAt(n); return new Blob([u8arr], {type:mime});
                    }
                    handleSend(text, [new File([blob(img)], "vision.jpg", { type: "image/jpeg" })], { visionSpecialistMode: mode })
                }} onClose={() => setVisionMode(false)} />}
                {isVoiceMode && <VoiceModeUI onClose={() => setVoiceMode(false)} />}
                
                {isFeaturesMenuOpen && <FeaturesMenu 
                    onClose={() => setFeaturesMenuOpen(false)}
                    onActivatePhotoshop={createFeatureActivator(setPhotoshopMode)}
                    onActivateVideoTranscript={createFeatureActivator(setVideoTranscriptMode)}
                    onActivateContentWriter={createFeatureActivator(setContentWriterMode)}
                    onActivateInteriorDesigner={createFeatureActivator(setInteriorDesignerMode)}
                    onActivateBrandIdentity={createFeatureActivator(setBrandIdentityMode)}
                    onActivateMeetingSummarizer={createFeatureActivator(setMeetingSummarizerMode)}
                    onActivateTripPlanner={createFeatureActivator(setTripPlannerMode)}
                    onActivateHealthCoach={createFeatureActivator(setHealthCoachMode)}
                    onActivateVideoTranslator={createFeatureActivator(setVideoTranslatorMode)}
                    onActivateImageEnhancer={createFeatureActivator(setImageEnhancerMode)}
                    onActivateImageEnhancerV2={createFeatureActivator(setImageEnhancerV2Mode)}
                />}

                {isSpecialistModeModalOpen && <SpecialistModeUI 
                    isOpen={isSpecialistModeModalOpen}
                    onClose={() => setSpecialistModeModalOpen(false)}
                    onSelectSpecialist={(mode) => { setSpecialistMode(mode); setSpecialistModeModalOpen(false); }}
                />}

                {isSettingsModalOpen && profile && <SettingsModal
                    isOpen={isSettingsModalOpen}
                    onClose={() => setSettingsModalOpen(false)}
                    settings={settings}
                    onSettingsChange={updateSettings}
                    onClearAll={handleClearAllSessions}
                    profile={profile}
                    onProfileUpdate={saveProfile}
                    showPwaInstallButton={showPwaInstallButton}
                    onPwaInstall={handlePwaInstall}
                />}

                {isPhotoshopMode && <PhotoshopModeUI onClose={() => setPhotoshopMode(false)} onImageEdit={handleImageEditing} />}
                {isVideoTranscriptMode && <VideoTranscriptUI onClose={() => setVideoTranscriptMode(false)} onTranscript={handleVideoTranscript} />}
                {isContentWriterMode && <ContentWriterUI onClose={() => setContentWriterMode(false)} onGenerate={handleContentWriting} />}
                {isInteriorDesignerMode && <InteriorDesignerUI onClose={() => setInteriorDesignerMode(false)} onGenerate={handleInteriorDesign} />}
                {isBrandIdentityMode && <BrandIdentityUI onClose={() => setBrandIdentityMode(false)} onGenerate={handleBrandIdentity} />}
                {isMeetingSummarizerMode && <MeetingSummarizerUI onClose={() => setMeetingSummarizerMode(false)} onSummarize={handleMeetingSummary} />}
                {isTripPlannerMode && <TripPlannerUI onClose={() => setTripPlannerMode(false)} onPlan={handleTripPlanning} />}
                {isHealthCoachMode && <HealthCoachUI onClose={() => setHealthCoachMode(false)} onPlan={handleHealthPlan} />}
                {isVideoTranslatorMode && <VideoTranslatorUI onClose={() => setVideoTranslatorMode(false)} onTranslate={handleVideoTranslation} />}
                {isImageEnhancerMode && <ImageEnhancerUI onClose={() => setImageEnhancerMode(false)} onEnhance={handleImageEnhancement} />}
                {isImageEnhancerV2Mode && <ImageEnhancerUI onClose={() => setImageEnhancerV2Mode(false)} onEnhance={handleImageEnhancementV2} isV2 />}

                <Header 
                    showSidebarToggle={view === 'chat'}
                    onToggleSidebar={() => setSidebarOpen(p => !p)} 
                    specialistName={specialistMode ? getSpecialistName(specialistMode) : ''}
                    onToggleSettings={() => setSettingsModalOpen(true)}
                    showPwaInstallButton={showPwaInstallButton}
                    onPwaInstall={handlePwaInstall}
                    activeModel={activeModel}
                    onModelChange={handleModelChange}
                    proUsage={proUsage}
                />

                {view === 'chat' && <Sidebar 
                    sessions={sessions[activeModel]}
                    activeSessionId={activeSessionIds[activeModel]}
                    setActiveSessionId={(id) => {
                        setActiveSessionIds(p => ({...p, [activeModel]: id}));
                        setSpecialistMode(null);
                        setSidebarOpen(false);
                        if (view !== 'chat') setView('chat');
                    }}
                    createNewChat={createNewChat}
                    isOpen={isSidebarOpen}
                    setIsOpen={setSidebarOpen}
                    onDeleteSession={handleDeleteSession}
                    onRenameSession={handleRenameSession}
                />}

                <main>
                    <Landing 
                        className={view === 'hero' ? '' : 'hidden'}
                        onSend={(text, files) => handleSend(text, files)}
                        onNewChat={() => { setView('chat'); createNewChat(); }}
                        onToggleFeatures={() => setFeaturesMenuOpen(true)}
                        onVisionClick={() => setVisionMode(true)}
                        onMicClick={() => setVoiceMode(true)}
                        onToggleSpecialistModeModal={() => setSpecialistModeModalOpen(true)}
                        isSpecialistModeActive={!!specialistMode}
                        activeModel={activeModel}
                    />

                    <section className={`app ${view === 'chat' ? 'active' : 'hidden'}`} aria-hidden={view !== 'chat'}>
                        <section className="chat" style={{ paddingLeft: isSidebarOpen && window.innerWidth >= 1024 ? '280px' : '0' }}>
                            <div className="topbar"></div>
                            <div className="messages custom-scrollbar" ref={messagesContainerRef}>
                                {!activeSession || activeSession.messages.length === 0 ? (
                                    <div className="empty" id="emptyState">ابدأ المحادثة الآن ✨</div>
                                ) : (
                                    activeSession.messages.map((msg, index) => (
                                        <ChatMessage
                                            key={msg.id}
                                            message={msg}
                                            profile={profile}
                                            isLastMessage={index === activeSession.messages.length - 1}
                                            isLoading={isLoading && activeSession.messages[activeSession.messages.length - 1].id === msg.id && msg.role === 'model'}
                                            onExecuteAction={executeAction}
                                            thinkingProgress={thinkingProgress}
                                            activeModel={activeModel}
                                        />
                                    ))
                                )}
                            </div>
                            {showScrollDownButton && (
                                <button onClick={() => scrollToBottom('smooth')} title="النزول للأسفل" style={{ position: 'absolute', bottom: '120px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', border: '1px solid var(--border-color)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, animation: 'fadeInUp 0.3s' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: 20, height: 20}}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                                </button>
                            )}
                            <div className="composer">
                                <div className="composer-wrapper">
                                    {showSuggestions && <ChatSuggestions onSuggestionClick={handleSend} />}
                                    {specialistMode && activeModel === 'standard' && activeSession && (
                                        <div className="specialist-mode-chip">
                                            <span>وضع الخبير: {getSpecialistName(specialistMode)}</span>
                                            <button onClick={() => setSpecialistMode(null)} title="إلغاء وضع الخبير">&times;</button>
                                        </div>
                                    )}
                                    <ChatInput 
                                        onSend={(text, files) => handleSend(text, files)} 
                                        isLoading={isLoading}
                                        onVisionClick={() => setVisionMode(true)} 
                                        onMicClick={() => setVoiceMode(true)}
                                        onToggleSpecialistModeModal={() => setSpecialistModeModalOpen(true)} 
                                        onToggleFeatures={() => setFeaturesMenuOpen(true)}
                                        isSpecialistModeActive={!!specialistMode}
                                        activeModel={activeModel}
                                    />
                                </div>
                            </div>
                        </section>
                    </section>
                </main>
            </Suspense>
        </>
    );
};

export default App;