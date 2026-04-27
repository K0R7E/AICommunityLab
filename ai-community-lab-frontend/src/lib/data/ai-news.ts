import "server-only";

const GNEWS_BASE_URL = "https://gnews.io/api/v4/search";
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const ERROR_COOLDOWN_MS = 10 * 60 * 1000;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_MAX_PAGES = 1;
const DEFAULT_MAX_ARTICLES = 20;
const DEFAULT_LANG = "en";
const REQUEST_TIMEOUT_MS = 10_000;
const FORCE_SINGLE_API_CALL = true;

const AI_NEWS_QUERIES = [
  '("artificial intelligence" OR "generative AI" OR "machine learning" OR LLM OR OpenAI OR Anthropic OR Claude OR Gemini OR DeepMind OR Mistral OR xAI OR Copilot)',
  '"artificial intelligence" OR "generative AI" OR "machine learning" OR LLM OR OpenAI OR Anthropic OR Claude OR Gemini OR DeepMind',
  '"artificial intelligence" OR AI OR LLM OR OpenAI OR Anthropic OR Gemini OR DeepMind',
] as const;

export type AiNewsArticle = {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string | null;
  source: string;
  publishedAt: string;
  isNew: boolean;
};

type AiNewsSourceState = "fresh" | "stale" | "empty" | "error";

export type AiNewsDataset = {
  articles: AiNewsArticle[];
  hasNewArticles: boolean;
  lastUpdatedAt: string | null;
  sourceState: AiNewsSourceState;
  errorMessage: string | null;
};

type GNewsSource = {
  name?: unknown;
};

type GNewsArticle = {
  title?: unknown;
  description?: unknown;
  url?: unknown;
  image?: unknown;
  publishedAt?: unknown;
  source?: GNewsSource | null;
};

type GNewsResponse = {
  articles?: unknown;
};

type CacheState = {
  dataset: AiNewsDataset | null;
  expiresAt: number;
  lastSuccessfulUrlSet: Set<string>;
  inFlight: Promise<AiNewsDataset> | null;
};

class GNewsHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GNewsHttpError";
    this.status = status;
  }
}

const cacheState: CacheState = {
  dataset: null,
  expiresAt: 0,
  lastSuccessfulUrlSet: new Set(),
  inFlight: null,
};

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt((value ?? "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function readConfig() {
  const apiKey = process.env.GNEWS_API_KEY?.trim() ?? "";
  const pageSize = toPositiveInt(process.env.GNEWS_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  const maxPages = toPositiveInt(process.env.GNEWS_MAX_PAGES, DEFAULT_MAX_PAGES);
  const maxArticles = toPositiveInt(process.env.GNEWS_MAX_ARTICLES, DEFAULT_MAX_ARTICLES);
  const lang = process.env.GNEWS_LANG?.trim() || DEFAULT_LANG;

  return {
    apiKey,
    pageSize,
    maxPages,
    maxArticles,
    lang,
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeArticle(raw: GNewsArticle): Omit<AiNewsArticle, "isNew"> | null {
  const title = isNonEmptyString(raw.title) ? raw.title.trim() : "";
  const url = isNonEmptyString(raw.url) ? raw.url.trim() : "";
  const publishedAt = isNonEmptyString(raw.publishedAt) ? raw.publishedAt.trim() : "";
  const sourceName = isNonEmptyString(raw.source?.name) ? raw.source.name.trim() : "";

  if (!title || !url || !publishedAt || !sourceName) {
    return null;
  }

  const description = isNonEmptyString(raw.description) ? raw.description.trim() : "";
  const image = isNonEmptyString(raw.image) ? raw.image.trim() : null;
  const id = encodeURIComponent(url);

  return {
    id,
    title,
    description,
    url,
    image,
    source: sourceName,
    publishedAt,
  };
}

async function fetchWithTimeout(url: URL): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPagesForQuery(
  config: ReturnType<typeof readConfig>,
  query: string,
): Promise<Omit<AiNewsArticle, "isNew">[]> {
  const dedupedByUrl = new Map<string, Omit<AiNewsArticle, "isNew">>();
  const maxPagesForRun = FORCE_SINGLE_API_CALL ? 1 : config.maxPages;

  for (let page = 1; page <= maxPagesForRun; page += 1) {
    const params = new URLSearchParams({
      q: query,
      lang: config.lang,
      sortby: "publishedAt",
      max: String(config.pageSize),
      page: String(page),
      apikey: config.apiKey,
    });

    const url = new URL(`${GNEWS_BASE_URL}?${params.toString()}`);
    const response = await fetchWithTimeout(url);

    if (!response.ok) {
      let details = "";
      try {
        details = await response.text();
      } catch {
        details = "";
      }
      throw new GNewsHttpError(
        response.status,
        `GNews request failed with status ${response.status}${details ? `: ${details}` : ""}`,
      );
    }

    const payload = (await response.json()) as GNewsResponse;
    const incoming = Array.isArray(payload.articles) ? (payload.articles as GNewsArticle[]) : [];

    if (incoming.length === 0) {
      break;
    }

    for (const rawArticle of incoming) {
      const normalized = normalizeArticle(rawArticle);
      if (!normalized) continue;
      if (!dedupedByUrl.has(normalized.url)) {
        dedupedByUrl.set(normalized.url, normalized);
      }
      if (dedupedByUrl.size >= config.maxArticles) {
        break;
      }
    }

    if (dedupedByUrl.size >= config.maxArticles) {
      break;
    }
  }

  return Array.from(dedupedByUrl.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

async function fetchAllArticlesFromGNews(): Promise<Omit<AiNewsArticle, "isNew">[]> {
  const config = readConfig();

  if (!config.apiKey) {
    throw new Error("Missing GNEWS_API_KEY");
  }

  let lastError: Error | null = null;

  if (FORCE_SINGLE_API_CALL) {
    return fetchPagesForQuery(config, AI_NEWS_QUERIES[0]);
  }

  for (const query of AI_NEWS_QUERIES) {
    try {
      return await fetchPagesForQuery(config, query);
    } catch (error) {
      if (error instanceof GNewsHttpError && error.status === 429) {
        // Do not continue fallback attempts when rate-limited.
        throw error;
      }
      lastError = error instanceof Error ? error : new Error("Unknown GNews fetch error");
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}

function emptyDataset(state: AiNewsSourceState, errorMessage: string | null): AiNewsDataset {
  return {
    articles: [],
    hasNewArticles: false,
    lastUpdatedAt: null,
    sourceState: state,
    errorMessage,
  };
}

async function refreshDataset(): Promise<AiNewsDataset> {
  try {
    const normalizedArticles = await fetchAllArticlesFromGNews();
    const currentUrlSet = new Set(normalizedArticles.map((article) => article.url));
    const hasPreviousSnapshot = cacheState.lastSuccessfulUrlSet.size > 0;

    const articles = normalizedArticles.map((article) => ({
      ...article,
      isNew: hasPreviousSnapshot ? !cacheState.lastSuccessfulUrlSet.has(article.url) : false,
    }));

    const hasNewArticles = hasPreviousSnapshot && articles.some((article) => article.isNew);

    const dataset: AiNewsDataset = {
      articles,
      hasNewArticles,
      lastUpdatedAt: new Date().toISOString(),
      sourceState: articles.length === 0 ? "empty" : "fresh",
      errorMessage: null,
    };

    cacheState.dataset = dataset;
    cacheState.expiresAt = Date.now() + TWO_HOURS_MS;
    cacheState.lastSuccessfulUrlSet = currentUrlSet;
    return dataset;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI news fetch error";
    const hasSuccessfulSnapshot = cacheState.lastSuccessfulUrlSet.size > 0;
    if (cacheState.dataset && hasSuccessfulSnapshot) {
      const staleDataset: AiNewsDataset = {
        ...cacheState.dataset,
        sourceState: "stale",
        errorMessage: message,
      };
      cacheState.dataset = staleDataset;
      cacheState.expiresAt = Date.now() + ERROR_COOLDOWN_MS;
      return staleDataset;
    }
    const errorDataset = emptyDataset("error", message);
    // Avoid hammering the API after an initial failure (e.g. 429 rate limit).
    cacheState.dataset = errorDataset;
    cacheState.expiresAt = Date.now() + ERROR_COOLDOWN_MS;
    return errorDataset;
  }
}

export async function getAiNewsDataset(): Promise<AiNewsDataset> {
  const cachedDataset = cacheState.dataset;
  const hasFreshCache = cachedDataset !== null && Date.now() < cacheState.expiresAt;
  if (hasFreshCache) {
    return cachedDataset;
  }

  if (!cacheState.inFlight) {
    cacheState.inFlight = refreshDataset().finally(() => {
      cacheState.inFlight = null;
    });
  }

  return cacheState.inFlight;
}

export async function getAiNewsPreview(limit = 3): Promise<AiNewsDataset> {
  const dataset = await getAiNewsDataset();
  const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 3;
  return {
    ...dataset,
    articles: dataset.articles.slice(0, normalizedLimit),
  };
}
