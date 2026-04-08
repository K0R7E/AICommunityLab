import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';

import type { AiToolPreview, ToolDetail, ToolListItem } from '../models/api.models';
import { API_BASE_URL } from '../tokens/api-base-url';
import { buildApiUrl } from './api-url';
import { MockToolsStore } from './mock-tools.store';

@Injectable({ providedIn: 'root' })
export class ToolService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly mock = inject(MockToolsStore);

  private useMock(): boolean {
    return !this.baseUrl?.trim();
  }

  /** Grid / cards */
  getTools(categoryId?: number): Observable<AiToolPreview[]> {
    return this.getToolListItems(categoryId).pipe(map((list) => list.map((t) => this.toPreview(t))));
  }

  getToolListItems(categoryId?: number): Observable<ToolListItem[]> {
    if (this.useMock()) return of(this.mock.listTools(categoryId));
    let params = new HttpParams();
    if (categoryId != null) params = params.set('categoryId', String(categoryId));
    return this.http
      .get<ToolListItem[]>(buildApiUrl(this.baseUrl, '/api/tools'), { params })
      .pipe(catchError(() => of(this.mock.listTools(categoryId))));
  }

  getTool(toolId: string): Observable<ToolDetail | null> {
    if (this.useMock()) return of(this.mock.getTool(toolId) ?? null);
    return this.http.get<ToolDetail>(buildApiUrl(this.baseUrl, `/api/tools/${encodeURIComponent(toolId)}`)).pipe(
      catchError(() => of(this.mock.getTool(toolId) ?? null)),
    );
  }

  getTopRatedWeek(timeframe: string = 'week', limit = 5): Observable<AiToolPreview[]> {
    const params = new HttpParams().set('timeframe', timeframe).set('limit', String(limit));
    if (this.useMock()) return of(this.mock.getTopRatedThisWeek(limit).map((t) => this.toPreview(t)));
    return this.http
      .get<ToolListItem[]>(buildApiUrl(this.baseUrl, '/api/tools/top-rated'), { params })
      .pipe(
        map((list) => list.map((t) => this.toPreview(t))),
        catchError(() => of(this.mock.getTopRatedThisWeek(limit).map((t) => this.toPreview(t)))),
      );
  }

  private toPreview(t: ToolListItem): AiToolPreview {
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.categoryName,
      rating: t.averageRating,
    };
  }
}
