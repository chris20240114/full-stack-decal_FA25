import { Request, Response } from 'express'
import Item from '../models/Item'
import { searchCafes } from '../services/external.service'

export async function search(req: Request, res: Response) {
  try {
    const q = String(req.query.q ?? '')
    const lat = req.query.lat ? Number(req.query.lat) : undefined
    const lon = req.query.lon ? Number(req.query.lon) : undefined
    const km  = req.query.km  ? Number(req.query.km)  : undefined
    const items = await searchCafes(q, { lat, lon, km })
    res.json({ items })
  } catch (err) {
    // Soft-fail: return empty set so frontend stays smooth
    res.json({ items: [], note: 'search temporarily unavailable' })
  }
}

export async function list(_req: Request, res: Response) {
  const items = await Item.find().sort({ createdAt: -1 })
  res.json(items)
}
export async function create(req: Request, res: Response) {
  const created = await Item.create(req.body)
  res.status(201).json(created)
}
export async function remove(req: Request, res: Response) {
  await Item.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
}
