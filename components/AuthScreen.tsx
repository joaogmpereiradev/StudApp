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
        } catch (e) { 
            setAuthError("Erro na conexão Google."); 
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
        } catch (e) { 
            setAuthError("Credenciais inválidas ou erro no servidor."); 
        } finally { 
            setSubmitting(false); 
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
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
                    {authError && <p className="text-rose-500 text-xs font-bold text-center">{authError}</p>}
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
                    className="w-full flex items-center justify-center gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-4 rounded-2xl font-bold transition-all text-sm mb-6 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/action/google.svg" width="20" alt="Google" /> 
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
