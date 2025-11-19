import { Request, Response } from 'express'
import Item from '../models/Item'
import { searchCafes } from '../services/external.service'

export async function search(req: Request, res: Response) {
  try {
    const q = String(req.query.q ?? "")
    const km = Number(req.query.km ?? 2)
    const items = await searchCafes(q, { km })
    res.json({ items })
  } catch (err: any) {
    console.error("Search failed:", err)
    res.status(504).json({ message: err?.message ?? "Search failed" })
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
