import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

// Fall back to a placeholder so Next.js can build without DATABASE_URL.
// The Neon client is lazy — it only connects when a query is actually executed.
const sql = neon(process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@placeholder.neon.tech/placeholder')

export const db = drizzle(sql, { schema })

export function getDb() { return db }
