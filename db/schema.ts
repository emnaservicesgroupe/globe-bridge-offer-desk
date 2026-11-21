import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
export const offers = sqliteTable("offers", {
 id:text("id").primaryKey(),company:text("company").notNull(),role:text("role").notNull(),
 needed:integer("needed").notNull(),body:text("body").notNull(),url:text("url").notNull(),
 calendlyUrl:text("calendly_url"),
 status:text("status").notNull().default("available"),
 jobCountry:text("job_country"),
 candidateLocation:text("candidate_location"), videoKey:text("video_key"),
 offerDate:text("offer_date"),
 salary:text("salary").notNull().default(""), revision:integer("revision").notNull().default(1), fileKey:text("file_key"),
 letter:text("letter").notNull(), day:text("day").notNull(),created:text("created").notNull(),
});
