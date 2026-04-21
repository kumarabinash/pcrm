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
  contactId:  text('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
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
  digestEnabled:     boolean('digest_enabled').notNull().default(true),
  digestHour:        integer('digest_hour').notNull().default(8),
  remindersEnabled:  boolean('reminders_enabled').notNull().default(true),
})

// --- CRM: Contacts ---

export const contacts = pgTable('contact', {
  id:               text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:           text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:             text('name').notNull(),
  phone:            text('phone'),
  email:            text('email'),
  birthday:         text('birthday'),
  location:         text('location'),
  howWeMet:         text('how_we_met'),
  relationshipType: text('relationship_type'),
  notes:            text('notes'),
  photoUrl:         text('photo_url'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
  updatedAt:        timestamp('updated_at').notNull().defaultNow().$onUpdateFn(() => new Date()),
})

// --- CRM: Tags ---

export const tags = pgTable('tag', {
  id:     text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:   text('name').notNull(),
  color:  text('color'),
})

// --- CRM: Contact ↔ Tag join ---

export const contactTags = pgTable('contact_tag', {
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  tagId:     text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.contactId, t.tagId] })])

// --- CRM: Interactions ---

export const interactions = pgTable('interaction', {
  id:        text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:      text('type').notNull(),
  note:      text('note'),
  details:   text('details'),
  topics:    text('topics').array(),
  mood:      text('mood'),
  date:      timestamp('date', { mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// --- CRM: Reminders ---

export const reminders = pgTable('reminder', {
  id:            text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  contactId:     text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  userId:        text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:          text('type').notNull(),
  frequencyDays: integer('frequency_days'),
  dueDate:       timestamp('due_date', { mode: 'date' }).notNull(),
  time:          text('time'),
  title:         text('title'),
  completed:     boolean('completed').notNull().default(false),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
})
