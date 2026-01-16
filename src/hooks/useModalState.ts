import { useState } from 'react';

export const useModalState = () => {
  const [showCloneVoiceModal, setShowCloneVoiceModal] = useState(false);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [showAudioEditor, setShowAudioEditor] = useState<string | null>(null); // nodeId of audio input being edited
  const [expandedOutput, setExpandedOutput] = useState<{ nodeId: string; fieldId?: string } | null>(null);
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [tempEditValue, setTempEditValue] = useState("");
  const [showReplaceMenu, setShowReplaceMenu] = useState<string | null>(null);
  const [showOutputQuickAdd, setShowOutputQuickAdd] = useState<{ nodeId: string; portId: string } | null>(null);
  const [showModelSelect, setShowModelSelect] = useState<string | null>(null);
  const [showVoiceSelect, setShowVoiceSelect] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(true);

  return {
    // Modal states
    showCloneVoiceModal,
    setShowCloneVoiceModal,
    showAIGenerateModal,
    setShowAIGenerateModal,
    showAudioEditor,
    setShowAudioEditor,
    expandedOutput,
    setExpandedOutput,
    isEditingResult,
    setIsEditingResult,
    tempEditValue,
    setTempEditValue,
    
    // Menu states
    showReplaceMenu,
    setShowReplaceMenu,
    showOutputQuickAdd,
    setShowOutputQuickAdd,
    showModelSelect,
    setShowModelSelect,
    showVoiceSelect,
    setShowVoiceSelect,
    
    // Panel states
    sidebarCollapsed,
    setSidebarCollapsed,
    resultsCollapsed,
    setResultsCollapsed
  };
};

