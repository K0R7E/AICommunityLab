import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CategoryFilter } from '../category-filter/category-filter';
import { FeatureCard } from '../feature-card/feature-card';
import { SiteHeader } from '../site-header/site-header';
import { ToolService } from '../core/services/tool.service';
import type { AiToolPreview } from '../tool-card/tool-model';
import { ToolCard } from '../tool-card/tool-card';
import { TopRatedTools } from '../top-rated-tools/top-rated-tools';

@Component({
  selector: 'app-landing-page',
  imports: [
    CategoryFilter,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    FeatureCard,
    SiteHeader,
    ToolCard,
    TopRatedTools,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage implements OnInit {
  private readonly snackBar = inject(MatSnackBar);
  private readonly toolsApi = inject(ToolService);

  protected email = '';
  protected readonly headerScrolled = signal(false);
  protected readonly tools = signal<AiToolPreview[]>([]);
  protected readonly toolsLoading = signal(true);
  protected readonly toolsError = signal(false);

  protected readonly features = [
    {
      icon: 'inventory_2',
      title: 'Curated AI Tools',
      blurb: 'Hand-picked tools vetted for quality and real-world usefulness.',
    },
    {
      icon: 'rate_review',
      title: 'Real Reviews',
      blurb: 'Honest feedback from practitioners, not marketing fluff.',
    },
    {
      icon: 'schedule',
      title: 'Save Time',
      blurb: 'Compare options quickly and pick what fits your workflow.',
    },
    {
      icon: 'groups',
      title: 'Community Driven',
      blurb: 'Rankings and insights shaped by the people who use AI daily.',
    },
  ] as const;

  protected readonly steps = [
    {
      n: '1',
      title: 'Discover tools',
      text: 'Browse curated listings by use case, category, and community rating.',
    },
    {
      n: '2',
      title: 'Compare and review',
      text: 'See side-by-side details and read reviews from real users.',
    },
    {
      n: '3',
      title: 'Choose the best for your needs',
      text: 'Shortlist winners, share feedback, and stay updated as tools evolve.',
    },
  ] as const;

  ngOnInit(): void {
    this.loadTools(undefined);
  }

  protected onCategoryChange(categoryId: number | null): void {
    this.loadTools(categoryId ?? undefined);
  }

  private loadTools(categoryId?: number): void {
    this.toolsLoading.set(true);
    this.toolsError.set(false);
    this.toolsApi.getTools(categoryId).subscribe({
      next: (list) => {
        this.tools.set(list);
        this.toolsLoading.set(false);
      },
      error: () => {
        this.toolsError.set(true);
        this.toolsLoading.set(false);
      },
    });
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.headerScrolled.set(window.scrollY > 10);
  }

  protected onBrandClick(event: Event): void {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected scrollToFeatured(): void {
    this.scrollToSection('featured-tools');
  }

  protected onSubmitTool(): void {
    this.snackBar.open(
      'Tool submissions are coming soon — thanks for your interest!',
      'Got it',
      { duration: 4500 },
    );
  }

  protected onEarlyAccess(): void {
    const value = this.email.trim();
    if (!value) {
      this.snackBar.open('Please add your email address.', 'OK', { duration: 3500 });
      return;
    }
    this.snackBar.open(
      "You're on the early-access list (demo). We'll be in touch!",
      'Great',
      { duration: 5000 },
    );
  }
}
