-- Add parts column to chat_message table to support images
ALTER TABLE "chat_message" ADD COLUMN "parts" jsonb;
