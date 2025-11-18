import axios from 'axios'
const api = axios.create({ baseURL: '' })  // IMPORTANT: keep empty for proxy

export const searchExternal = async (q: string) =>
  (await api.get('/api/search', { params: { q } })).data
export const listSaved = async () => (await api.get('/api/items')).data
export const saveItem = async (p: any) => (await api.post('/api/items', p)).data
export const deleteItem = async (id: string) => (await api.delete(`/api/items/${id}`)).data
