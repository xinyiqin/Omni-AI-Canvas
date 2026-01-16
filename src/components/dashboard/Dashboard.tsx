import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { WorkflowState } from '../../../types';
import { PRESET_WORKFLOWS } from '../../../preset_workflow';
import { useTranslation, Language } from '../../i18n/useTranslation';
import { WorkflowCard } from './WorkflowCard';
import { Header } from '../common/Header';

interface DashboardProps {
  lang: Language;
  myWorkflows: WorkflowState[];
  activeTab: 'MY' | 'PRESET';
  onToggleLang: () => void;
  onCreateWorkflow: () => void;
  onAIGenerate: () => void;
  onOpenWorkflow: (workflow: WorkflowState) => void;
  onDeleteWorkflow: (id: string, e: React.MouseEvent) => void;
  onSetActiveTab: (tab: 'MY' | 'PRESET') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  lang,
  myWorkflows,
  activeTab,
  onToggleLang,
  onCreateWorkflow,
  onAIGenerate,
  onOpenWorkflow,
  onDeleteWorkflow,
  onSetActiveTab
}) => {
  const { t } = useTranslation(lang);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans overflow-hidden">
      <Header
        lang={lang}
        onToggleLang={onToggleLang}
        onCreateWorkflow={onCreateWorkflow}
        onAIGenerate={onAIGenerate}
      />
      <main className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex items-center gap-8 border-b border-slate-800/60 pb-1">
            <button
              onClick={() => onSetActiveTab('MY')}
              className={`pb-4 px-4 text-sm font-black uppercase tracking-widest transition-all relative ${
                activeTab === 'MY'
                  ? 'text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t('my_workflows')}
              {activeTab === 'MY' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-400 rounded-full animate-in fade-in duration-300"></div>
              )}
            </button>
            <button
              onClick={() => onSetActiveTab('PRESET')}
              className={`pb-4 px-4 text-sm font-black uppercase tracking-widest transition-all relative ${
                activeTab === 'PRESET'
                  ? 'text-indigo-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t('preset_library')}
              {activeTab === 'PRESET' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-400 rounded-full animate-in fade-in duration-300"></div>
              )}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {activeTab === 'MY' &&
              (myWorkflows.length === 0 ? (
                <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-20">
                  <LayoutGrid size={64} className="mb-4" />
                  <p className="text-sm font-black uppercase tracking-[0.3em]">
                    {t('no_workflows')}
                  </p>
                </div>
              ) : (
                myWorkflows.map((w) => (
                  <WorkflowCard
                    key={w.id}
                    workflow={w}
                    lang={lang}
                    onOpen={onOpenWorkflow}
                    onDelete={onDeleteWorkflow}
                  />
                ))
              ))}
            {activeTab === 'PRESET' &&
              PRESET_WORKFLOWS.map((w) => (
                <WorkflowCard
                  key={w.id}
                  workflow={w}
                  lang={lang}
                  onOpen={onOpenWorkflow}
                  onDelete={() => {}} // Presets cannot be deleted
                  isPreset={true}
                />
              ))}
          </div>
        </div>
      </main>
    </div>
  );
};

