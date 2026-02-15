import React, { useState, useEffect, useRef } from 'react';
import { 
    auth, 
    db, 
    onAuthStateChanged, 
    signOut, 
    sendPasswordResetEmail,
    User, 
    collection, 
    onSnapshot, 
    doc, 
    setDoc 
} from './services/firebase';
import { APP_ID } from './constants';
import { Lesson, RoutineActivity, ViewState } from './types';
import AuthScreen from './components/AuthScreen';
import RoutineView from './components/RoutineView';
import ReviewsView from './components/ReviewsView';

const App = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ViewState>('routine');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
    
    // Initialize Dark Mode from system preference or previous session
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    
    const settingsRef = useRef<HTMLDivElement>(null);

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [routine, setRoutine] = useState<RoutineActivity[]>([]);

    // Authentication Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Dark Mode Effect - The Fix
    useEffect(() => {
        // Toggle the class on HTML element only
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Persist to Firestore if user is logged in
        if (user) {
            setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'settings', 'preferences'), { isDarkMode }, { merge: true }).catch(console.error);
        }
    }, [isDarkMode, user]);

    // Data Listeners
    useEffect(() => {
        if (!user) return;

        // Listen for preferences
        const unsubPrefs = onSnapshot(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'settings', 'preferences'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.isDarkMode !== undefined) setIsDarkMode(data.isDarkMode);
            }
        });

        // Listen for lessons
        const unsubLessons = onSnapshot(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'lessons'), (s) => {
            setLessons(s.docs.map(d => ({ id: d.id, ...d.data() } as Lesson)).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        });

        // Listen for routine
        const unsubRoutine = onSnapshot(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'routine'), (s) => {
            setRoutine(s.docs.map(d => ({ id: d.id, ...d.data() } as RoutineActivity)).sort((a,b) => a.time.localeCompare(b.time)));
        });

        return () => { unsubLessons(); unsubRoutine(); unsubPrefs(); };
    }, [user]);

    // Click Outside for Settings Menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
                setIsSettingsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        signOut(auth);
        setLessons([]);
        setRoutine([]);
        setView('routine');
    };

    const handleOpenPasswordReset = () => {
        setIsSettingsOpen(false);
        setShowPasswordResetModal(true);
    };

    const confirmPasswordReset = async () => {
        if (user && user.email) {
            try {
                await sendPasswordResetEmail(auth, user.email);
                setShowPasswordResetModal(false);
                alert("Link de redefinição enviado com sucesso!");
            } catch (error) {
                alert("Erro ao enviar e-mail. Tente novamente mais tarde.");
                console.error(error);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-400">
                <i className="fas fa-circle-notch fa-spin text-2xl"></i>
            </div>
        );
    }

    if (!user) {
        return <AuthScreen />;
    }

    // Componente de Conteúdo do Menu para reutilização
    const SettingsMenuContent = () => (
        <>
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Logado como</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{user.email}</p>
            </div>
            
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-full text-left px-5 py-4 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <i className={`fas ${isDarkMode ? 'fa-sun text-amber-500' : 'fa-moon text-indigo-500'}`}></i> 
                {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
            </button>
            
            <button onClick={handleOpenPasswordReset} className="w-full text-left px-5 py-4 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <i className="fas fa-key text-slate-400"></i> Alterar Senha
            </button>

            <button onClick={handleLogout} className="w-full text-left px-5 py-4 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-3">
                <i className="fas fa-sign-out-alt"></i> Sair
            </button>
        </>
    );

    return (
        // The main container manages background colors for light/dark mode using standard Tailwind classes
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 pb-20">
            {/* Password Reset Modal */}
            {showPasswordResetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800 text-center space-y-4">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <i className="fas fa-envelope-open-text text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Redefinir Senha</h3>
                            <p className="text-slate-500 text-sm mt-3 leading-relaxed">
                                Enviaremos um link para <strong>{user.email}</strong>.
                            </p>
                            <p className="text-slate-400 text-xs mt-2 italic">
                                ⚠️ Não esqueça de verificar a caixa de <strong>SPAM</strong> ou <strong>Lixo Eletrônico</strong>.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button 
                                onClick={() => setShowPasswordResetModal(false)}
                                className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmPasswordReset}
                                className="flex-1 py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none transition-all active:scale-95 text-xs uppercase tracking-widest"
                            >
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in">
                <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 pt-4">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <h1 className="text-2xl font-black flex items-center gap-3">
                            <img src="https://img.icons8.com/fluency/240/graduation-cap.png" className="w-10 h-10" alt="Logo" />
                            <span className="tracking-tighter">StudApp</span>
                        </h1>
                        
                        {/* Mobile Settings Toggle */}
                        <div className="md:hidden relative" ref={settingsRef}>
                            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 shadow-sm">
                                <i className="fas fa-cog"></i>
                            </button>
                            {isSettingsOpen && (
                                <div className="absolute top-full right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-50 min-w-[240px] overflow-hidden">
                                    <SettingsMenuContent />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <nav className="flex bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-1">
                            <button onClick={() => setView('routine')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${view === 'routine' ? 'bg-slate-800 dark:bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>ROTINA</button>
                            <button onClick={() => setView('reviews')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${view === 'reviews' ? 'bg-slate-800 dark:bg-indigo-600 text-white shadow-md' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>REVISÕES</button>
                        </nav>
                        
                        {/* Desktop Settings Toggle */}
                        <div className="hidden md:block relative" ref={settingsRef}>
                            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="w-11 h-11 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 hover:text-indigo-600 shadow-sm transition-all">
                                <i className="fas fa-cog text-xl"></i>
                            </button>
                            {isSettingsOpen && (
                                <div className="absolute top-full right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-50 min-w-[240px] overflow-hidden">
                                    <SettingsMenuContent />
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {view === 'routine' ? (
                    <RoutineView user={user} routine={routine} />
                ) : (
                    <ReviewsView user={user} lessons={lessons} />
                )}

                <footer className="mt-16 text-center text-[10px] text-slate-400 dark:text-slate-700 font-black uppercase tracking-[0.4em] mb-12 italic">
                    StudApp • Alta Performance nos Estudos
                </footer>
            </div>
        </div>
    );
};

export default App;