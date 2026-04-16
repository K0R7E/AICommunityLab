"use client";

import { useActionState } from "react";
import { submitPost, type SubmitPostState } from "@/app/actions";
import { CATEGORIES } from "@/lib/constants";

const initial: SubmitPostState = { error: null };

export function SubmitToolForm() {
  const [state, formAction, pending] = useActionState(submitPost, initial);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-300">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          minLength={3}
          className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-zinc-100 outline-none ring-[#00ff9f]/40 focus:ring-2"
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
          className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-zinc-100 outline-none ring-[#00ff9f]/40 focus:ring-2"
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
          className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-zinc-100 outline-none ring-[#00ff9f]/40 focus:ring-2"
          placeholder="One line about what it does"
        />
      </div>
      <div>
        <label
          htmlFor="image_url"
          className="mb-1 block text-sm font-medium text-zinc-300"
        >
          Logo or screenshot URL (optional)
        </label>
        <input
          id="image_url"
          name="image_url"
          type="url"
          className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-zinc-100 outline-none ring-[#00ff9f]/40 focus:ring-2"
          placeholder="https://… (https only)"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Direct link to an image (PNG/JPG/WebP). Used on the feed card and post page.
        </p>
      </div>
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-zinc-300">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          className="w-full rounded-lg border border-zinc-700 bg-[#141414] px-3 py-2 text-zinc-100 outline-none ring-[#00ff9f]/40 focus:ring-2"
          defaultValue={CATEGORIES[0]}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      {state.error ? (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[#00ff9f] px-4 py-2.5 text-sm font-semibold text-[#0f0f0f] transition hover:bg-[#33ffa8] disabled:opacity-60"
      >
        {pending ? "Publishing…" : "Publish"}
      </button>
    </form>
  );
}
