import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-star-rating',
  imports: [MatIconModule],
  templateUrl: './star-rating.html',
  styleUrl: './star-rating.scss',
})
export class StarRating {
  readonly rating = input(0);
  readonly max = input(5);

  protected readonly sequence = computed(() => {
    const cap = this.max();
    const r = Math.min(cap, Math.max(0, this.rating()));
    const stars: Array<'full' | 'half' | 'empty'> = [];
    for (let i = 0; i < cap; i++) {
      const v = r - i;
      if (v >= 1) stars.push('full');
      else if (v >= 0.5) stars.push('half');
      else stars.push('empty');
    }
    return stars;
  });
}
