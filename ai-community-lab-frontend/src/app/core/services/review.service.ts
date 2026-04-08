import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import type { Review, ReviewsPage, SubmitReviewPayload } from '../models/api.models';
import { API_BASE_URL } from '../tokens/api-base-url';
import { buildApiUrl } from './api-url';
import { MockToolsStore } from './mock-tools.store';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly mock = inject(MockToolsStore);

  private useMock(): boolean {
    return !this.baseUrl?.trim();
  }

  getReviews(toolId: string, page = 1, pageSize = 5): Observable<ReviewsPage> {
    const params = new HttpParams().set('page', String(page)).set('pageSize', String(pageSize));
    if (this.useMock()) return of(this.mock.getReviews(toolId, page, pageSize));
    return this.http
      .get<ReviewsPage>(buildApiUrl(this.baseUrl, `/api/tools/${encodeURIComponent(toolId)}/reviews`), {
        params,
      })
      .pipe(catchError(() => of(this.mock.getReviews(toolId, page, pageSize))));
  }

  submitReview(toolId: string, body: SubmitReviewPayload): Observable<Review> {
    if (this.useMock()) return of(this.mock.submitReview(toolId, body));
    return this.http
      .post<Review>(buildApiUrl(this.baseUrl, `/api/tools/${encodeURIComponent(toolId)}/reviews`), body)
      .pipe(catchError(() => of(this.mock.submitReview(toolId, body))));
  }

  upvoteReview(reviewId: string): Observable<Pick<Review, 'id' | 'upvotes' | 'downvotes'>> {
    if (this.useMock()) {
      const r = this.mock.voteReview(reviewId, 'up');
      return of(
        r
          ? { id: r.id, upvotes: r.upvotes, downvotes: r.downvotes }
          : { id: reviewId, upvotes: 0, downvotes: 0 },
      );
    }
    return this.http
      .post<{ id: string; upvotes: number; downvotes: number }>(
        buildApiUrl(this.baseUrl, `/api/reviews/${encodeURIComponent(reviewId)}/upvote`),
        {},
      )
      .pipe(
        catchError(() => {
          const r = this.mock.voteReview(reviewId, 'up');
          return of(
            r
              ? { id: r.id, upvotes: r.upvotes, downvotes: r.downvotes }
              : { id: reviewId, upvotes: 0, downvotes: 0 },
          );
        }),
      );
  }

  downvoteReview(reviewId: string): Observable<Pick<Review, 'id' | 'upvotes' | 'downvotes'>> {
    if (this.useMock()) {
      const r = this.mock.voteReview(reviewId, 'down');
      return of(
        r
          ? { id: r.id, upvotes: r.upvotes, downvotes: r.downvotes }
          : { id: reviewId, upvotes: 0, downvotes: 0 },
      );
    }
    return this.http
      .post<{ id: string; upvotes: number; downvotes: number }>(
        buildApiUrl(this.baseUrl, `/api/reviews/${encodeURIComponent(reviewId)}/downvote`),
        {},
      )
      .pipe(
        catchError(() => {
          const r = this.mock.voteReview(reviewId, 'down');
          return of(
            r
              ? { id: r.id, upvotes: r.upvotes, downvotes: r.downvotes }
              : { id: reviewId, upvotes: 0, downvotes: 0 },
          );
        }),
      );
  }
}
