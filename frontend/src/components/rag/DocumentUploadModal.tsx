import React, { useState, useEffect, useRef } from 'react';
import type { IngestedDocument } from '../../types/rag';
import { uploadDocument, listDocuments } from '../../services/api';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    try {
      setIsLoadingList(true);
      const list = await listDocuments();
      setDocuments(list);
    } catch {
      // Ignore initial load error if empty
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
      setUploadStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadStatus(null);

    try {
      const result = await uploadDocument(file);
      setUploadStatus({
        type: 'success',
        message: `Successfully ingested "${result.filename}" (${result.total_chunks} chunks indexed).`,
      });
      fetchDocs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadStatus({
        type: 'error',
        message: msg,
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center space-x-2">
            <FileText size={20} className="text-[var(--color-text-primary)]" />
            <h2 className="font-semibold text-base text-[var(--color-text-primary)]">
              Knowledge Base (RAG)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[var(--radius-md)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Upload Dropzone */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-text-tertiary)] rounded-[var(--radius-lg)] p-6 text-center cursor-pointer transition-all duration-150 bg-[var(--color-bg-primary)] ${
              isUploading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.markdown,.csv,.json"
              onChange={handleFileSelected}
              className="hidden"
              disabled={isUploading}
            />

            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center text-[var(--color-text-primary)] shadow-sm">
                {isUploading ? (
                  <Loader2 size={20} className="animate-spin text-[var(--color-info)]" />
                ) : (
                  <UploadCloud size={20} />
                )}
              </div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {isUploading ? 'Indexing document into vector store...' : 'Click to upload document'}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Supported formats: PDF, Markdown, Text, CSV
              </p>
            </div>
          </div>

          {/* Status Alert */}
          {uploadStatus && (
            <div
              className={`p-3 rounded-[var(--radius-md)] text-xs flex items-center space-x-2 ${
                uploadStatus.type === 'success'
                  ? 'bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30'
                  : 'bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/30'
              }`}
            >
              {uploadStatus.type === 'success' ? (
                <CheckCircle2 size={16} className="flex-shrink-0" />
              ) : (
                <AlertCircle size={16} className="flex-shrink-0" />
              )}
              <span>{uploadStatus.message}</span>
            </div>
          )}

          {/* Indexed Documents List */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2.5">
              Indexed Documents ({documents.length})
            </h3>

            {isLoadingList ? (
              <p className="text-xs text-[var(--color-text-tertiary)] text-center py-4">
                Loading indexed files...
              </p>
            ) : documents.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)] text-center py-4 bg-[var(--color-bg-primary)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
                No documents uploaded yet. Upload a document to enable RAG.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileText size={15} className="text-[var(--color-text-tertiary)] flex-shrink-0" />
                      <span className="font-medium text-[var(--color-text-primary)] truncate">
                        {doc.filename}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 text-[var(--color-text-tertiary)] flex-shrink-0 text-[11px]">
                      <span>{doc.total_chunks} chunks</span>
                      <span>{(doc.size_bytes / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
