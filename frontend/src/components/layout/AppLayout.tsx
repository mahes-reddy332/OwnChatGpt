import React, { useState } from 'react';
import { ThreadSidebar } from '../threads/ThreadSidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { useThreads } from '../../hooks/useThreads';
import { useChat } from '../../hooks/useChat';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const {
    threads,
    activeThreadId,
    setActiveThreadId,
    isLoading: isLoadingThreads,
    refreshThreads,
    createThread,
    renameThread,
    deleteThread,
  } = useThreads();

  const {
    messages,
    status,
    error,
    disabledTools,
    toggleTool,
    send,
    resumeDecision,
    stopStreaming,
    dismissError,
  } = useChat(activeThreadId, refreshThreads);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleNewChat = async () => {
    await createThread();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar */}
      <ThreadSidebar
        threads={threads}
        activeThreadId={activeThreadId}
        isLoading={isLoadingThreads}
        onSelectThread={id => {
          setActiveThreadId(id);
          // Auto close on mobile
          if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
          }
        }}
        onCreateThread={handleNewChat}
        onRenameThread={renameThread}
        onDeleteThread={deleteThread}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <ChatWindow
          messages={messages}
          status={status}
          error={error}
          onSend={send}
          onResumeDecision={resumeDecision}
          onStop={stopStreaming}
          onNewChat={handleNewChat}
          onDismissError={dismissError}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTitle={activeThread?.title}
          disabledTools={disabledTools}
          onToggleTool={toggleTool}
        />
      </main>
    </div>
  );
};
