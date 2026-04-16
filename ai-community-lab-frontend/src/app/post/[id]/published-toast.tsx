"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

/** One-shot toast after successful submit redirect (?submitted=1). */
export function PublishedToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const submitted = searchParams.get("submitted") === "1";
    const legacyPublished = searchParams.get("published") === "1";
    if (!submitted && !legacyPublished) return;
    fired.current = true;
    if (submitted) {
      toast.success(
        "Submitted for review — it will appear on the feed after a moderator approves it.",
      );
    } else {
      toast.success("Tool published");
    }
    router.replace(pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  return null;
}
