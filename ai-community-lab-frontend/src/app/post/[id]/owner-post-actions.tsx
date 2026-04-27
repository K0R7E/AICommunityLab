"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CATEGORIES_BY_KIND,
  LISTING_KINDS,
  inferListingKindFromCategory,
  type ListingKind,
} from "@/lib/constants";
import { deleteOwnPost, updateOwnPost } from "@/app/actions";

type OwnerPostEditorRow = {
  id: string;
  title: string;
  url: string | null;
  description: string | null;
  categories: string[];
  post_kind?: ListingKind | string;
};

export function OwnerPostActions({ post }: { post: OwnerPostEditorRow }) {
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
      const res = await updateOwnPost(post.id, fd);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Tool updated");
      setOpen(false);
      router.refresh();
    });
  }

  function onDelete() {
    if (!confirm("Delete this tool permanently?")) return;
    startTransition(async () => {
      const res = await deleteOwnPost(post.id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Tool deleted");
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-md border border-zinc-600 bg-zinc-800/80 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-[#00ff9f]/45 hover:bg-zinc-800"
        >
          {open ? "Cancel edit" : "Edit tool"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onDelete}
          className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-950/70 disabled:opacity-50"
        >
          {pending ? "Deleting..." : "Delete tool"}
        </button>
      </div>
      {open ? (
        <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-zinc-700 bg-[#0f0f0f] p-3">
          <div>
            <label htmlFor={`owner-title-${post.id}`} className="text-xs text-zinc-500">
              Title
            </label>
            <input
              id={`owner-title-${post.id}`}
              name="title"
              required
              minLength={3}
              defaultValue={post.title}
              className="mt-1 w-full rounded border border-zinc-700 bg-[#141414] px-2 py-1.5 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor={`owner-url-${post.id}`} className="text-xs text-zinc-500">
              URL
            </label>
            <input
              id={`owner-url-${post.id}`}
              name="url"
              type="url"
              defaultValue={post.url ?? ""}
              placeholder="https://... (optional)"
              className="mt-1 w-full rounded border border-zinc-700 bg-[#141414] px-2 py-1.5 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor={`owner-desc-${post.id}`} className="text-xs text-zinc-500">
              Description
            </label>
            <textarea
              id={`owner-desc-${post.id}`}
              name="description"
              rows={3}
              defaultValue={post.description ?? ""}
              className="mt-1 w-full rounded border border-zinc-700 bg-[#141414] px-2 py-1.5 text-sm text-zinc-100"
            />
          </div>
          <div>
            <label htmlFor={`owner-kind-${post.id}`} className="text-xs text-zinc-500">
              Listing type
            </label>
            <select
              id={`owner-kind-${post.id}`}
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
            <label htmlFor={`owner-cat-${post.id}`} className="text-xs text-zinc-500">
              Category
            </label>
            <select
              id={`owner-cat-${post.id}`}
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-700 bg-[#141414] px-2 py-1.5 text-sm text-zinc-100"
            >
              {CATEGORIES_BY_KIND[listingKind].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded bg-[#00ff9f] px-3 py-1.5 text-xs font-semibold text-[#0f0f0f] disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save changes"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
