"use client";

import React, { useState } from 'react';

// --- TYPES & INTERFACES ---
interface NewsItem {
  id: string;
  category: 'Événement' | 'Licence' | 'Transfert' | 'Résultat';
  title: string;
  summary: string;
  source: string;
  date: string;
  reads: number;
  likes: number;
  hasLiked?: boolean;
  discipline: string;
  importance: 'high' | 'normal';
}

interface ThreadItem {
  id: string;
  author: string;
  role: 'Combattant' | 'Coach' | 'Promoteur';
  avatarColor: string;
  content: string;
  time: string;
  repliesCount: number;
  votes: number;
  userVote?: 'up' | 'down';
  tag: string;
}

// --- MOCK DATA ENRICHI ---
const initialNews: NewsItem[] = [
  {
    id: 'n1',
    category: 'Événement',
    title: 'Gala Madagascar Fight Night : L’arène de Mahajanga confirmée pour décembre',
    summary: 'La fédération vient de valider les infrastructures de Mahajanga pour accueillir la prochaine édition. Les combattants locaux bénéficieront d’une enveloppe de primes réévaluée à la hausse.',
    source: 'INDESY Media',
    date: 'Il y a 10 min',
    reads: 1420,
    likes: 88,
    discipline: 'MMA',
    importance: 'high'
  },
  {
    id: 'n2',
    category: 'Licence',
    title: 'Nouvelles directives FMKDA sur le suivi médical obligatoire des athlètes',
    summary: 'À partir de la saison prochaine, aucun passeport de combat ne sera validé sans l’intégration des tests d’imagerie cérébrale dans le dashboard centralisé.',
    source: 'Fédération Commission',
    date: 'Il y a 2 heures',
    reads: 930,
    likes: 45,
    discipline: 'Kickboxing',
    importance: 'normal'
  },
  {
    id: 'n3',
    category: 'Transfert',
    title: 'Tojo Laza intègre officiellement le camp d’entraînement du Team Predator',
    summary: 'Signature majeure cette semaine dans la catégorie des -70kg. Le striker finalise sa préparation avec un staff dédié au grappling pour sécuriser son prochain co-main event.',
    source: 'Chronique Combat',
    date: 'Hier',
    reads: 2150,
    likes: 312,
    discipline: 'Pancrace',
    importance: 'high'
  }
];

const initialThreads: ThreadItem[] = [
  {
    id: 't1',
    author: 'Ranaivo MMA',
    role: 'Coach',
    avatarColor: 'bg-blue-600',
    content: 'Est-ce que vous pensez que la nouvelle pesée le jour même de l’événement va impacter le ratio de KO en fin de carte ? Personnellement, je vois déjà mes athlètes perdre en explosivité au profit de l’endurance.',
    time: 'Il y a 14 min',
    repliesCount: 24,
    votes: 56,
    tag: 'Réglementation'
  },
  {
    id: 't2',
    author: 'Miora Ratsimba',
    role: 'Combattant',
    avatarColor: 'bg-red-600',
    content: 'Recherche partenaires de sparring sérieux sur Antananarivo pour la fin de semaine. Poids ciblé autour de 65-70kg. Intensité pro exigée, protections obligatoires. Laissez un message ici.',
    time: 'Il y a 1 heure',
    repliesCount: 7,
    votes: 19,
    tag: 'Entraînement'
  },
  {
    id: 't3',
    author: 'Elite Promotion',
    role: 'Promoteur',
    avatarColor: 'bg-amber-600',
    content: 'Les clauses contractuelles concernant les bonus de soumission de la soirée vont être doublées pour le prochain tournoi open. On veut voir du sol agressif et des finalisations franches.',
    time: 'Il y a 4 heures',
    repliesCount: 42,
    votes: 110,
    tag: 'Primes'
  }
];

export default function ActualitesPage() {
  const [activeTab, setActiveTab] = useState<'news' | 'threads'>('news');
  const [news, setNews] = useState<NewsItem[]>(initialNews);
  const [threads, setThreads] = useState<ThreadItem[]>(initialThreads);
  
  // États de gestion du modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Général');

  const categories = ['Général', 'Entraînement', 'Réglementation', 'Primes', 'Technique'];

  // Interaction : Like de news
  const handleLikeNews = (id: string) => {
    setNews(prev => prev.map(item => {
      if (item.id === id) {
        const hasLiked = !item.hasLiked;
        return { ...item, hasLiked, likes: item.likes + (hasLiked ? 1 : -1) };
      }
      return item;
    }));
  };

  // Interaction : Vote de discussion
  const handleVoteThread = (id: string, type: 'up' | 'down') => {
    setThreads(prev => prev.map(item => {
      if (item.id === id) {
        let voteDiff = 0;
        if (item.userVote === type) {
          voteDiff = type === 'up' ? -1 : 1;
          return { ...item, userVote: undefined, votes: item.votes + voteDiff };
        } else {
          if (item.userVote) {
            voteDiff = type === 'up' ? 2 : -2;
          } else {
            voteDiff = type === 'up' ? 1 : -1;
          }
          return { ...item, userVote: type, votes: item.votes + voteDiff };
        }
      }
      return item;
    }));
  };

  // Interaction : Publier via le Modal
  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newThread: ThreadItem = {
      id: Math.random().toString(),
      author: 'Tojo Laza (Vous)',
      role: 'Combattant',
      avatarColor: 'bg-neutral-100 text-black',
      content: newPostContent.trim(),
      time: 'À l’instant',
      repliesCount: 0,
      votes: 1,
      userVote: 'up',
      tag: selectedCategory
    };

    setThreads([newThread, ...threads]);
    setNewPostContent('');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-mono antialiased selection:bg-red-600 selection:text-white relative">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* HEADER TACTIQUE */}
        <div className="border-b-2 border-neutral-900 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600 font-black text-xs uppercase tracking-widest">
              <span className="w-2 h-2 bg-red-600 rounded-none animate-pulse" />
              Live Feed // Mialy Intel
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase">
              Actualités & Échanges
            </h1>
          </div>

          {/* DOUBLE ONGLETS UI */}
          <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-none shrink-0">
            <button
              onClick={() => setActiveTab('news')}
              className={`px-6 py-2.5 font-black uppercase text-xs tracking-wider transition-none rounded-none flex items-center gap-3 ${
                activeTab === 'news'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              Fils d’infos
              <span className={`px-1.5 py-0.5 text-[10px] ${activeTab === 'news' ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                {news.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('threads')}
              className={`px-6 py-2.5 font-black uppercase text-xs tracking-wider transition-none rounded-none flex items-center gap-3 ${
                activeTab === 'threads'
                  ? 'bg-white text-black'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              Fils de discussions
              <span className={`px-1.5 py-0.5 text-[10px] ${activeTab === 'threads' ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                {threads.length}
              </span>
            </button>
          </div>
        </div>

        {/* CONTENU PRINCIPAL INTERACTIF */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* FLUX PRINCIPAL */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* INTERFACE 1 : FILS D'INFOS */}
            {activeTab === 'news' && (
              <div className="space-y-4">
                {news.map((item) => (
                  <article
                    key={item.id}
                    className={`bg-neutral-900 border transition-none p-5 rounded-none relative group ${
                      item.importance === 'high' ? 'border-l-4 border-l-red-600 border-neutral-800' : 'border-neutral-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 uppercase tracking-wide rounded-none ${
                          item.category === 'Événement' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                          item.category === 'Transfert' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-neutral-800 text-neutral-300'
                        }`}>
                          {item.category}
                        </span>
                        <span className="text-neutral-600 text-xs">/</span>
                        <span className="text-neutral-400 text-xs font-bold uppercase">{item.discipline}</span>
                      </div>
                      <span className="text-neutral-500 text-xs">{item.date}</span>
                    </div>

                    <h3 className="text-lg font-black tracking-tight text-white mb-2 group-hover:text-red-500 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-neutral-400 text-sm font-sans leading-relaxed mb-4">
                      {item.summary}
                    </p>

                    <div className="pt-4 border-t border-neutral-800/60 flex items-center justify-between font-mono text-xs">
                      <span className="text-neutral-500">Par {item.source}</span>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-neutral-400 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          {item.reads}
                        </span>
                        
                        <button
                          onClick={() => handleLikeNews(item.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 border transition-none font-bold uppercase text-[11px] ${
                            item.hasLiked 
                              ? 'bg-red-600 text-white border-red-600' 
                              : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
                          }`}
                        >
                          💥 {item.likes}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* INTERFACE 2 : FILS DE DISCUSSIONS */}
            {activeTab === 'threads' && (
              <div className="space-y-5">
                
                {/* BLOC BOUTON ACTION DIRECTE (Déclencheur Modal) */}
                <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase tracking-wide">// Ligne tactique ouverte</h3>
                    <p className="text-xs text-neutral-400 font-sans">Partagez vos analyses de combat ou questions de licence avec le réseau.</p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 h-[42px] bg-white text-black font-black uppercase text-xs tracking-wider hover:bg-red-600 hover:text-white transition-colors rounded-none shrink-0"
                  >
                    Lancer une discussion
                  </button>
                </div>

                {/* Liste des discussions */}
                <div className="space-y-3">
                  {threads.map((thread) => (
                    <div key={thread.id} className="bg-neutral-900 border border-neutral-800 p-4 rounded-none flex gap-4 items-start">
                      
                      <div className="flex flex-col items-center bg-neutral-950 border border-neutral-800 p-1.5 shrink-0 select-none">
                        <button 
                          onClick={() => handleVoteThread(thread.id, 'up')}
                          className={`p-1 hover:text-white transition-none text-xs ${thread.userVote === 'up' ? 'text-green-500' : 'text-neutral-600'}`}
                        >
                          ▲
                        </button>
                        <span className={`text-xs font-black my-1 ${
                          thread.votes > 50 ? 'text-amber-500' : thread.votes < 0 ? 'text-red-500' : 'text-white'
                        }`}>
                          {thread.votes}
                        </span>
                        <button 
                          onClick={() => handleVoteThread(thread.id, 'down')}
                          className={`p-1 hover:text-white transition-none text-xs ${thread.userVote === 'down' ? 'text-red-500' : 'text-neutral-600'}`}
                        >
                          ▼
                        </button>
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white">{thread.author}</span>
                            <span className="text-[9px] px-1.5 py-0.2 bg-neutral-800 text-neutral-400 uppercase font-bold tracking-tight border border-neutral-700 rounded-none">
                              {thread.role}
                            </span>
                          </div>
                          <span className="text-neutral-500 text-xs">{thread.time}</span>
                        </div>

                        <p className="text-neutral-300 text-sm font-sans leading-relaxed whitespace-pre-wrap">
                          {thread.content}
                        </p>

                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400">
                            #{thread.tag}
                          </span>
                          <button className="text-xs font-black uppercase tracking-wide text-neutral-400 hover:text-white transition-colors flex items-center gap-1">
                            💬 Répondre ({thread.repliesCount})
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLONNE DROITE : METRICS */}
          <aside className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-none space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <span className="w-1.5 h-3 bg-amber-500 rounded-none inline-block" />
                Volume d’activité discipline
              </h4>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span>MMA / Pancrace</span>
                    <span className="font-bold">78%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-950 rounded-none overflow-hidden">
                    <div className="h-full bg-red-600 rounded-none" style={{ width: '78%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span>Muay Thai / Kick</span>
                    <span className="font-bold">42%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-950 rounded-none overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-none" style={{ width: '42%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-neutral-300 mb-1">
                    <span>Grappling / Judo</span>
                    <span className="font-bold">29%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-950 rounded-none overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-none" style={{ width: '29%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-none space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-red-500">// Flash Info Urgent</div>
              <div className="p-3 bg-neutral-950 border-l-2 border-l-amber-500 text-xs text-neutral-400 space-y-1 rounded-none">
                <p className="font-bold text-white uppercase text-[11px]">Contrôle des licences</p>
                <p className="font-sans">Tous les clubs doivent soumettre la mise à jour des assurances de ring avant vendredi minuit sous peine de suspension de carte.</p>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-none text-center py-6 space-y-2">
              <div className="text-[28px] font-black text-white tracking-tighter">4,812</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Membres actifs en simultané</div>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-none">
                  Réseau opérationnel
                </span>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* --- INTERACTIVE MODAL INTERFACE (Z-INDEX SUPERIEUR) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-950 border-2 border-neutral-800 w-full max-w-lg rounded-none p-6 space-y-6 shadow-[0_30px_70px_rgba(0,0,0,0.9)] relative">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">// Nouvelle transmission</span>
                <h2 className="text-lg font-black uppercase tracking-tight">Ouvrir un sujet tactile</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-white font-bold transition-colors text-sm"
              >
                [ FERMER ]
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-4">
              
              {/* Sélecteur de Catégorie Tactique */}
              <div className="space-y-2">
                <label className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                  Sélectionner l'axe de discussion :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 border font-black text-[10px] uppercase transition-none rounded-none ${
                        selectedCategory === cat
                          ? 'bg-white text-black border-white'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Zone */}
              <div className="space-y-2">
                <label className="text-xs font-black text-neutral-400 uppercase tracking-wider">
                  Contenu du message :
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Écrivez vos arguments ou détails ici..."
                  rows={4}
                  required
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-none p-3 text-sm focus:outline-none focus:border-neutral-600 text-white placeholder-neutral-600 font-sans resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white hover:border-neutral-700 font-bold uppercase text-xs rounded-none"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white font-black uppercase text-xs tracking-wider hover:bg-red-700 transition-colors rounded-none shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                >
                  Déployer sur le fil
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}