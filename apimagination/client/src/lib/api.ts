import axios from 'axios'
import type { Item } from './Item'
const api = axios.create({ baseURL: '' })  // IMPORTANT: keep empty for proxy

export const searchExternal = async (q: string) =>
  (await api.get('/api/search', { params: { q } })).data

export async function searchItems(q: string): Promise<Item[]> {
  const res = await axios.get("/api/search", { params: { q } })

  // simplest: just trust the backend
  return res.data.items as Item[]
}

export const listSaved = async () => (await api.get('/api/items')).data
export const saveItem = async (p: any) => (await api.post('/api/items', p)).data
export const deleteItem = async (id: string) => (await api.delete(`/api/items/${id}`)).data
