"use client";

import {
  CATEGORIES_BY_KIND,
  LISTING_KINDS,
  inferListingKindFromCategory,
  type ListingKind,
} from "@/lib/constants";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { adminUpdatePost } from "./actions";
import { AdminDeleteButtons } from "./admin-delete-buttons";
import { AdminPostModerationButtons } from "./admin-post-moderation-buttons";

export type AdminPostRow = {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  categories: string[];
  post_kind?: ListingKind | string;
  moderation_status?: string;
};

export function AdminPostEditor({
  post,
  children,
}: {
  post: AdminPostRow;
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const initialKind: ListingKind =
    post.post_kind && LISTING_KINDS.includes(post.post_kind as ListingKind)
      ? (post.post_kind as ListingKind)
      : inferListingKindFromCategory(post.categories[0] ?? CATEGORIES_BY_KIND["AI Engine"][0]);
  const [listingKind, setListingKind] = useState<ListingKind>(initialKind);
  const initialCategory =
    post.categories[0] && CATEGORIES_BY_KIND[initialKind].includes(post.categories[0])
      ? post.categories[0]
      : CATEGORIES_BY_KIND[initialKind][0];
  const [category, setCategory] = useState(initialCategory);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await adminUpdatePost(post.id, fd);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Post updated");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex max-w-full shrink-0 flex-nowrap items-center justify-end gap-2 overflow-x-auto sm:justify-start">
          <AdminPostModerationButtons
            postId={post.id}
            status={post.moderation_status}
          />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="shrink-0 rounded-md border border-zinc-600 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-[#00ff9f]/45 hover:bg-zinc-800"
          >
            {open ? "Cancel" : "Edit"}
          </button>
          <AdminDeleteButtons kind="post" id={post.id} postId={post.id} />
        </div>
      </div>
      {open ? (
        <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-zinc-700 bg-[#0f0f0f] p-3">
          <div>
            <label htmlFor={`title-${post.id}`} className="text-xs text-zinc-500">
              Title
            </label>
            <input
              id={`title-${post.id}`}
              name="title"
              required
              minLength={3}
              defaultValue={post.title}
              className="mt-1 w-full rounded border border-zinc-700 bg-[#141414] px-2 py-1.5 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor={`url-${post.id}`} className="text-xs text-zinc-500">
              URL
            </label>
            <input
              id={`url-${post.id}`}
              name="url"
              type="url"
              defaultValue={post.url ?? ""}
              placeholder="https://… (optional)"
              className="mt-1 w-full rounded border border-zinc-700 bg-[#141414] px-2 py-1.5 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor={`desc-${post.id}`} className="text-xs text-zinc-500">
              Description
            </label>
            <textarea
              id={`desc-${post.id}`}
              name="description"
              rows={3}
              defaultValue={post.description ?? ""}
              className="mt-1 w-full rounded border border-zinc-700 bg-[#141414] px-2 py-1.5 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor={`kind-${post.id}`} className="text-xs text-zinc-500">
              Listing type
            </label>
            <select
              id={`kind-${post.id}`}
              name="listing_kind"
              required
              value={listingKind}
              onChange={(e) => {
                const nextKind = e.target.value as ListingKind;
                setListingKind(nextKind);
                setCategory(CATEGORIES_BY_KIND[nextKind][0]);
              }}
              className="mt-1 w-full rounded border border-zinc-700 bg-[#141414] px-2 py-1.5 text-sm text-zinc-100"
            >
              {LISTING_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`cat-${post.id}`} className="text-xs text-zinc-500">
              Category
            </label>
            <select
              id={`cat-${post.id}`}
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-700 bg-[#141414] px-2 py-1.5 text-sm text-zinc-100"
            >
              {CATEGORIES_BY_KIND[listingKind].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-[#00ff9f] px-3 py-1.5 text-xs font-semibold text-[#0f0f0f] disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
