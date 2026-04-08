import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import type { RatingAverage } from '../models/api.models';
import { API_BASE_URL } from '../tokens/api-base-url';
import { buildApiUrl } from './api-url';
import { MockToolsStore } from './mock-tools.store';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly mock = inject(MockToolsStore);

  private useMock(): boolean {
    return !this.baseUrl?.trim();
  }

  getAverage(toolId: string): Observable<RatingAverage> {
    if (this.useMock()) return of(this.mock.getRatingAverage(toolId));
    return this.http
      .get<RatingAverage>(buildApiUrl(this.baseUrl, `/api/tools/${encodeURIComponent(toolId)}/ratings/average`))
      .pipe(catchError(() => of(this.mock.getRatingAverage(toolId))));
  }

  submitRating(toolId: string, stars: number): Observable<RatingAverage> {
    if (this.useMock()) return of(this.mock.submitRating(toolId, stars));
    return this.http
      .post<RatingAverage>(buildApiUrl(this.baseUrl, `/api/tools/${encodeURIComponent(toolId)}/ratings`), {
        stars,
      })
      .pipe(catchError(() => of(this.mock.submitRating(toolId, stars))));
  }
}
