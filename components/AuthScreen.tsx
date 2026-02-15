import React, { useState } from 'react';
import { auth, provider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../services/firebase';

const AuthScreen: React.FC = () => {
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleGoogleLogin = async () => {
        setAuthError(''); 
        setSubmitting(true);
        try { 
            await signInWithPopup(auth, provider); 
        } catch (e: any) { 
            console.error("Google Auth Error:", e);
            let msg = "Erro na conexão Google.";
            
            if (e?.code === 'auth/popup-closed-by-user') msg = "Login cancelado.";
            else if (e?.code === 'auth/popup-blocked') msg = "Popup bloqueado. Permita popups para este site.";
            else if (e?.code === 'auth/unauthorized-domain') {
                msg = `Domínio não autorizado: "${window.location.hostname}". Adicione-o no Firebase Console > Auth > Settings.`;
            }
            else if (e?.code === 'auth/operation-not-supported-in-this-environment') msg = "Ambiente não suportado (Verifique se está usando http/https).";
            else if (e?.message) msg = `Erro: ${e.message}`;
            
            setAuthError(msg); 
        } finally { 
            setSubmitting(false); 
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault(); 
        if (submitting) return; 
        setAuthError(''); 
        setSubmitting(true);
        try {
            if (authMode === 'login') await signInWithEmailAndPassword(auth, email, password);
            else await createUserWithEmailAndPassword(auth, email, password);
        } catch (e: any) { 
            console.error("Email Auth Error:", e);
            let msg = "Credenciais inválidas ou erro no servidor.";
            if (e?.message) msg = e.message;
            setAuthError(msg); 
        } finally { 
            setSubmitting(false); 
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-lg border border-slate-100 dark:border-slate-800 animate-in">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mb-6 mx-auto shadow-md rotate-3">
                    <i className="fas fa-graduation-cap text-white text-3xl"></i>
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight text-center">StudApp</h1>
                <p className="text-slate-400 dark:text-slate-500 mb-8 text-sm text-center">Organização e Performance.</p>
                
                <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
                    <input 
                        type="email" 
                        placeholder="E-mail" 
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border-none text-sm placeholder-slate-400" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Senha" 
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 border-none text-sm placeholder-slate-400" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                    />
                    {authError && <p className="text-rose-500 text-xs font-bold text-center px-4">{authError}</p>}
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-sm hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                    >
                        {authMode === 'login' ? 'Entrar' : 'Criar Conta'}
                    </button>
                </form>

                <button 
                    onClick={handleGoogleLogin} 
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-4 rounded-2xl font-bold transition-all text-sm mb-6 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                </button>
                <div className="text-center">
                    <button 
                        type="button" 
                        onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(''); }} 
                        className="text-xs font-bold text-indigo-500 hover:underline uppercase tracking-wider"
                    >
                        {authMode === 'login' ? 'Cadastre-se' : 'Entrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;