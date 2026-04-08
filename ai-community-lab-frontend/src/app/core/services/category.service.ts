import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

import type { Category } from '../models/api.models';
import { API_BASE_URL } from '../tokens/api-base-url';
import { buildApiUrl } from './api-url';
import { MockToolsStore } from './mock-tools.store';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly mock = inject(MockToolsStore);

  private useMock(): boolean {
    return !this.baseUrl?.trim();
  }

  getCategories(): Observable<Category[]> {
    if (this.useMock()) return of(this.mock.getCategories());
    return this.http.get<Category[]>(buildApiUrl(this.baseUrl, '/api/categories')).pipe(
      catchError(() => of(this.mock.getCategories())),
    );
  }
}
