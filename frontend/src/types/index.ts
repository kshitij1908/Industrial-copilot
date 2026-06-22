// ─── Document Types ────────────────────────────────────────────────────────────

export type DocumentStatus = 'pending' | 'processing' | 'ready' | 'failed'

export type DocumentType =
  | 'manual'
  | 'datasheet'
  | 'procedure'
  | 'report'
  | 'specification'
  | 'drawing'
  | 'other'

export interface Document {
  id: string
  filename: string
  original_name: string
  file_type: string
  file_size: number
  document_type: DocumentType | string
  status: DocumentStatus
  page_count: number
  equipment_tags: string[]
  upload_date: string
  chunk_count: number
  error_message?: string
}

export interface DocumentUploadResult {
  uploaded: number
  documents: Array<{
    id: string
    filename: string
    status: DocumentStatus
    message?: string
  }>
}

// ─── Chat / Query Types ────────────────────────────────────────────────────────

export interface SourceItem {
  document_name: string
  page_number: number
  document_id: string
  similarity: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: SourceItem[]
  confidence?: number
  confidence_label?: string
  equipment_tags?: string[]
  timestamp: string
  isLoading?: boolean
  query_id?: string
}

export interface ChatQueryRequest {
  question: string
  session_id?: string
  equipment_filter?: string[]
  document_filter?: string[]
  top_k?: number
}

export interface ChatQueryResponse {
  answer: string
  sources: SourceItem[]
  confidence: number
  confidence_label: string
  equipment_tags: string[]
  query_id: string
  total_time_ms: number
}

// ─── Equipment Types ───────────────────────────────────────────────────────────

export interface EquipmentDocument {
  id: string
  original_name: string
  document_type: DocumentType | string
  upload_date: string
  page_count: number
}

export interface Equipment {
  id: string
  tag: string
  equipment_type: string
  description?: string
  access_count: number
  related_document_ids: string[]
  documents: EquipmentDocument[]
}

export interface EquipmentSummary {
  tag: string
  equipment_type: string
  access_count: number
  document_count?: number
}

export interface EquipmentDetail extends Equipment {
  recent_queries?: Array<{
    question: string
    confidence: number
    timestamp: string
  }>
}

// ─── Analytics / Dashboard Types ──────────────────────────────────────────────

export interface AccessedEquipment {
  tag: string
  equipment_type: string
  count: number
}

export interface AccessedDocument {
  name: string
  document_type: string
  chunk_count: number
}

export interface RecentQuery {
  question: string
  confidence: number
  timestamp: string
}

export interface DashboardStats {
  total_documents: number
  ready_documents: number
  total_equipment_tags: number
  total_queries: number
  total_chunks: number
  avg_confidence: number
  processing_queue: number
  most_accessed_equipment: AccessedEquipment[]
  most_accessed_documents: AccessedDocument[]
  recent_queries: RecentQuery[]
}

// ─── History Types ─────────────────────────────────────────────────────────────

export interface HistoryItem {
  id: string
  question: string
  answer: string
  confidence: number
  sources: SourceItem[]
  equipment_tags: string[]
  timestamp: string
}

export interface HistoryResponse {
  items: HistoryItem[]
  total: number
  page: number
  page_size: number
}

// ─── Knowledge Graph Types ─────────────────────────────────────────────────────

export interface GraphNodeData {
  label: string
  type: string
  [key: string]: unknown
}

export interface GraphNode {
  id: string
  type: string
  data: GraphNodeData
  position: { x: number; y: number }
  style?: Record<string, string>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  animated?: boolean
  style?: Record<string, string>
}

export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  equipment_tag: string
  document_count: number
}

// ─── API Response Wrappers ─────────────────────────────────────────────────────

export interface ApiError {
  detail: string
  status_code?: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  skip: number
  limit: number
}

// ─── Upload / Progress Types ───────────────────────────────────────────────────

export interface UploadProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

// ─── Settings Types ────────────────────────────────────────────────────────────

export interface AppSettings {
  llm_model: string
  embedding_model: string
  top_k: number
  similarity_threshold: number
  chunk_size: number
  chunk_overlap: number
}
