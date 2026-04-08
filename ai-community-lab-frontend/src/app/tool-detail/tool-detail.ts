import { Component, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, map, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import type { ToolDetail as ToolDetailModel } from '../core/models/api.models';
import { ToolService } from '../core/services/tool.service';
import { ReviewForm, type ReviewFormDialogData } from '../review-form/review-form';
import { ReviewList } from '../review-list/review-list';
import { SiteHeader } from '../site-header/site-header';
import { ToolRatingSection } from '../tool-rating-section/tool-rating-section';

@Component({
  selector: 'app-tool-detail',
  imports: [
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    ReviewList,
    RouterLink,
    SiteHeader,
    ToolRatingSection,
  ],
  templateUrl: './tool-detail.html',
  styleUrl: './tool-detail.scss',
})
export class ToolDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly toolService = inject(ToolService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(ReviewList) private reviews?: ReviewList;
  @ViewChild(ToolRatingSection) private ratingSection?: ToolRatingSection;

  protected readonly toolId = signal('');
  protected readonly detail = signal<ToolDetailModel | null>(null);
  protected readonly notFound = signal(false);
  protected readonly loading = signal(true);

  constructor() {
    this.route.paramMap
      .pipe(
        map((p) => p.get('toolId') ?? ''),
        filter((id) => !!id),
        switchMap((id) => {
          this.toolId.set(id);
          this.loading.set(true);
          return this.toolService.getTool(id);
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: (t) => {
          this.detail.set(t);
          this.notFound.set(!t);
          this.loading.set(false);
        },
        error: () => {
          this.notFound.set(true);
          this.loading.set(false);
        },
      });
  }

  protected openReviewForm(): void {
    const id = this.toolId();
    if (!id) return;
    this.dialog
      .open<ReviewForm, ReviewFormDialogData, boolean>(ReviewForm, {
        width: 'min(100vw - 32px, 480px)',
        data: { toolId: id },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) {
          this.snackBar.open('Review published.', 'OK', { duration: 3500 });
          this.reviews?.reload();
          this.ratingSection?.refreshAverage();
        }
      });
  }
}
