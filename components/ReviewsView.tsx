import React, { useState, useMemo } from 'react';
import { User, db, doc, setDoc, deleteDoc } from '../services/firebase';
import { Lesson } from '../types';
import { APP_ID } from '../constants';

interface ReviewsViewProps {
    user: User;
    lessons: Lesson[];
}

const ReviewsView: React.FC<ReviewsViewProps> = ({ user, lessons }) => {
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [newLesson, setNewLesson] = useState({ subject: '', topic: '', date: new Date().toISOString().split('T')[0] });
    const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const filteredLessons = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return lessons.filter(lesson => {
            const subj = (lesson.subject || '').toLowerCase();
            const top = (lesson.topic || '').toLowerCase();
            const matchesSearch = subj.includes(searchText.toLowerCase()) || top.includes(searchText.toLowerCase());
            
            if (!matchesSearch) return false;
            
            if (statusFilter === 'all') return true;
            
            const hasToday = lesson.revs?.some(r => r.date === today && !r.done);
            const hasOverdue = lesson.revs?.some(r => r.date < today && !r.done);
            const isFullyDone = lesson.revs?.every(r => r.done);
            const hasFuture = lesson.revs?.some(r => r.date > today && !r.done);
            
            if (statusFilter === 'today') return hasToday;
            if (statusFilter === 'overdue') return hasOverdue;
            if (statusFilter === 'done') return isFullyDone;
            if (statusFilter === 'future') return hasFuture && !hasToday && !hasOverdue;
            
            return true;
        });
    }, [lessons, searchText, statusFilter]);

    const handleEdit = (lesson: Lesson) => {
        setNewLesson({
            subject: lesson.subject,
            topic: lesson.topic,
            date: lesson.date
        });
        setEditingId(lesson.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setNewLesson({ subject: '', topic: '', date: new Date().toISOString().split('T')[0] });
        setEditingId(null);
    };

    const saveLesson = async () => {
        if (!newLesson.subject || !newLesson.topic || !user) return;
        
        const id = editingId || Date.now().toString();
        let lessonData: Lesson;

        if (editingId) {
            // Edit Mode: Preserve existing reviews but update metadata
            const existingLesson = lessons.find(l => l.id === editingId);
            if (!existingLesson) return;

            lessonData = {
                ...existingLesson,
                subject: newLesson.subject,
                topic: newLesson.topic,
                date: newLesson.date
            };
        } else {
            // Create Mode: Generate new reviews
            const d = new Date(newLesson.date);
            
            const addDays = (days: number) => { 
                const r = new Date(d); 
                r.setDate(r.getDate() + days); 
                return r.toISOString().split('T')[0]; 
            };

            lessonData = {
                id,
                subject: newLesson.subject,
                topic: newLesson.topic,
                date: newLesson.date,
                revs: [
                    { name: 'R1', date: addDays(1), done: false },
                    { name: 'R2', date: addDays(7), done: false },
                    { name: 'R3', date: addDays(30), done: false },
                    { name: 'R4', date: addDays(90), done: false }
                ]
            };
        }

        await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'lessons', id), lessonData);
        setNewLesson({ subject: '', topic: '', date: new Date().toISOString().split('T')[0] });
        setEditingId(null);
    };

    const toggleReview = async (lesson: Lesson, index: number) => {
        const updatedRevs = [...lesson.revs];
        updatedRevs[index].done = !updatedRevs[index].done;
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'lessons', lesson.id), { ...lesson, revs: updatedRevs }, { merge: true });
    };

    const confirmDelete = async () => {
        if (lessonToDelete) {
            await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'lessons', lessonToDelete));
            setLessonToDelete(null);
        }
    };

    const getStatusColor = (date: string, done: boolean) => {
        if (done) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
        const today = new Date().toISOString().split('T')[0];
        if (date === today) return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 animate-pulse-soft font-bold';
        if (date < today) return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
        return 'bg-white text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700';
    };

    return (
        <div className="space-y-8 animate-in relative">
            {/* Delete Confirmation Modal */}
            {lessonToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800 text-center space-y-4">
                        <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <i className="fas fa-trash-alt text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Remover Revisão?</h3>
                            <p className="text-slate-500 text-sm mt-2">Esta aula e todos os seus agendamentos serão perdidos permanentemente.</p>
                        </div>
                        <div className="flex gap-3 pt-4">
                            <button 
                                onClick={() => setLessonToDelete(null)}
                                className="flex-1 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-xs uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete}
                                className="flex-1 py-4 rounded-2xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-200 dark:shadow-none transition-all active:scale-95 text-xs uppercase tracking-widest"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative overflow-hidden">
                {editingId && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-pulse"></div>
                )}
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Matéria</label>
                    <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold border-none shadow-inner" value={newLesson.subject} onChange={e=>setNewLesson({...newLesson, subject: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assunto</label>
                    <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold border-none shadow-inner" value={newLesson.topic} onChange={e=>setNewLesson({...newLesson, topic: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aula</label>
                    <input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 font-bold border-none shadow-inner" value={newLesson.date} onChange={e=>setNewLesson({...newLesson, date: e.target.value})} />
                </div>
                <div className="flex gap-2">
                    {editingId && (
                        <button onClick={cancelEdit} className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><i className="fas fa-times"></i></button>
                    )}
                    <button onClick={saveLesson} className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-2xl shadow active:scale-95 transition-all text-xs uppercase tracking-widest hover:opacity-90">
                        {editingId ? 'Salvar' : 'Agendar'}
                    </button>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-lg border border-slate-100 dark:border-slate-800 space-y-5">
                <div className="relative">
                    <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                    <input type="text" placeholder="Filtrar por nome ou matéria..." className="w-full pl-12 pr-6 py-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl outline-none text-sm font-bold border-none placeholder-slate-400" value={searchText} onChange={e => setSearchText(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2">
                    {[{id:'all',label:'Todas'},{id:'today',label:'Hoje'},{id:'overdue',label:'Atrasadas'},{id:'done',label:'Concluídas'},{id:'future',label:'Futuras'}].map(f=>(
                        <button key={f.id} onClick={()=>setStatusFilter(f.id)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${statusFilter===f.id?'bg-slate-900 dark:bg-indigo-600 text-white border-slate-900 dark:border-indigo-600 shadow-md':'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>{f.label}</button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px] md:min-w-0">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                                <th className="px-10 py-6 sticky left-0 bg-slate-50 dark:bg-slate-800/50 z-10 shadow-sm md:shadow-none md:static">CONTEÚDO</th>
                                <th className="px-2 py-6 text-center">R1</th>
                                <th className="px-2 py-6 text-center">R2</th>
                                <th className="px-2 py-6 text-center">R3</th>
                                <th className="px-2 py-6 text-center">R4</th>
                                <th className="px-10 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredLessons.length === 0 ? (
                                <tr><td colSpan={6} className="px-10 py-24 text-center text-slate-300 dark:text-slate-700 font-bold italic">Nada agendado 🎓</td></tr>
                            ) : filteredLessons.map(l => (
                                <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="px-10 py-10 sticky left-0 bg-white dark:bg-slate-900 md:bg-transparent z-10 shadow-sm md:shadow-none md:static group-hover:bg-slate-50 dark:group-hover:bg-slate-900/50">
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-300 mb-1 leading-none">{l.subject}</p>
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">{l.topic}</p>
                                    </td>
                                    {l.revs && l.revs.map((r, i) => (
                                        <td key={i} className="px-2 py-10 text-center">
                                            <button 
                                                onClick={() => toggleReview(l, i)}
                                                className={`w-11 h-11 rounded-2xl border-2 text-[9px] font-black transition-all shadow-sm active:scale-90 ${getStatusColor(r.date, r.done)}`}
                                            >
                                                {r.date.split('-').reverse().slice(0,2).join('/')}
                                            </button>
                                        </td>
                                    ))}
                                    <td className="px-10 py-10 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => handleEdit(l)} className="w-11 h-11 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                                <i className="fas fa-pencil-alt text-xs"></i>
                                            </button>
                                            <button onClick={() => setLessonToDelete(l.id)} className="w-11 h-11 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-300 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                <i className="fas fa-trash-alt text-xs"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 py-8 px-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 mt-8 animate-in transition-colors">
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-amber-100 border-2 border-amber-400 animate-pulse-soft"></div><span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Hoje</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-rose-100 border-2 border-rose-400"></div><span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Atrasada</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-400"></div><span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Concluída</span></div>
                <div className="flex items-center gap-3"><div className="w-4 h-4 rounded-full bg-white border-[3.5px] border-slate-900 dark:border-slate-400"></div><span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Futura</span></div>
            </div>
        </div>
    );
};

export default ReviewsView;