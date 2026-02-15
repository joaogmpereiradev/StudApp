import React, { useState, useRef, useMemo } from 'react';
import { User, db, doc, setDoc, deleteDoc } from '../services/firebase';
import { RoutineActivity } from '../types';
import { APP_ID, COLOR_LIBRARY, ICON_LIBRARY, COLOR_STYLES } from '../constants';
import { GoogleGenAI, Type, Schema } from "@google/genai";

interface RoutineViewProps {
    user: User;
    routine: RoutineActivity[];
}

const RoutineView: React.FC<RoutineViewProps> = ({ user, routine }) => {
    const [activeTab, setActiveTab] = useState<'weekday' | 'weekend'>('weekday');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    
    // AI States
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Voice State
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<any>(null);
    const basePromptRef = useRef<string>(''); // Stores text present before recording starts

    const [newActivity, setNewActivity] = useState<Partial<RoutineActivity>>({ 
        time: '08:00', 
        title: '', 
        desc: '', 
        icon: 'fa-book', 
        color: 'indigo' 
    });

    // Group activities by time to show options
    const groupedRoutine = useMemo(() => {
        const filtered = routine.filter(r => r.type === activeTab);
        const groups: Record<string, RoutineActivity[]> = {};
        
        filtered.forEach(item => {
            if (!groups[item.time]) {
                groups[item.time] = [];
            }
            groups[item.time].push(item);
        });

        // Sort keys (times)
        return Object.keys(groups).sort().map(time => ({
            time,
            items: groups[time]
        }));
    }, [routine, activeTab]);

    // Helper to clear form state
    const resetForm = () => {
        setNewActivity({ 
            time: '08:00', 
            title: '', 
            desc: '', 
            icon: 'fa-book', 
            color: 'indigo' 
        });
    };

    const saveActivity = async () => {
        if (!newActivity.title || !user) return;
        
        const id = editingId || Date.now().toString();
        
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'routine', id), { 
            ...newActivity, 
            type: activeTab,
            id // Ensure ID is saved in doc as well
        });
        
        resetForm();
        setEditingId(null); 
        setIsFormOpen(false);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'routine', itemToDelete));
            setItemToDelete(null);
        }
    };

    const confirmDeleteAll = async () => {
        if (!user) return;
        // Filter to delete only items from the active tab
        const itemsToDelete = routine.filter(item => item.type === activeTab);
        
        const deletePromises = itemsToDelete.map(item => 
            deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'routine', item.id))
        );
        await Promise.all(deletePromises);
        setIsDeletingAll(false);
    };

    const handleEdit = (item: RoutineActivity) => {
        setNewActivity(item);
        setEditingId(item.id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- VOICE RECOGNITION (REAL TIME) ---
    const handleVoiceInput = () => {
        if (isRecording) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsRecording(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            alert("Seu navegador não suporta reconhecimento de voz.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true; 
        // FIX: Set interimResults to false to prevent Android duplication bugs ("criecriecrie")
        recognition.interimResults = false; 

        // Save current text so we append to it
        basePromptRef.current = aiPrompt;

        recognition.onstart = () => {
            setIsRecording(true);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognition.onresult = (event: any) => {
            // Simplified logic: Join all results in the current session
            const currentSessionTranscript = Array.from(event.results)
                .map((result: any) => result[0].transcript)
                .join(''); // Join chunks without spaces, spaces are usually in the transcript or we handle below

            // Smart spacing: Add space if base text exists and doesn't end with space
            const spacer = (basePromptRef.current.length > 0 && !basePromptRef.current.endsWith(' ') && currentSessionTranscript.length > 0) ? ' ' : '';
            
            setAiPrompt(basePromptRef.current + spacer + currentSessionTranscript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    // --- GEMINI AI INTEGRATION ---
    const generateRoutineWithAI = async () => {
        // Stop recording immediately if it's running
        if (isRecording && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }

        if (!aiPrompt.trim() || !user) return;
        setIsGenerating(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Define valid values for the model
            const validColors = COLOR_LIBRARY.map(c => c.value).join(', ');
            const validIcons = ICON_LIBRARY.join(', ');

            // Get current routine to provide context
            const currentRoutine = routine.filter(r => r.type === activeTab);
            const currentRoutineJSON = JSON.stringify(currentRoutine.map(({id, ...rest}) => rest)); // Send without IDs to avoid confusion

            const schema: Schema = {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        time: { type: Type.STRING, description: "Time in HH:MM format (24h)" },
                        title: { type: Type.STRING, description: "Short title of the activity" },
                        desc: { type: Type.STRING, description: "Brief description or motivation" },
                        icon: { type: Type.STRING, description: `Icon class name. MUST be one of: ${validIcons}` },
                        color: { type: Type.STRING, description: `Color name. MUST be one of: ${validColors}` },
                        type: { type: Type.STRING, description: "Must be 'weekday' or 'weekend'" }
                    },
                    required: ["time", "title", "desc", "icon", "color", "type"]
                }
            };

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `
                I am managing a schedule for '${activeTab}'.
                
                CURRENT ROUTINE (JSON):
                ${currentRoutineJSON}

                USER REQUEST: 
                "${aiPrompt}"

                TASK:
                1. Analyze the User Request.
                2. If the user asks to "Create" a routine from scratch, ignore the Current Routine.
                3. If the user asks to "Edit", "Change", or "Add" to the routine, use the Current Routine as a base.
                4. CRITICAL: Resolve conflicts intelligently. However, if the user implies OPTIONS (e.g., "Gym OR Running" at the same time), keep both activities at the exact same time. Do not allow duplicate logical errors (like two breakfasts at different times), but parallel options are allowed.
                5. Return the COMPLETE, VALID JSON list of activities for '${activeTab}'. This list will REPLACE the current one in the database.
                `,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                    systemInstruction: `You are an expert study planner and scheduler. 
                    Your goal is to organize the user's day logically.
                    Always ensure times are sorted and realistic.
                    Use the provided icons and colors to categorize activities logically.
                    Available icons: ${validIcons}.
                    Available colors: ${validColors}.`
                }
            });

            let jsonText = response.text || "[]";
            if (jsonText.startsWith("```")) {
                jsonText = jsonText.replace(/^```(json)?\s*/, "").replace(/\s*```$/, "");
            }

            const generatedActivities = JSON.parse(jsonText);

            // 1. Delete OLD activities for this tab (Smart Update Strategy: Wipe & Replace for this specific view)
            const deletePromises = currentRoutine.map(item => 
                deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'routine', item.id))
            );
            await Promise.all(deletePromises);

            // 2. Add NEW/UPDATED activities
            const batchPromises = generatedActivities.map(async (activity: any) => {
                const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                const safeActivity = {
                    ...activity,
                    id,
                    type: activeTab, // Force type to match current tab to be safe
                    icon: ICON_LIBRARY.includes(activity.icon) ? activity.icon : 'fa-book',
                    color: COLOR_LIBRARY.some(c => c.value === activity.color) ? activity.color : 'indigo'
                };
                return setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'routine', id), safeActivity);
            });

            await Promise.all(batchPromises);
            
            setAiPrompt('');
            setIsAIModalOpen(false);

        } catch (error) {
            console.error("Error generating routine:", error);
            alert("Desculpe, houve um erro ao processar. Tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 animate-in relative pb-12">
            {/* Delete Single Item Modal */}
            {itemToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800 text-center space-y-4">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <i className="fas fa-trash-alt text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Excluir Atividade?</h3>
                            <p className="text-slate-500 text-sm mt-2">Essa ação não pode ser desfeita. Tem certeza que deseja remover este item?</p>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button 
                                onClick={() => setItemToDelete(null)}
                                className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 py-4 rounded-2xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-200 dark:shadow-none transition-all active:scale-95 text-xs uppercase tracking-widest"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete All Modal */}
            {isDeletingAll && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border-2 border-rose-100 dark:border-rose-900/30 text-center space-y-4">
                        <div className="w-16 h-16 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg shadow-rose-200 dark:shadow-none">
                            <i className="fas fa-exclamation-triangle text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">
                                Excluir Rotina de {activeTab === 'weekday' ? 'Semana' : 'Fim de Semana'}?
                            </h3>
                            <p className="text-slate-500 text-sm mt-2">
                                Você está prestes a apagar <strong>todas</strong> as atividades desta lista. Isso não pode ser desfeito.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button 
                                onClick={() => setIsDeletingAll(false)}
                                className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDeleteAll}
                                className="flex-1 py-4 rounded-2xl font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 dark:shadow-none transition-all active:scale-95 text-xs uppercase tracking-widest"
                            >
                                Apagar Tudo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Generator Modal */}
            {isAIModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 space-y-5 relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <i className="fas fa-wand-magic-sparkles text-2xl animate-pulse"></i>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                {routine.length > 0 ? "Editar com IA" : "Criar com IA"}
                            </h3>
                            <p className="text-slate-500 text-sm mt-2">Descreva sua rotina ideal e deixe a inteligência artificial organizar seu dia.</p>
                        </div>

                        <div className="relative">
                            <textarea 
                                className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 border-none resize-none text-sm font-medium placeholder-slate-400 shadow-inner pr-12"
                                placeholder="Ex: Quero acordar às 7h, estudar matemática de manhã, ir para a academia antes do almoço e revisar inglês à noite."
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                            ></textarea>
                            
                            <button 
                                onClick={handleVoiceInput}
                                className={`absolute bottom-3 right-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${
                                    isRecording 
                                    ? 'bg-rose-500 text-white animate-pulse shadow-rose-300 dark:shadow-rose-900/40' 
                                    : 'bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:scale-105'
                                }`}
                                title={isRecording ? "Parar gravação" : "Falar comando"}
                            >
                                <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                onClick={() => {
                                    setIsAIModalOpen(false);
                                    if(isRecording && recognitionRef.current) recognitionRef.current.stop();
                                    setIsRecording(false);
                                }}
                                className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs uppercase tracking-widest"
                                disabled={isGenerating}
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={generateRoutineWithAI}
                                disabled={isGenerating || !aiPrompt.trim()}
                                className="flex-1 py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? (
                                    <><i className="fas fa-circle-notch fa-spin"></i> Organizando...</>
                                ) : (
                                    <><i className="fas fa-bolt"></i> Gerar</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <button 
                    onClick={() => setIsAIModalOpen(true)} 
                    className="w-full p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl hover:scale-[1.01] transition-all relative overflow-hidden group flex items-center justify-between px-8"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl group-hover:bg-white/20 transition-colors"></div>
                    <div className="relative text-left">
                        <span className="block text-xl font-black mb-0.5">
                            {routine.length > 0 ? "Edite sua rotina com IA" : "Crie uma rotina com IA"}
                        </span>
                        <span className="text-indigo-100 text-xs font-medium">
                            {routine.length > 0 ? "Reorganize seu cronograma automaticamente" : "Gere automaticamente seu cronograma de estudos"}
                        </span>
                    </div>
                    <div className="relative w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <i className="fas fa-wand-magic-sparkles text-xl"></i>
                    </div>
                </button>

                <button 
                    onClick={() => {
                        resetForm();
                        setEditingId(null);
                        setIsFormOpen(true);
                    }} 
                    className="w-full p-5 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-slate-400 dark:text-slate-600 font-bold hover:border-slate-400 hover:text-slate-600 dark:hover:text-slate-400 transition-all flex items-center justify-center gap-3 group"
                >
                    <i className="fas fa-plus-circle text-indigo-500 group-hover:scale-110 transition-transform"></i> 
                    Adicionar nova atividade
                </button>
            </div>
            
            {isFormOpen && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl space-y-6 animate-in border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 text-slate-400">
                        <h2 className="text-xs font-black uppercase tracking-widest">
                            {editingId ? "Edição de Atividade" : "Nova Atividade"}
                        </h2>
                        <button onClick={()=>{setIsFormOpen(false); setEditingId(null); resetForm();}} className="hover:text-rose-500 transition-colors">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Horário</label>
                            <input type="time" className="w-full p-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none font-bold" value={newActivity.time} onChange={e=>setNewActivity({...newActivity, time: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Atividade</label>
                            <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none font-bold placeholder-slate-400" value={newActivity.title} onChange={e=>setNewActivity({...newActivity, title: e.target.value})} placeholder="Ex: Café da manhã" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Detalhes</label>
                            <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none font-bold placeholder-slate-400" value={newActivity.desc} onChange={e=>setNewActivity({...newActivity, desc: e.target.value})} placeholder="Ex: Pão com ovos e café" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marcador</p>
                            <div className="flex flex-wrap gap-3">
                                {COLOR_LIBRARY.map(c => (
                                    <button 
                                        key={c.value} 
                                        onClick={() => setNewActivity({...newActivity, color: c.value})} 
                                        className={`w-9 h-9 rounded-full border-4 transition-all ${newActivity.color === c.value ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent shadow-sm'}`} 
                                        style={{backgroundColor: c.hex}}
                                    ></button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ícone</p>
                            <div className="grid grid-cols-6 gap-2">
                                {ICON_LIBRARY.map(ic => (
                                    <button 
                                        key={ic} 
                                        onClick={() => setNewActivity({...newActivity, icon: ic})} 
                                        className={`w-11 h-11 rounded-2xl transition-all ${newActivity.icon === ic ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                    >
                                        <i className={`fas ${ic}`}></i>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <button onClick={saveActivity} className="w-full bg-slate-900 dark:bg-indigo-600 text-white font-black py-5 rounded-3xl shadow active:scale-95 transition-all text-xs uppercase tracking-widest hover:opacity-90">Salvar</button>
                </div>
            )}

            <div className="flex gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <button onClick={() => setActiveTab('weekday')} className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all ${activeTab === 'weekday' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>SEMANA</button>
                <button onClick={() => setActiveTab('weekend')} className={`flex-1 py-3.5 rounded-xl text-xs font-black transition-all ${activeTab === 'weekend' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>FIM DE SEMANA</button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
                <table className="w-full text-left table-fixed">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {groupedRoutine.length === 0 ? (
                            <tr><td className="px-12 py-24 text-center text-slate-400 italic font-bold leading-relaxed">Lista vazia. Crie atividades para adicionar a sua rotina semanal 🚀</td></tr>
                        ) : groupedRoutine.map(({ time, items }) => (
                            <tr key={time} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                <td className="px-4 md:px-10 py-10 text-lg font-black text-slate-800 dark:text-slate-300 w-24 md:w-32 align-top">{time}</td>
                                <td className="px-4 md:px-10 py-10">
                                    <div className="flex flex-col gap-6">
                                        {items.map((item, index) => (
                                            <div key={item.id} className="relative">
                                                {/* Separator for options */}
                                                {index > 0 && (
                                                    <div className="flex items-center gap-4 py-4 opacity-50">
                                                        <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">OU</span>
                                                        <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                                                    </div>
                                                )}
                                                
                                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                                    <div className="flex flex-col items-start gap-2 md:flex-row md:items-center md:gap-4 flex-1 min-w-0 w-full">
                                                        <span className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black border shadow-sm ${COLOR_STYLES[item.color || 'indigo']} max-w-full`}>
                                                            <i className={`fas ${item.icon} shrink-0`}></i> 
                                                            <span className="truncate">{item.title}</span>
                                                        </span>
                                                        {item.desc && (
                                                            <span className="text-sm text-slate-500 dark:text-slate-600 font-medium italic break-words w-full md:w-auto pl-1 md:pl-0">
                                                                {item.desc}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-3 shrink-0 self-end md:self-auto">
                                                        <button onClick={() => handleEdit(item)} className="w-11 h-11 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><i className="fas fa-pencil-alt text-xs"></i></button>
                                                        <button onClick={() => setItemToDelete(item.id)} className="w-11 h-11 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><i className="fas fa-trash-alt text-xs"></i></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {routine.filter(r => r.type === activeTab).length > 0 && (
                <div className="flex justify-center pt-8">
                    <button 
                        onClick={() => setIsDeletingAll(true)}
                        className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 text-xs font-bold uppercase tracking-widest py-3 px-6 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all flex items-center gap-2"
                    >
                        <i className="fas fa-trash-alt"></i> Excluir Rotina ({activeTab === 'weekday' ? 'Semana' : 'Fim de Semana'})
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoutineView;