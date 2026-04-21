import { pgTable, text, integer, timestamp, boolean, primaryKey } from 'drizzle-orm/pg-core'
import type { AdapterAccountType } from 'next-auth/adapters'

// --- Auth.js adapter tables ---

export const users = pgTable('user', {
  id:            text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:          text('name'),
  email:         text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image:         text('image'),
})

export const accounts = pgTable('account', {
  userId:            text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:              text('type').$type<AdapterAccountType>().notNull(),
  provider:          text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token:     text('refresh_token'),
  access_token:      text('access_token'),
  expires_at:        integer('expires_at'),
  token_type:        text('token_type'),
  scope:             text('scope'),
  id_token:          text('id_token'),
  session_state:     text('session_state'),
}, (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })])

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId:       text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires:      timestamp('expires', { mode: 'date' }).notNull(),
})

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token:      text('token').notNull(),
  expires:    timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })])

// --- Attachments ---

export const attachments = pgTable('attachment', {
  id:         text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  fileName:   text('file_name').notNull(),
  mimeType:   text('mime_type').notNull(),
  fileSize:   integer('file_size').notNull(),
  url:        text('url').notNull(),
  storageKey: text('storage_key').notNull(),
  uploadedBy: text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
})

// --- Notification preferences ---

export const notificationPreferences = pgTable('notification_preference', {
  id:                text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:            text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  onEventCreated:    boolean('on_event_created').notNull().default(true),
  onEventDeleted:    boolean('on_event_deleted').notNull().default(true),
  onEventEdited:     boolean('on_event_edited').notNull().default(false),
  onCommentAdded:    boolean('on_comment_added').notNull().default(true),
  onStatusChanged:   boolean('on_status_changed').notNull().default(false),
})
