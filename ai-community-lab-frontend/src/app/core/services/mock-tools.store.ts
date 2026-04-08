import { Injectable } from '@angular/core';

import type {
  Category,
  RatingAverage,
  Review,
  ReviewsPage,
  SubmitReviewPayload,
  ToolDetail,
  ToolListItem,
} from '../models/api.models';

/** Matches backend seed UUIDs (see ai-community-lab-backend/seed_data.sql). */
const T = {
  clarityWrite: 'a1000001-0000-4000-8000-000000000001',
  visionParse: 'a1000001-0000-4000-8000-000000000002',
  codePilot: 'a1000001-0000-4000-8000-000000000003',
  voiceFlow: 'a1000001-0000-4000-8000-000000000004',
  dataMind: 'a1000001-0000-4000-8000-000000000005',
  imageCraft: 'a1000001-0000-4000-8000-000000000006',
  campaignPilot: 'a1000001-0000-4000-8000-000000000007',
  estateLens: 'a1000001-0000-4000-8000-000000000008',
} as const;

function nowIso(): string {
  return new Date().toISOString();
}

@Injectable({ providedIn: 'root' })
export class MockToolsStore {
  private readonly categoriesData: Category[] = [
    { id: 1, name: 'Marketing' },
    { id: 2, name: 'Real Estate' },
    { id: 3, name: 'Development' },
    { id: 4, name: 'Productivity' },
    { id: 5, name: 'Creative' },
    { id: 6, name: 'Data' },
    { id: 7, name: 'Audio' },
  ];

  private readonly toolsData: ToolDetail[] = [
    {
      id: T.clarityWrite,
      name: 'ClarityWrite',
      description: 'Long-form drafting with tone control and source-aware suggestions.',
      useCases: ['Blog posts', 'Reports', 'Documentation'],
      pricing: 'Freemium',
      categoryId: 4,
      categoryName: 'Productivity',
      averageRating: 4.5,
      ratingCount: 2,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: T.visionParse,
      name: 'VisionParse',
      description: 'Extract tables and text from PDFs and scans with high accuracy.',
      useCases: ['Invoices', 'Research PDFs', 'Archives'],
      pricing: 'Paid',
      categoryId: 4,
      categoryName: 'Productivity',
      averageRating: 4.3,
      ratingCount: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: T.codePilot,
      name: 'CodePilot',
      description: 'Context-aware coding help inside your editor with repo awareness.',
      useCases: ['Refactors', 'Tests', 'Onboarding'],
      pricing: 'Subscription',
      categoryId: 3,
      categoryName: 'Development',
      averageRating: 4.7,
      ratingCount: 3,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: T.voiceFlow,
      name: 'VoiceFlow',
      description: 'Natural voices and SSML controls for narration and accessibility.',
      useCases: ['Audiobooks', 'IVR', 'Accessibility'],
      pricing: 'Usage-based',
      categoryId: 7,
      categoryName: 'Audio',
      averageRating: 4.1,
      ratingCount: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: T.dataMind,
      name: 'DataMind',
      description: 'Ask questions of spreadsheets and SQL without writing queries.',
      useCases: ['Analytics', 'Ops reporting', 'Ad-hoc questions'],
      pricing: 'Team plans',
      categoryId: 6,
      categoryName: 'Data',
      averageRating: 4.4,
      ratingCount: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: T.imageCraft,
      name: 'ImageCraft',
      description: 'Generate and refine visuals with consistent brand-safe styles.',
      useCases: ['Social', 'Ads', 'Concept art'],
      pricing: 'Credits',
      categoryId: 5,
      categoryName: 'Creative',
      averageRating: 4.8,
      ratingCount: 1,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: T.campaignPilot,
      name: 'CampaignPilot',
      description: 'Multi-channel copy variants with guardrails and brand voice checks.',
      useCases: ['Paid social', 'Lifecycle email', 'Landing pages'],
      pricing: 'Subscription',
      categoryId: 1,
      categoryName: 'Marketing',
      averageRating: 4.2,
      ratingCount: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: T.estateLens,
      name: 'EstateLens',
      description: 'Property descriptions, comps summaries, and disclosure Q&A assistance.',
      useCases: ['Listings', 'Buyer packets', 'Brokerage ops'],
      pricing: 'Per seat',
      categoryId: 2,
      categoryName: 'Real Estate',
      averageRating: 4.0,
      ratingCount: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];

  private ratings: Array<{ tool_id: string; stars: number; created_at: string }> = [];
  private reviews: Review[] = [];

  constructor() {
    this.seedRatingsAndReviews();
  }

  private seedRatingsAndReviews(): void {
    const weekAgo = Date.now() - 5 * 86400000 * 1000;
    const stamp = (d: number) => new Date(d).toISOString();
    this.ratings = [
      { tool_id: T.codePilot, stars: 5, created_at: stamp(weekAgo + 3600000) },
      { tool_id: T.codePilot, stars: 5, created_at: stamp(weekAgo + 7200000) },
      { tool_id: T.codePilot, stars: 4, created_at: stamp(weekAgo + 10800000) },
      { tool_id: T.imageCraft, stars: 5, created_at: stamp(weekAgo + 500000) },
      { tool_id: T.dataMind, stars: 4, created_at: stamp(weekAgo + 800000) },
    ];
    this.reviews = [
      {
        id: 'rev-1',
        toolId: T.codePilot,
        authorName: 'Jordan M.',
        text: 'Repo-aware suggestions actually match our stack. Saved hours on refactors.',
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        upvotes: 12,
        downvotes: 1,
      },
      {
        id: 'rev-2',
        toolId: T.codePilot,
        authorName: 'Anonymous',
        text: 'Strong for TypeScript; occasional misses on very large files.',
        createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        upvotes: 5,
        downvotes: 0,
      },
    ];
  }

  getCategories(): Category[] {
    return this.categoriesData.map((c) => ({ ...c }));
  }

  getTool(toolId: string): ToolDetail | undefined {
    const t = this.toolsData.find((x) => x.id === toolId);
    if (!t) return undefined;
    const { average, count } = this.computeAverage(toolId);
    return { ...t, averageRating: average, ratingCount: count };
  }

  listTools(categoryId?: number): ToolListItem[] {
    const filtered =
      categoryId == null ? this.toolsData : this.toolsData.filter((t) => t.categoryId === categoryId);
    return filtered.map((t) => this.withComputed(t));
  }

  getTopRatedThisWeek(limit = 5): ToolListItem[] {
    const weekAgo = Date.now() - 7 * 86400000 * 1000;
    const byTool = new Map<string, number[]>();
    for (const r of this.ratings) {
      if (new Date(r.created_at).getTime() < weekAgo) continue;
      const list = byTool.get(r.tool_id) ?? [];
      list.push(r.stars);
      byTool.set(r.tool_id, list);
    }
    const scored = [...byTool.entries()].map(([id, stars]) => ({
      id,
      avg: stars.reduce((a, b) => a + b, 0) / stars.length,
    }));
    scored.sort((a, b) => b.avg - a.avg);
    const ids = scored.slice(0, limit).map((s) => s.id);
    const order = new Map(ids.map((id, i) => [id, i]));
    const picked = this.toolsData.filter((t) => order.has(t.id));
    picked.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    if (picked.length < limit) {
      for (const t of this.toolsData) {
        if (picked.length >= limit) break;
        if (!picked.find((p) => p.id === t.id)) picked.push(t);
      }
    }
    return picked.slice(0, limit).map((t) => this.withComputed(t));
  }

  getRatingAverage(toolId: string): RatingAverage {
    return this.computeAverage(toolId);
  }

  submitRating(toolId: string, stars: number): RatingAverage {
    const clamped = Math.min(5, Math.max(1, Math.round(stars)));
    this.ratings.push({ tool_id: toolId, stars: clamped, created_at: nowIso() });
    this.syncToolAggregate(toolId);
    return this.computeAverage(toolId);
  }

  getReviews(toolId: string, page: number, pageSize: number): ReviewsPage {
    const all = this.reviews
      .filter((r) => r.toolId === toolId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = (page - 1) * pageSize;
    const slice = all.slice(start, start + pageSize).map((r) => ({ ...r }));
    return {
      items: slice,
      page,
      pageSize,
      total: all.length,
      hasMore: start + pageSize < all.length,
    };
  }

  submitReview(toolId: string, payload: SubmitReviewPayload): Review {
    const id = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = nowIso();
    const author = payload.authorName?.trim() || 'Anonymous';
    const review: Review = {
      id,
      toolId,
      authorName: author.length > 255 ? author.slice(0, 255) : author,
      text: payload.text.trim(),
      createdAt: now,
      updatedAt: now,
      upvotes: 0,
      downvotes: 0,
    };
    this.reviews.unshift(review);
    return { ...review };
  }

  voteReview(reviewId: string, direction: 'up' | 'down'): Review | undefined {
    const r = this.reviews.find((x) => x.id === reviewId);
    if (!r) return undefined;
    const now = nowIso();
    if (direction === 'up') r.upvotes += 1;
    else r.downvotes += 1;
    r.updatedAt = now;
    return { ...r };
  }

  private computeAverage(toolId: string): RatingAverage {
    const list = this.ratings.filter((r) => r.tool_id === toolId);
    if (!list.length) return { average: 0, count: 0 };
    const sum = list.reduce((s, r) => s + r.stars, 0);
    return { average: Math.round((sum / list.length) * 10) / 10, count: list.length };
  }

  private withComputed(t: ToolDetail): ToolListItem {
    const { average, count } = this.computeAverage(t.id);
    const avgDisplay = average > 0 ? average : t.averageRating;
    return { ...t, averageRating: avgDisplay, ratingCount: count || t.ratingCount };
  }

  private syncToolAggregate(toolId: string): void {
    const { average, count } = this.computeAverage(toolId);
    const t = this.toolsData.find((x) => x.id === toolId);
    if (t) {
      t.averageRating = average;
      t.ratingCount = count;
    }
  }
}
