import { Component, model, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Interactive 1–5 star control (Material icons + keyboard accessible). */
@Component({
  selector: 'app-star-rating-interactive',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './star-rating-interactive.html',
  styleUrl: './star-rating-interactive.scss',
})
export class StarRatingInteractive {
  /** Two-way bound selected value (1–5). */
  readonly value = model<number | null>(null);

  readonly disabled = input(false);
  readonly labelledBy = input<string | undefined>(undefined);

  /** Fired when user selects a star (same as model update). */
  readonly valueChange = output<number>();

  protected setStar(n: number, event?: Event): void {
    if (this.disabled()) return;
    event?.preventDefault();
    this.value.set(n);
    this.valueChange.emit(n);
  }

  protected onKeydown(event: KeyboardEvent, n: number): void {
    if (this.disabled()) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.setStar(n);
    }
  }
}
