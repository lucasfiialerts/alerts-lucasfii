-- Migration: Add AI Provider Preferences
-- Add columns for user to select AI provider

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "selected_ai_provider" TEXT DEFAULT 'gemini-flash';

ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS "ai_provider_custom_name" TEXT;
