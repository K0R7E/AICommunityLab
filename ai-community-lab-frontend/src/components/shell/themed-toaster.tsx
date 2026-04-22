"use client";

import { Toaster } from "sonner";
import { useTheme } from "./theme-provider";

export function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster richColors theme={theme} position="top-center" />;
}
