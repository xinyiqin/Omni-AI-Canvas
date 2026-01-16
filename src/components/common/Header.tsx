import React from 'react';
import { Wand2, Languages, Sparkle, Plus } from 'lucide-react';
import { useTranslation, Language } from '../../i18n/useTranslation';

interface HeaderProps {
  lang: Language;
  onToggleLang: () => void;
  onCreateWorkflow: () => void;
  onAIGenerate: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  onCreateWorkflow,
  onAIGenerate
}) => {
  const { t } = useTranslation(lang);

  return (
    <header className="h-20 border-b border-slate-800/60 flex items-center justify-between px-10 bg-slate-900/40 backdrop-blur-3xl z-40">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
          <Wand2 className="text-white" size={24} />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-black uppercase tracking-widest text-white">
            {t('app_name')}
          </h1>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            {t('app_subtitle')}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <button
          onClick={onToggleLang}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-800"
        >
          <Languages size={14} /> {t('lang_name')}
        </button>
        <button
          onClick={onAIGenerate}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <Sparkle size={18} /> {t('ai_generate_workflow')}
        </button>
        <button
          onClick={onCreateWorkflow}
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
        >
          <Plus size={18} /> {t('create_workflow')}
        </button>
      </div>
    </header>
  );
};


