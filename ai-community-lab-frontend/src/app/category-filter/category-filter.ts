import { Component, inject, OnInit, output, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

import type { Category } from '../core/models/api.models';
import { CategoryService } from '../core/services/category.service';

@Component({
  selector: 'app-category-filter',
  imports: [MatFormFieldModule, MatSelectModule],
  templateUrl: './category-filter.html',
  styleUrl: './category-filter.scss',
})
export class CategoryFilter implements OnInit {
  private readonly categoriesApi = inject(CategoryService);

  /** Emits selected category id, or `null` for all */
  readonly categoryChange = output<number | null>();

  protected readonly categories = signal<Category[]>([]);
  protected selected: number | null = null;

  ngOnInit(): void {
    this.categoriesApi.getCategories().subscribe({
      next: (c) => this.categories.set(c),
      error: () => this.categories.set([]),
    });
  }

  protected onSelect(ev: MatSelectChange): void {
    const v = ev.value;
    this.selected = v === '' || v === undefined || v === null ? null : Number(v);
    this.categoryChange.emit(this.selected);
  }
}
