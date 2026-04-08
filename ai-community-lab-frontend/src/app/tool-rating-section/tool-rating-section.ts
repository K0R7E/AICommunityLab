import { DecimalPipe } from '@angular/common';
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { RatingService } from '../core/services/rating.service';
import { StarRating } from '../star-rating/star-rating';
import { StarRatingInteractive } from '../star-rating-interactive/star-rating-interactive';

@Component({
  selector: 'app-tool-rating-section',
  imports: [DecimalPipe, MatButtonModule, MatSnackBarModule, StarRating, StarRatingInteractive],
  templateUrl: './tool-rating-section.html',
  styleUrl: './tool-rating-section.scss',
})
export class ToolRatingSection implements OnInit {
  private readonly ratings = inject(RatingService);
  private readonly snackBar = inject(MatSnackBar);

  readonly toolId = input.required<string>();

  protected readonly average = signal(0);
  protected readonly count = signal(0);
  protected readonly loading = signal(true);
  protected readonly submitting = signal(false);
  protected readonly draftStars = signal<number | null>(null);

  ngOnInit(): void {
    this.refreshAverage();
  }

  refreshAverage(): void {
    this.loading.set(true);
    this.ratings.getAverage(this.toolId()).subscribe({
      next: (r) => {
        this.average.set(r.average);
        this.count.set(r.count);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Could not load ratings.', 'OK', { duration: 4000 });
        this.loading.set(false);
      },
    });
  }

  protected submitRating(): void {
    const stars = this.draftStars();
    if (stars == null) {
      this.snackBar.open('Pick a star rating first.', 'OK', { duration: 3500 });
      return;
    }
    this.submitting.set(true);
    this.ratings.submitRating(this.toolId(), stars).subscribe({
      next: (r) => {
        this.average.set(r.average);
        this.count.set(r.count);
        this.submitting.set(false);
        this.snackBar.open('Thanks — your rating was saved.', 'OK', { duration: 3500 });
      },
      error: () => {
        this.submitting.set(false);
        this.snackBar.open('Could not save rating.', 'OK', { duration: 4000 });
      },
    });
  }
}
