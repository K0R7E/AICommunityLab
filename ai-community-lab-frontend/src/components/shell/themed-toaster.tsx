"use client";

import { Toaster } from "sonner";
import { useTheme } from "./theme-provider";

// In Sonner's dark mode the richColors backgrounds are too dark to be visually
// distinct from the default black toast. We force clearly visible tinted
// backgrounds via Tailwind classNames with !important so they win over
// Sonner's CSS-variable-based defaults.
const darkClassNames = {
  success: "!bg-emerald-950 !border-emerald-700/60 !text-emerald-50",
  error: "!bg-red-950 !border-red-700/60 !text-red-50",
  info: "!bg-blue-950 !border-blue-700/60 !text-blue-50",
  warning: "!bg-amber-950 !border-amber-700/60 !text-amber-50",
};

export function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      richColors
      theme={theme}
      position="top-center"
      closeButton
      duration={4000}
      expand={false}
      toastOptions={theme === "dark" ? { classNames: darkClassNames } : undefined}
    />
  );
}
