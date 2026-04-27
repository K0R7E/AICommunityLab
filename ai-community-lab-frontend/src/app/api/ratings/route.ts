import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isCrossSiteRequest, validateCsrfToken } from "@/lib/csrf";

type JsonObject = Record<string, unknown>;

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" ? (value as JsonObject) : {};
}

function readPostId(payload: JsonObject): string | null {
  const postId = payload.postId;
  if (typeof postId !== "string") return null;
  const trimmed = postId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readRatingValue(payload: JsonObject): number | null {
  const value = payload.value;
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 1 || value > 5) return null;
  return value;
}

function isAuthorizedMutation(request: NextRequest): boolean {
  return !isCrossSiteRequest(request) && validateCsrfToken(request);
}

export async function POST(request: NextRequest) {
  if (!isAuthorizedMutation(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const payload = asRecord(await request.json().catch(() => null));
  const postId = readPostId(payload);
  const value = readRatingValue(payload);
  if (!postId || value === null) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("ratings").upsert(
    {
      post_id: postId,
      user_id: user.id,
      value,
    },
    { onConflict: "user_id,post_id" },
  );

  if (error) {
    return NextResponse.json({ ok: false, error: "vote_failed" }, { status: 400 });
  }

  return response;
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorizedMutation(request)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }

  const payload = asRecord(await request.json().catch(() => null));
  const postId = readPostId(payload);
  if (!postId) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("ratings")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ ok: false, error: "vote_failed" }, { status: 400 });
  }

  return response;
}
