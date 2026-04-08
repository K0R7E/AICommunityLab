import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { ReviewService } from '../core/services/review.service';

export interface ReviewFormDialogData {
  toolId: string;
}

@Component({
  selector: 'app-review-form',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './review-form.html',
  styleUrl: './review-form.scss',
})
export class ReviewForm {
  private readonly dialogRef = inject(MatDialogRef<ReviewForm, boolean>);
  private readonly data = inject<ReviewFormDialogData>(MAT_DIALOG_DATA);
  private readonly reviewsApi = inject(ReviewService);
  private readonly snackBar = inject(MatSnackBar);

  protected authorName = '';
  protected text = '';
  protected submitting = false;

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  protected submit(): void {
    const body = this.text.trim();
    if (body.length < 4) {
      this.snackBar.open('Please write a little more detail (at least 4 characters).', 'OK', {
        duration: 4000,
      });
      return;
    }
    this.submitting = true;
    const author = this.authorName.trim() || undefined;
    this.reviewsApi.submitReview(this.data.toolId, { authorName: author, text: body }).subscribe({
      next: () => {
        this.submitting = false;
        this.dialogRef.close(true);
      },
      error: () => {
        this.submitting = false;
        this.snackBar.open('Could not submit review.', 'OK', { duration: 4000 });
      },
    });
  }
}
