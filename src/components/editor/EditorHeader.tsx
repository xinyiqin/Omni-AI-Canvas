import React from 'react';
import {
  ChevronLeft,
  ZoomIn,
  ZoomOut,
  Maximize,
  Languages,
  BookOpen,
  Timer,
  X,
  Save,
  Play,
  Pause,
  RefreshCw,
  Zap,
  Undo,
  Redo
} from 'lucide-react';
import { WorkflowState } from '../../../types';
import { useTranslation, Language } from '../../i18n/useTranslation';
import { formatTime } from '../../utils/format';

interface ViewState {
  x: number;
  y: number;
  zoom: number;
}

interface EditorHeaderProps {
  lang: Language;
  workflow: WorkflowState;
  view: ViewState;
  selectedRunId: string | null;
  isPaused: boolean;
  isRunning: boolean;
  canvasRef: React.RefObject<HTMLDivElement>;
  onBack: () => void;
  onWorkflowNameChange: (name: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleLang: () => void;
  onClearSnapshot: () => void;
  onSave: () => void;
  onPause: () => void;
  onRun: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  lang,
  workflow,
  view,
  selectedRunId,
  isPaused,
  isRunning,
  canvasRef,
  onBack,
  onWorkflowNameChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleLang,
  onClearSnapshot,
  onSave,
  onPause,
  onRun,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}) => {
  const { t } = useTranslation(lang);

  return (
    <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-6 bg-slate-900/40 backdrop-blur-2xl z-40">
      <div className="flex items-center gap-5">
        <button
          onClick={onBack}
          className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-col">
          <input
            value={workflow.name}
            onChange={(e) => {
              onClearSnapshot();
              onWorkflowNameChange(e.target.value);
            }}
            className="bg-transparent border-none text-base font-bold focus:ring-0 p-0 hover:bg-slate-800/20 rounded px-1 transition-colors w-64"
          />
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
            {t('editing_logic')}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {/* Undo/Redo Controls */}
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-800 rounded-xl p-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title={lang === 'zh' ? '撤销 (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
          >
            <Undo size={14} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            title={lang === 'zh' ? '重做 (Ctrl+Y)' : 'Redo (Ctrl+Y)'}
          >
            <Redo size={14} />
          </button>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-800/50 border border-slate-800 rounded-xl p-1">
          <button
            onClick={onZoomIn}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            title={lang === 'zh' ? '放大' : 'Zoom In'}
          >
            <ZoomIn size={14} />
          </button>
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 min-w-[3rem] text-center">
            {Math.round(view.zoom * 100)}%
          </div>
          <button
            onClick={onZoomOut}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            title={lang === 'zh' ? '缩小' : 'Zoom Out'}
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={onResetView}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            title={lang === 'zh' ? '重置视图' : 'Reset View'}
          >
            <Maximize size={14} />
          </button>
        </div>

        <button
          onClick={onToggleLang}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-bold transition-all border border-slate-800"
        >
          <Languages size={12} /> {t('lang_name')}
        </button>
        {selectedRunId && (
          <>
            <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 animate-pulse">
              <BookOpen size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase text-indigo-400">
                {t('snapshot_view')}
              </span>
              <button onClick={onClearSnapshot} className="ml-2 hover:text-white">
                <X size={12} />
              </button>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-800">
              <Timer size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase text-slate-300">
                {t('run_time')}:{' '}
                {formatTime(
                  workflow.history.find((r) => r.id === selectedRunId)?.totalTime
                )}
              </span>
            </div>
          </>
        )}
        <button
          onClick={onSave}
          className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold border transition-all ${
            workflow.isDirty
              ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400 hover:bg-indigo-600/20'
              : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}
        >
          <Save size={16} /> {t('save_flow')}
        </button>
        <div className="w-px h-6 bg-slate-800"></div>
        {isRunning && (
          <button
            onClick={onPause}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold shadow-xl transition-all ${
              isPaused
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-500/20'
                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-500/20'
            } active:scale-95`}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            {isPaused ? (lang === 'zh' ? '继续' : 'Resume') : (lang === 'zh' ? '暂停' : 'Pause')}
          </button>
        )}
        <button
          onClick={onRun}
          disabled={isRunning && !isPaused}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold shadow-xl transition-all ${
            isRunning && !isPaused
              ? 'bg-slate-800 text-slate-500'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95'
          }`}
        >
          {isRunning && !isPaused ? (
            <RefreshCw className="animate-spin" size={16} />
          ) : (
            <Zap size={16} />
          )}
          {isRunning && !isPaused ? t('executing') : t('run_fabric')}
        </button>
      </div>
    </header>
  );
};

