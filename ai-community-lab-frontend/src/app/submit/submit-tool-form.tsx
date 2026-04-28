"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { submitPost, type SubmitPostState } from "@/app/actions";
import { CATEGORIES_BY_KIND, LISTING_KINDS, type ListingKind } from "@/lib/constants";
import { SIMILARITY_BLOCK_THRESHOLD } from "@/lib/duplicate-post-check";

const initial: SubmitPostState = { error: null };

export function SubmitToolForm() {
  const [state, formAction, pending] = useActionState(submitPost, initial);

  const snap = state.duplicateWarning?.fieldSnap;
  const defaultKind = snap?.listingKind ?? LISTING_KINDS[0];
  const [listingKind, setListingKind] = useState<ListingKind>(defaultKind);
  useEffect(() => {
    setListingKind(defaultKind);
  }, [defaultKind]);
  const categoryOptions = useMemo(
    () => [...CATEGORIES_BY_KIND[listingKind]],
    [listingKind],
  );
  const defaultCategory =
    snap?.category && CATEGORIES_BY_KIND[defaultKind].includes(snap.category)
      ? snap.category
      : CATEGORIES_BY_KIND[defaultKind][0];
  const [category, setCategory] = useState(defaultCategory);
  useEffect(() => {
    setCategory(defaultCategory);
  }, [defaultCategory]);
  const formKey = snap ? `dup:${JSON.stringify(snap)}` : "form-empty";

  return (
    <form key={formKey} action={formAction} className="flex max-w-lg flex-col gap-4">
      {state.duplicateWarning ? (
        <div
          className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          <p className="font-medium text-amber-50">Similar tools already on the site</p>
          <p className="mt-1 text-xs text-amber-200/90">
            We found listings with a similar title or description (score ≥{" "}
            {SIMILARITY_BLOCK_THRESHOLD}). If yours is different, confirm below and
            submit again.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {state.duplicateWarning.candidates.map((c) => (
              <li
                key={c.id}
                className="rounded-md border border-amber-900/40 bg-background/80 px-3 py-2"
              >
                <p className="font-medium text-zinc-100">{c.title}</p>
                {c.excerpt ? (
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{c.excerpt}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span className="capitalize">{c.moderation_status}</span>
                  <span>Match {(Number(c.score) || 0).toFixed(2)}</span>
                  <Link
                    href={`/post/${c.id}`}
                    className="font-medium text-accent hover:underline"
                  >
                    Open listing
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <label className="mt-4 flex cursor-pointer items-start gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              name="confirm_duplicate"
              value="on"
              className="mt-0.5 size-4 shrink-0 rounded border-zinc-600 bg-background text-accent"
            />
            <span>
              These are not duplicates of my tool; I still want to publish this submission.
            </span>
          </label>
        </div>
      ) : null}

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-300">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          minLength={3}
          defaultValue={snap?.title ?? ""}
          className="w-full rounded-lg border border-zinc-700 bg-surface-sunken px-3 py-2 text-zinc-100 outline-none ring-accent/40 focus:ring-2"
          placeholder="e.g. Acme AI Writer"
        />
      </div>
      <div>
        <label htmlFor="url" className="mb-1 block text-sm font-medium text-zinc-300">
          Site URL (optional)
        </label>
        <input
          id="url"
          name="url"
          type="url"
          defaultValue={snap?.url ?? ""}
          className="w-full rounded-lg border border-zinc-700 bg-surface-sunken px-3 py-2 text-zinc-100 outline-none ring-accent/40 focus:ring-2"
          placeholder="https://…"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Leave empty if there is no public page yet (e.g. idea or desktop-only tool).
        </p>
      </div>
      <div>
        <label
          htmlFor="description"
          className="mb-1 block text-sm font-medium text-zinc-300"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={snap?.description ?? ""}
          className="w-full rounded-lg border border-zinc-700 bg-surface-sunken px-3 py-2 text-zinc-100 outline-none ring-accent/40 focus:ring-2"
          placeholder="One line about what it does"
        />
      </div>
      <div>
        <label
          htmlFor="listing_kind"
          className="mb-1 block text-sm font-medium text-zinc-300"
        >
          Listing type
        </label>
        <select
          id="listing_kind"
          name="listing_kind"
          required
          value={listingKind}
          onChange={(e) => {
            const nextKind = e.target.value as ListingKind;
            setListingKind(nextKind);
            setCategory(CATEGORIES_BY_KIND[nextKind][0]);
          }}
          className="w-full rounded-lg border border-zinc-700 bg-surface-sunken px-3 py-2 text-zinc-100 outline-none ring-accent/40 focus:ring-2"
        >
          {LISTING_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {kind}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-zinc-300">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-surface-sunken px-3 py-2 text-zinc-100 outline-none ring-accent/40 focus:ring-2"
        >
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <div className="space-y-2">
          <p className="text-sm text-red-400" role="alert">
            {state.error}
          </p>
          {state.duplicateUrlPostId ? (
            <p className="text-sm">
              <Link
                href={`/post/${state.duplicateUrlPostId}`}
                className="font-medium text-accent hover:underline"
              >
                Open existing listing
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? "Publishing…" : state.duplicateWarning ? "Submit again" : "Publish"}
      </button>
    </form>
  );
}
