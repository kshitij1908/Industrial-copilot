import { api } from './api'
import type { Equipment, EquipmentSummary, EquipmentDetail, GraphData } from '../types'

export const equipmentService = {
  /**
   * List all equipment with pagination.
   */
  async list(skip = 0, limit = 50): Promise<Equipment[]> {
    const res = await api.get<Equipment[]>(`/equipment/?skip=${skip}&limit=${limit}`)
    return res.data
  },

  /**
   * Search equipment by tag or type keyword.
   */
  async search(q: string): Promise<EquipmentSummary[]> {
    const res = await api.get<EquipmentSummary[]>(
      `/equipment/search?q=${encodeURIComponent(q)}`
    )
    return res.data
  },

  /**
   * Get full equipment detail including related documents.
   */
  async getDetail(tag: string): Promise<EquipmentDetail> {
    const res = await api.get<EquipmentDetail>(`/equipment/${encodeURIComponent(tag)}`)
    return res.data
  },

  /**
   * Get knowledge graph data for a given equipment tag.
   */
  async getGraph(tag: string): Promise<GraphData> {
    const res = await api.get<GraphData>(
      `/equipment/${encodeURIComponent(tag)}/graph`
    )
    return res.data
  },

  /**
   * Get graph data for all equipment (overview graph).
   */
  async getOverviewGraph(): Promise<GraphData> {
    const res = await api.get<GraphData>('/equipment/graph/overview')
    return res.data
  },
}
