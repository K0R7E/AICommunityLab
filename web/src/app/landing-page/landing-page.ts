import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FeatureCard } from '../feature-card/feature-card';
import type { AiToolPreview } from '../tool-card/tool-model';
import { ToolCard } from '../tool-card/tool-card';

@Component({
  selector: 'app-landing-page',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatSnackBarModule,
    FeatureCard,
    ToolCard,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {
  private readonly snackBar = inject(MatSnackBar);

  protected email = '';
  protected readonly headerScrolled = signal(false);
  protected readonly highlightedTool = signal<string | null>(null);

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

  protected readonly tools: AiToolPreview[] = [
    {
      name: 'ClarityWrite',
      description: 'Long-form drafting with tone control and source-aware suggestions.',
      category: 'Writing',
      rating: 4.6,
    },
    {
      name: 'VisionParse',
      description: 'Extract tables and text from PDFs and scans with high accuracy.',
      category: 'Productivity',
      rating: 4.3,
    },
    {
      name: 'CodePilot',
      description: 'Context-aware coding help inside your editor with repo awareness.',
      category: 'Development',
      rating: 4.8,
    },
    {
      name: 'VoiceFlow',
      description: 'Natural voices and SSML controls for narration and accessibility.',
      category: 'Audio',
      rating: 4.1,
    },
    {
      name: 'DataMind',
      description: 'Ask questions of spreadsheets and SQL without writing queries.',
      category: 'Data',
      rating: 4.5,
    },
    {
      name: 'ImageCraft',
      description: 'Generate and refine visuals with consistent brand-safe styles.',
      category: 'Creative',
      rating: 4.7,
    },
  ];

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

  protected toggleToolHighlight(name: string): void {
    this.highlightedTool.update((current) => (current === name ? null : name));
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
