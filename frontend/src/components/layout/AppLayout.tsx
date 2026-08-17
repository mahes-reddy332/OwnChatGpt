import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ThreadSidebar } from '../threads/ThreadSidebar';
import { ChatWindow } from '../chat/ChatWindow';
import { useThreads } from '../../hooks/useThreads';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../auth/AuthContext';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { threadId: urlThreadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const { setIsStreaming, triggerMeaningfulActivity } = useAuth();

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

  // Sync active thread with URL param if present
  useEffect(() => {
    if (urlThreadId && urlThreadId !== activeThreadId) {
      setActiveThreadId(urlThreadId);
    }
  }, [urlThreadId, activeThreadId, setActiveThreadId]);

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

  // Sync streaming state to AuthContext to pause idle timer during execution
  useEffect(() => {
    setIsStreaming(status === 'streaming');
  }, [status, setIsStreaming]);

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleNewChat = async () => {
    triggerMeaningfulActivity();
    const newThread = await createThread();
    if (newThread && 'id' in (newThread as { id: string })) {
      navigate(`/chat/${(newThread as { id: string }).id}`);
    }
  };

  const handleSelectThread = (id: string) => {
    setActiveThreadId(id);
    navigate(`/chat/${id}`);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSend = async (text: string) => {
    triggerMeaningfulActivity();
    await send(text);
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
        onSelectThread={handleSelectThread}
        onCreateThread={handleNewChat}
        onRenameThread={async (id, title) => {
          triggerMeaningfulActivity();
          await renameThread(id, title);
        }}
        onDeleteThread={async (id) => {
          triggerMeaningfulActivity();
          await deleteThread(id);
          if (activeThreadId === id) {
            navigate('/chat');
          }
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <ChatWindow
          messages={messages}
          status={status}
          error={error}
          onSend={handleSend}
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
