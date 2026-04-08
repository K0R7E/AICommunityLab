/** Category row from GET /api/categories */
export interface Category {
  id: number;
  name: string;
}

/** Tool detail (aligned with ASP.NET Core JSON camelCase). */
export interface ToolDetail {
  id: string;
  name: string;
  description: string;
  useCases: string[];
  pricing: string | null;
  categoryId: number;
  categoryName: string;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  associatedReviews?: Review[];
}

/** GET /api/tools list item */
export interface ToolListItem extends ToolDetail {}

/** Card / grid preview */
export interface AiToolPreview {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
}

export interface RatingAverage {
  average: number;
  count: number;
}

export interface Review {
  id: string;
  toolId: string;
  authorName: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  upvotes: number;
  downvotes: number;
}

export interface ReviewsPage {
  items: Review[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface SubmitReviewPayload {
  authorName?: string;
  text: string;
}
