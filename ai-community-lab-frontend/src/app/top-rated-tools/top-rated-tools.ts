import { DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';

import type { AiToolPreview } from '../tool-card/tool-model';
import { ToolService } from '../core/services/tool.service';
import { StarRating } from '../star-rating/star-rating';

@Component({
  selector: 'app-top-rated-tools',
  imports: [DecimalPipe, MatCardModule, RouterLink, StarRating],
  templateUrl: './top-rated-tools.html',
  styleUrl: './top-rated-tools.scss',
})
export class TopRatedTools implements OnInit {
  private readonly toolsApi = inject(ToolService);

  protected readonly tools = signal<AiToolPreview[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  ngOnInit(): void {
    this.toolsApi.getTopRatedWeek('week', 5).subscribe({
      next: (list) => {
        this.tools.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
