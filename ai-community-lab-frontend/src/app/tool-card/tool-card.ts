import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { StarRating } from '../star-rating/star-rating';
import type { AiToolPreview } from './tool-model';

@Component({
  selector: 'app-tool-card',
  imports: [MatCardModule, MatChipsModule, RouterLink, StarRating, DecimalPipe],
  templateUrl: './tool-card.html',
  styleUrl: './tool-card.scss',
})
export class ToolCard {
  readonly tool = input.required<AiToolPreview>();
}
