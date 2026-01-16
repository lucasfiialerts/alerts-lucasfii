"use client";

import { useWhatsAppContext } from "@/contexts/whatsapp-context";

export function useWhatsAppStatus() {
  return useWhatsAppContext();
}