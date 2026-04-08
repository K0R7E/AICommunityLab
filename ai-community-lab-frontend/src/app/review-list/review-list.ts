import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import type { Review } from '../core/models/api.models';
import { ReviewService } from '../core/services/review.service';

@Component({
  selector: 'app-review-list',
  imports: [DatePipe, MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './review-list.html',
  styleUrl: './review-list.scss',
})
export class ReviewList implements OnInit {
  private readonly reviewsApi = inject(ReviewService);
  private readonly snackBar = inject(MatSnackBar);

  readonly toolId = input.required<string>();

  readonly refreshed = output<void>();

  protected readonly items = signal<Review[]>([]);
  protected readonly page = signal(1);
  protected readonly hasMore = signal(false);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly voteBusy = signal<Record<string, boolean>>({});

  private readonly pageSize = 5;

  ngOnInit(): void {
    this.loadPage(1, true);
  }

  protected loadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;
    const next = this.page() + 1;
    this.loadingMore.set(true);
    this.reviewsApi.getReviews(this.toolId(), next, this.pageSize).subscribe({
      next: (res) => {
        this.items.update((cur) => [...cur, ...res.items]);
        this.page.set(res.page);
        this.hasMore.set(res.hasMore);
        this.loadingMore.set(false);
      },
      error: () => {
        this.snackBar.open('Could not load more reviews.', 'OK', { duration: 4000 });
        this.loadingMore.set(false);
      },
    });
  }

  protected vote(id: string, dir: 'up' | 'down'): void {
    this.voteBusy.update((m) => ({ ...m, [id]: true }));
    const req = dir === 'up' ? this.reviewsApi.upvoteReview(id) : this.reviewsApi.downvoteReview(id);
    req.subscribe({
      next: (r) => {
        this.items.update((list) =>
          list.map((x) => (x.id === r.id ? { ...x, upvotes: r.upvotes, downvotes: r.downvotes } : x)),
        );
        this.voteBusy.update((m) => ({ ...m, [id]: false }));
      },
      error: () => {
        this.snackBar.open('Vote could not be saved.', 'OK', { duration: 3500 });
        this.voteBusy.update((m) => ({ ...m, [id]: false }));
      },
    });
  }

  private loadPage(page: number, replace: boolean): void {
    if (replace) this.loading.set(true);
    this.reviewsApi.getReviews(this.toolId(), page, this.pageSize).subscribe({
      next: (res) => {
        if (replace) this.items.set(res.items);
        this.page.set(res.page);
        this.hasMore.set(res.hasMore);
        this.loading.set(false);
        this.refreshed.emit();
      },
      error: () => {
        this.snackBar.open('Could not load reviews.', 'OK', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  reload(): void {
    this.loadPage(1, true);
  }
}
