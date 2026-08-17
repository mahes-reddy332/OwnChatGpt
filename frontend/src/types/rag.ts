export interface DocumentSource {
  filename: string;
  page?: number;
  snippet: string;
}

export interface IngestedDocument {
  filename: string;
  total_chunks: number;
  total_pages: number;
  uploaded_at: string;
  size_bytes: number;
}
