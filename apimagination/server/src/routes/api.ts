import { Router } from 'express'
import * as ctrl from '../controllers/items.controller'

const r = Router()

// (optional) also expose /api/health via router
r.get('/health', (_req, res) => res.json({ ok: true }))

r.get('/search', ctrl.search)
r.get('/items', ctrl.list)
r.post('/items', ctrl.create)
r.delete('/items/:id', ctrl.remove)

export default r
