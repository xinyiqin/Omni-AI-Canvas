import React from 'react';
import { WorkflowState, WorkflowNode, Port, ToolDefinition, DataType } from '../../../types';
import { ViewState } from '../../utils/canvas';
import { EditorHeader } from './EditorHeader';
import { ToolPalette } from './ToolPalette';
import { Canvas } from '../canvas/Canvas';
import { NodeConfigPanel } from './NodeConfigPanel';
import { ResultsPanel } from './ResultsPanel';
import { ErrorModal } from '../modals/ErrorModal';
import { ValidationModal } from '../modals/ValidationModal';
import { Language } from '../../i18n/useTranslation';

interface EditorProps {
  lang: Language;
  workflow: WorkflowState;
  view: ViewState;
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  selectedRunId: string | null;
  connecting: {
    nodeId: string;
    portId: string;
    type: any;
    direction: 'in' | 'out';
    startX: number;
    startY: number;
  } | null;
  mousePos: { x: number; y: number };
  activeOutputs: Record<string, any>;
  nodeHeights: Map<string, number>;
  sourceNodes: any[];
  sourceOutputs: Record<string, any>;
  isPaused: boolean;
  isRunning: boolean;
  sidebarCollapsed: boolean;
  validationErrors: { message: string; type: 'ENV' | 'INPUT' }[];
  globalError: { message: string; details?: string } | null;
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
  onToggleSidebar: () => void;
  onAddNode: (tool: any) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onNodeSelect: (nodeId: string) => void;
  onConnectionSelect: (connectionId: string) => void;
  onNodeDragStart: (nodeId: string, offsetX: number, offsetY: number) => void;
  onNodeDrag: (nodeId: string, x: number, y: number) => void;
  onNodeDragEnd: () => void;
  getNodeOutputs: (node: any) => any[];
  isOverNode: boolean;
  isPanning: boolean;
  onCloseValidation: () => void;
  onCloseError: () => void;
  // Node component props
  showReplaceMenu?: string | null;
  showOutputQuickAdd?: { nodeId: string; portId: string } | null;
  showModelSelect?: string | null;
  showVoiceSelect?: string | null;
  lightX2VVoiceList?: { voices?: any[]; emotions?: string[]; languages?: any[] } | null;
  cloneVoiceList?: any[];
  onUpdateNodeData?: (nodeId: string, key: string, value: any) => void;
  onDeleteNode?: (nodeId: string) => void;
  onReplaceNode?: (nodeId: string, newToolId: string) => void;
  onRunWorkflow?: (nodeId?: string, runThisOnly?: boolean) => void;
  onSetReplaceMenu?: (nodeId: string | null) => void;
  onSetOutputQuickAdd?: (value: { nodeId: string; portId: string } | null) => void;
  onSetModelSelect?: (nodeId: string | null) => void;
  onSetVoiceSelect?: (nodeId: string | null) => void;
  onSetExpandedOutput?: (value: { nodeId: string; fieldId?: string } | null) => void;
  onSetShowAudioEditor?: (nodeId: string | null) => void;
  onSetConnecting?: (value: {
    nodeId: string;
    portId: string;
    type: DataType;
    direction: 'in' | 'out';
    startX: number;
    startY: number;
  } | null) => void;
  onAddConnection?: (connection: {
    id: string;
    sourceNodeId: string;
    sourcePortId: string;
    targetNodeId: string;
    targetPortId: string;
  }) => void;
  onClearSelectedRunId?: () => void;
  getReplaceableTools?: (nodeId: string) => ToolDefinition[];
  getCompatibleToolsForOutput?: (outputType: DataType) => ToolDefinition[];
  quickAddInput?: (node: WorkflowNode, port: Port) => void;
  quickAddOutput?: (node: WorkflowNode, port: Port, toolId: string) => void;
  // NodeConfigPanel props
  disconnectedInputs?: Array<{
    nodeId: string;
    port: Port;
    toolName: string;
    isSourceNode?: boolean;
    dataType: DataType;
  }>;
  loadingVoiceList?: boolean;
  voiceSearchQuery?: string;
  setVoiceSearchQuery?: (query: string) => void;
  showVoiceFilter?: boolean;
  setShowVoiceFilter?: (show: boolean) => void;
  voiceFilterGender?: string;
  setVoiceFilterGender?: (gender: string) => void;
  filteredVoices?: any[];
  isFemaleVoice?: (voiceType: string) => boolean;
  loadingCloneVoiceList?: boolean;
  onGlobalInputChange?: (nodeId: string, portId: string, value: any) => void;
  onShowCloneVoiceModal?: () => void;
  // ResultsPanel props
  resultsCollapsed?: boolean;
  activeResultsList?: WorkflowNode[];
  onToggleResultsCollapsed?: () => void;
  onSelectRun?: (runId: string | null) => void;
  onToggleShowIntermediate?: () => void;
  onExpandOutput?: (nodeId: string, fieldId?: string) => void;
  onPinOutputToCanvas?: (content: any, type: DataType) => void;
  onNodeHeightChange?: (nodeId: string, height: number) => void;
}

export const Editor: React.FC<EditorProps> = ({
  lang,
  workflow,
  view,
  selectedNodeId,
  selectedConnectionId,
  selectedRunId,
  connecting,
  mousePos,
  activeOutputs,
  nodeHeights,
  sourceNodes,
  sourceOutputs,
  isPaused,
  isRunning,
  sidebarCollapsed,
  validationErrors,
  globalError,
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
  onToggleSidebar,
  onAddNode,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  onMouseLeave,
  onWheel,
  onNodeSelect,
  onConnectionSelect,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragEnd,
  getNodeOutputs,
  isOverNode,
  isPanning,
  onCloseValidation,
  onCloseError,
  // Node component props
  showReplaceMenu,
  showOutputQuickAdd,
  showModelSelect,
  showVoiceSelect,
  lightX2VVoiceList,
  cloneVoiceList = [],
  onUpdateNodeData = () => {},
  onDeleteNode = () => {},
  onReplaceNode = () => {},
  onRunWorkflow = () => {},
  onSetReplaceMenu = () => {},
  onSetOutputQuickAdd = () => {},
  onSetModelSelect = () => {},
  onSetVoiceSelect = () => {},
  onSetExpandedOutput = () => {},
  onSetShowAudioEditor = () => {},
  onSetConnecting = () => {},
  onAddConnection = () => {},
  onClearSelectedRunId = () => {},
  getReplaceableTools = () => [],
  getCompatibleToolsForOutput = () => [],
  quickAddInput = () => {},
  quickAddOutput = () => {},
  onNodeHeightChange,
  // NodeConfigPanel props
  disconnectedInputs = [],
  loadingVoiceList = false,
  voiceSearchQuery = '',
  setVoiceSearchQuery = () => {},
  showVoiceFilter = false,
  setShowVoiceFilter = () => {},
  voiceFilterGender = 'all',
  setVoiceFilterGender = () => {},
  filteredVoices = [],
  isFemaleVoice = () => false,
  loadingCloneVoiceList = false,
  onGlobalInputChange = () => {},
  onShowCloneVoiceModal = () => {},
  // ResultsPanel props
  resultsCollapsed = true,
  activeResultsList = [],
  onToggleResultsCollapsed = () => {},
  onSelectRun = () => {},
  onToggleShowIntermediate = () => {},
  onExpandOutput = () => {},
  onPinOutputToCanvas = () => {}
}) => {
  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans overflow-hidden">
      <ErrorModal error={globalError} lang={lang} onClose={onCloseError} />
      <ValidationModal errors={validationErrors} lang={lang} onClose={onCloseValidation} />

      <EditorHeader
        lang={lang}
        workflow={workflow}
        view={view}
        selectedRunId={selectedRunId}
        isPaused={isPaused}
        isRunning={isRunning}
        canvasRef={canvasRef}
        onBack={onBack}
        onWorkflowNameChange={onWorkflowNameChange}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetView={onResetView}
        onToggleLang={onToggleLang}
        onClearSnapshot={onClearSnapshot}
        onSave={onSave}
        onPause={onPause}
        onRun={onRun}
      />

      <div className="flex-1 flex overflow-hidden relative">
        <ToolPalette
          lang={lang}
          collapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar}
          onAddNode={onAddNode}
        />

        <Canvas
          workflow={workflow}
          view={view}
          selectedNodeId={selectedNodeId}
          selectedConnectionId={selectedConnectionId}
          connecting={connecting}
          mousePos={mousePos}
          activeOutputs={activeOutputs}
          nodeHeights={nodeHeights}
          sourceNodes={sourceNodes}
          sourceOutputs={sourceOutputs}
          isOverNode={isOverNode}
          isPanning={isPanning}
          canvasRef={canvasRef}
          onMouseMove={onMouseMove}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
          onWheel={onWheel}
          onNodeSelect={onNodeSelect}
          onConnectionSelect={onConnectionSelect}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragEnd={onNodeDragEnd}
          getNodeOutputs={getNodeOutputs}
          lang={lang}
          showReplaceMenu={showReplaceMenu}
          showOutputQuickAdd={showOutputQuickAdd}
          showModelSelect={showModelSelect}
          showVoiceSelect={showVoiceSelect}
          lightX2VVoiceList={lightX2VVoiceList}
          cloneVoiceList={cloneVoiceList}
          onUpdateNodeData={onUpdateNodeData}
          onDeleteNode={onDeleteNode}
          onReplaceNode={onReplaceNode}
          onRunWorkflow={onRunWorkflow}
          onSetReplaceMenu={onSetReplaceMenu}
          onSetOutputQuickAdd={onSetOutputQuickAdd}
          onSetModelSelect={onSetModelSelect}
          onSetVoiceSelect={onSetVoiceSelect}
          onSetExpandedOutput={onSetExpandedOutput}
          onSetShowAudioEditor={onSetShowAudioEditor}
          onSetConnecting={onSetConnecting}
          onAddConnection={onAddConnection}
          onClearSelectedRunId={onClearSelectedRunId}
          getReplaceableTools={getReplaceableTools}
          getCompatibleToolsForOutput={getCompatibleToolsForOutput}
          quickAddInput={quickAddInput}
          quickAddOutput={quickAddOutput}
          onNodeHeightChange={onNodeHeightChange}
        />

        <NodeConfigPanel
          lang={lang}
          workflow={workflow}
          selectedNodeId={selectedNodeId}
          activeOutputs={activeOutputs}
          sourceOutputs={sourceOutputs}
          disconnectedInputs={disconnectedInputs}
          lightX2VVoiceList={lightX2VVoiceList}
          loadingVoiceList={loadingVoiceList}
          voiceSearchQuery={voiceSearchQuery}
          setVoiceSearchQuery={setVoiceSearchQuery}
          showVoiceFilter={showVoiceFilter}
          setShowVoiceFilter={setShowVoiceFilter}
          voiceFilterGender={voiceFilterGender}
          setVoiceFilterGender={setVoiceFilterGender}
          filteredVoices={filteredVoices}
          isFemaleVoice={isFemaleVoice}
          cloneVoiceList={cloneVoiceList}
          loadingCloneVoiceList={loadingCloneVoiceList}
          onUpdateNodeData={onUpdateNodeData}
          onDeleteNode={onDeleteNode}
          onGlobalInputChange={onGlobalInputChange}
          onShowCloneVoiceModal={onShowCloneVoiceModal}
        />
      </div>

      <ResultsPanel
        lang={lang}
        workflow={workflow}
        resultsCollapsed={resultsCollapsed}
        onToggleCollapsed={onToggleResultsCollapsed}
        activeResultsList={activeResultsList}
        sourceOutputs={sourceOutputs}
        selectedRunId={selectedRunId}
        onSelectRun={onSelectRun}
        onToggleShowIntermediate={onToggleShowIntermediate}
        onExpandOutput={onExpandOutput}
        onPinOutputToCanvas={onPinOutputToCanvas}
      />
    </div>
  );
};

