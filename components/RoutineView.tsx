import React, { useState } from 'react';
import { User, db, doc, setDoc, deleteDoc } from '../services/firebase';
import { RoutineActivity } from '../types';
import { APP_ID, COLOR_LIBRARY, ICON_LIBRARY, COLOR_STYLES } from '../constants';

interface RoutineViewProps {
    user: User;
    routine: RoutineActivity[];
}

const RoutineView: React.FC<RoutineViewProps> = ({ user, routine }) => {
    const [activeTab, setActiveTab] = useState<'weekday' | 'weekend'>('weekday');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    
    const [newActivity, setNewActivity] = useState<Partial<RoutineActivity>>({ 
        time: '08:00', 
        title: '', 
        desc: '', 
        icon: 'fa-book', 
        color: 'indigo' 
    });

    const saveActivity = async () => {
        if (!newActivity.title || !user) return;
        
        const id = editingId || Date.now().toString();
        
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'routine', id), { 
            ...newActivity, 
            type: activeTab,
            id // Ensure ID is saved in doc as well
        });
        
        setNewActivity({ time: '08:00', title: '', desc: '', icon: 'fa-book', color: 'indigo' });
        setEditingId(null); 
        setIsFormOpen(false);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'routine', itemToDelete));
            setItemToDelete(null);
        }
    };

    const handleEdit = (item: RoutineActivity) => {
        setNewActivity(item);
        setEditingId(item.id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-8 animate-in relative">
            {/* Delete Confirmation Modal */}
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

            <button 
                onClick={() => setIsFormOpen(true)} 
                className="w-full p-8 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-slate-400 dark:text-slate-600 font-bold hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-3 group"
            >
                <i className="fas fa-plus-circle group-hover:scale-110 transition-transform"></i> 
                Criar Atividade Personalizada
            </button>
            
            {isFormOpen && (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl space-y-6 animate-in border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 text-slate-400">
                        <h2 className="text-xs font-black uppercase tracking-widest">Nova Atividade</h2>
                        <button onClick={()=>{setIsFormOpen(false); setEditingId(null);}} className="hover:text-rose-500 transition-colors">
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
                            <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none font-bold placeholder-slate-400" value={newActivity.title} onChange={e=>setNewActivity({...newActivity, title: e.target.value})} placeholder="Título" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Detalhes</label>
                            <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none font-bold placeholder-slate-400" value={newActivity.desc} onChange={e=>setNewActivity({...newActivity, desc: e.target.value})} placeholder="Descrição" />
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
                <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {routine.filter(r => r.type === activeTab).length === 0 ? (
                            <tr><td className="px-12 py-24 text-center text-slate-400 italic font-bold leading-relaxed">Lista vazia. Crie atividades para adicionar a sua rotina semanal 🚀</td></tr>
                        ) : routine.filter(r => r.type === activeTab).map((item) => (
                            <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                <td className="px-10 py-10 text-lg font-black text-slate-800 dark:text-slate-300 w-24 md:w-32 align-top">{item.time}</td>
                                <td className="px-10 py-10">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <span className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black border shadow-sm ${COLOR_STYLES[item.color || 'indigo']}`}>
                                                <i className={`fas ${item.icon}`}></i> {item.title}
                                            </span>
                                            <span className="text-sm text-slate-500 dark:text-slate-600 font-medium italic truncate hidden md:block">{item.desc}</span>
                                        </div>
                                        <div className="flex gap-3 shrink-0">
                                            <button onClick={() => handleEdit(item)} className="w-11 h-11 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><i className="fas fa-pencil-alt text-xs"></i></button>
                                            <button onClick={() => setItemToDelete(item.id)} className="w-11 h-11 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><i className="fas fa-trash-alt text-xs"></i></button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RoutineView;