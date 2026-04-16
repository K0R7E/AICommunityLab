"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { adminDeleteComment, adminDeletePost } from "./actions";

type Props =
  | { kind: "post"; id: string; postId: string }
  | { kind: "comment"; id: string; postId: string };

export function AdminDeleteButtons(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    if (!confirm("Delete this permanently?")) return;
    startTransition(async () => {
      const res =
        props.kind === "post"
          ? await adminDeletePost(props.id)
          : await adminDeleteComment(props.id, props.postId);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deleted");
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => onDelete()}
      className="shrink-0 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-950/70 disabled:opacity-50"
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
