CREATE TYPE "public"."faculty_dept" AS ENUM('ot', 'nt', 'st', 'pt', 'ch', 'mn');--> statement-breakpoint
CREATE TYPE "public"."faculty_tone" AS ENUM('forest', 'olive', 'pine', 'sage');--> statement-breakpoint
CREATE TABLE "faculty" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dept" "faculty_dept" NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"en" text NOT NULL,
	"degree" text NOT NULL,
	"tone" "faculty_tone" NOT NULL,
	"field" text NOT NULL,
	"teaches" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"quote" text NOT NULL,
	"years" integer DEFAULT 0 NOT NULL,
	"papers" integer DEFAULT 0 NOT NULL,
	"office" text NOT NULL,
	"hours" text NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"about" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
