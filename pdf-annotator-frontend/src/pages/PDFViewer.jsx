import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Cloud, Box, ChevronDown } from 'lucide-react';
import PDFViewer from '../components/pdf/PDFViewer';
import HighlightTool from '../components/highlights/HighlightTool';
import HighlightsList from '../components/highlights/HighlightsList';
import ToolBar from '../components/highlights/ToolBar';
import ActivityFeed from '../components/collaboration/ActivityFeed';

// AI Components
import SummaryPanel from '../components/ai/summaryPanel';
import KeyPhrasesPanel from '../components/ai/KeyPhrasesPanel';
import TextAnalysis from '../components/ai/TextAnalysis';
import SmartSearch from '../components/ai/SmartSearch';

// Cloud Components
import GoogleDriveIntegration from '../components/cloud/GoogleDriveIntegration';
import DropboxIntegration from '../components/cloud/DropboxIntegration';

import { usePDF } from '../hooks/usePDF';
import { useHighlights } from '../hooks/useHighlights';
import { useCollaboration } from '../hooks/useCollaboration';
import { Loading, Button, Dropdown, DropdownItem } from '../components/ui';

const PDFViewerPage = () => {
  const { uuid } = useParams();
  const { loading: pdfLoading } = usePDF();
  const { highlights, loading: highlightsLoading, getHighlightsByPdf, deleteHighlight } = useHighlights();
  const { activeUsers, lastChange, notifyHighlightChange } = useCollaboration(uuid);
  
  const [selectedText, setSelectedText] = useState(null);
  const [activeTool, setActiveTool] = useState('highlight');
  const [showSidebar, setShowSidebar] = useState(true);
  const [activePanel, setActivePanel] = useState('highlights'); // highlights, ai, activity

  // AI & Cloud modals
  const [showGoogleDrive, setShowGoogleDrive] = useState(false);
  const [showDropbox, setShowDropbox] = useState(false);

  useEffect(() => {
    if (uuid) {
      console.log(' Fetching highlights for PDF:', uuid);
      getHighlightsByPdf(uuid);
    }
  }, [uuid]);

  // A collaborator changed a highlight — refetch to stay in sync live.
  useEffect(() => {
    if (lastChange && uuid) {
      getHighlightsByPdf(uuid);
    }
  }, [lastChange]);

  const handleTextSelect = (selection) => {
    setSelectedText(selection);
  };

  const handleHighlightCreated = () => {
    setSelectedText(null);
    getHighlightsByPdf(uuid);
    notifyHighlightChange('created');
  };

  const handleDeleteHighlight = async (highlightUuid) => {
    await deleteHighlight(highlightUuid);
    notifyHighlightChange('deleted');
  };

  const handleHighlightClick = (highlight) => {
    console.log('Navigate to highlight:', highlight);
  };

  const handleSearchResultClick = (result) => {
    console.log('Navigate to search result:', result);
  };

  if (pdfLoading) {
    return <Loading fullScreen text="Loading PDF..." />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-8rem)]">
      {/* Main PDF Viewer — min-w-0 lets it shrink so the sidebar never gets pushed off-screen */}
      <div className="flex-1 min-w-0 flex flex-col bg-white rounded-lg shadow-lg overflow-hidden h-[70vh] lg:h-auto">
        {/* Top Toolbar */}
        <div className="border-b border-gray-200 p-4 flex items-center justify-between gap-2 flex-wrap">
          <ToolBar activeTool={activeTool} onToolChange={setActiveTool} />

          {/* Cloud & AI Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeUsers.length > 1 && (
              <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {activeUsers.length} viewing
              </span>
            )}
            <Button
              onClick={() => { setShowSidebar(true); setActivePanel('ai'); }}
              variant="secondary"
              size="sm"
              icon={<Sparkles size={16} />}
            >
              AI Features
            </Button>

            <Dropdown
              trigger={
                <Button variant="secondary" size="sm" icon={<Cloud size={16} />}>
                  Cloud <ChevronDown size={14} />
                </Button>
              }
            >
              <DropdownItem
                icon={<Cloud size={16} />}
                onClick={() => setShowGoogleDrive(true)}
              >
                Google Drive
              </DropdownItem>
              <DropdownItem
                icon={<Box size={16} />}
                onClick={() => setShowDropbox(true)}
              >
                Dropbox
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        
        {/* PDF Content */}
        <div className="flex-1 overflow-hidden">
          <PDFViewer
            pdfId={uuid}
            onTextSelect={handleTextSelect}
            highlights={highlights}
            onHighlightClick={handleHighlightClick}
            activeTool={activeTool}
          />
        </div>
      </div>

      {/* Right Sidebar */}
      {showSidebar && (
        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-4 lg:overflow-hidden">
          {/* Panel Tabs */}
          <div className="bg-white rounded-lg shadow-lg p-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActivePanel('highlights')}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activePanel === 'highlights'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Highlights
              </button>
              <button
                onClick={() => setActivePanel('ai')}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activePanel === 'ai'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                AI Tools
              </button>
              <button
                onClick={() => setActivePanel('activity')}
                className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activePanel === 'activity'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Activity
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Highlights Panel */}
            {activePanel === 'highlights' && (
              <>
                {/* Highlight Tool */}
                {selectedText && activeTool === 'highlight' && (
                  <HighlightTool
                    pdfId={uuid}
                    selectedText={selectedText}
                    onHighlightCreated={handleHighlightCreated}
                  />
                )}

                {/* Highlights List */}
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <HighlightsList
                    highlights={highlights}
                    loading={highlightsLoading}
                    onHighlightClick={handleHighlightClick}
                    onDelete={handleDeleteHighlight}
                  />
                </div>
              </>
            )}

            {/* AI Panel */}
            {activePanel === 'ai' && (
              <div className="space-y-4">
                <SmartSearch 
                  pdfId={uuid} 
                  onResultClick={handleSearchResultClick}
                />
                <SummaryPanel pdfId={uuid} />
                <KeyPhrasesPanel pdfId={uuid} />
                <TextAnalysis pdfId={uuid} />
              </div>
            )}

            {/* Activity Panel */}
            {activePanel === 'activity' && (
              <div className="bg-white rounded-lg shadow-lg">
                <ActivityFeed pdfId={uuid} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="fixed right-4 top-24 bg-white p-2 rounded-lg shadow-lg hover:shadow-xl transition-shadow z-10"
      >
        {showSidebar ? '→' : '←'}
      </button>

      {/* Cloud Modals */}
      <GoogleDriveIntegration
        isOpen={showGoogleDrive}
        onClose={() => setShowGoogleDrive(false)}
        pdfId={uuid}
      />

      <DropboxIntegration
        isOpen={showDropbox}
        onClose={() => setShowDropbox(false)}
        pdfId={uuid}
      />
    </div>
  );
};

export default PDFViewerPage;