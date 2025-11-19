import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import mongoose from 'mongoose'
import routes from './routes/api'

console.log('BOOT FILE:', __filename)
console.log('CWD:', process.cwd())

const app = express()

app.use(cors())                  // allow 5173 -> 3000
app.use(morgan('dev'))
app.use(express.json())

// health route (directly on the app)
app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/', (_req, res) => res.send('OK: root of Express app'))
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// all other API routes
app.use('/api', routes)
// DEBUG: list all registered routes at /api/__debug_routes
app.get('/api/__debug_routes', (_req, res) => {
  const dump = (layer: any, base: string = ''): string[] => {
    if (layer.route && layer.route.path) {
      return Object.keys(layer.route.methods).map(
        m => `${m.toUpperCase()} ${base}${layer.route.path}`
      )
    }
    if (layer.name === 'router' && layer.handle?.stack) {
      const newBase = base + (layer.regexp?.fast_star ? '*' : '')
      return layer.handle.stack.flatMap((l: any) => dump(l, base))
    }
    if (layer.handle?.stack) return dump(layer.handle, base)
    return []
  }
  // @ts-ignore private API but fine for debug
  const routes = app._router?.stack ? app._router.stack.flatMap((l: any) => dump(l)) : []
  res.json(routes)
})


const PORT = Number(process.env.PORT || 3000)
async function start() {
  await mongoose.connect(process.env.MONGO_URL!)
  console.log('✅ Mongo connected')
  app.listen(PORT, () => console.log(`✅ API on :${PORT}`))
}
start().catch(err => { console.error(err); process.exit(1) })
