import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  reason: text("reason").notNull(),
  insurance: varchar("insurance", { length: 255 }),
  clinicUrl: varchar("clinic_url", { length: 500 }),
  transcript: text("transcript"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;