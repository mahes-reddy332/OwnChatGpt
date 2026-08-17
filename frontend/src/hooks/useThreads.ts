import { useState, useEffect, useCallback } from 'react';
import type { Thread } from '../types/thread';
import {
  listThreads,
  createThread,
  updateThreadTitle,
  deleteThread,
} from '../services/api';

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listThreads();
      setThreads(data);
      if (data.length > 0 && !activeThreadId) {
        setActiveThreadId(data[0].id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load threads';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [activeThreadId]);

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleCreateThread = useCallback(async (title?: string) => {
    try {
      setError(null);
      const newThread = await createThread(title);
      setThreads(prev => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
      return newThread;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create thread';
      setError(msg);
      throw err;
    }
  }, []);

  const handleRenameThread = useCallback(async (threadId: string, newTitle: string) => {
    try {
      setError(null);
      const updated = await updateThreadTitle(threadId, newTitle);
      setThreads(prev =>
        prev.map(t => (t.id === threadId ? { ...t, title: updated.title, updated_at: updated.updated_at } : t))
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to rename thread';
      setError(msg);
      throw err;
    }
  }, []);

  const handleDeleteThread = useCallback(
    async (threadId: string) => {
      try {
        setError(null);
        await deleteThread(threadId);
        setThreads(prev => prev.filter(t => t.id !== threadId));
        if (activeThreadId === threadId) {
          const remaining = threads.filter(t => t.id !== threadId);
          setActiveThreadId(remaining.length > 0 ? remaining[0].id : null);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to delete thread';
        setError(msg);
        throw err;
      }
    },
    [activeThreadId, threads]
  );

  return {
    threads,
    activeThreadId,
    setActiveThreadId,
    isLoading,
    error,
    refreshThreads: fetchThreads,
    createThread: handleCreateThread,
    renameThread: handleRenameThread,
    deleteThread: handleDeleteThread,
  };
}
