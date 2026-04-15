import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { API_BASE_URL } from '../core/tokens/api-base-url';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
  let fixture: ComponentFixture<LandingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '' },
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LandingPage);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render site header with logo', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const img = el.querySelector('app-site-header .brand-logo') as HTMLImageElement | null;
    expect(img?.getAttribute('src')).toBe('/logo.png');
    expect(img?.alt).toContain('AI Community Lab');
    expect(el.querySelector('app-site-header .site-header')).toBeTruthy();
  });

  it('should render hero copy and CTAs', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.eyebrow')?.textContent?.trim()).toBe('Discover & compare with confidence');
    expect(el.querySelector('.hero-title')?.textContent?.trim()).toBe(
      'Discover the Best AI Tools That Actually Work',
    );
    expect(el.querySelector('.hero-sub')?.textContent?.replace(/\s+/g, ' ').trim()).toContain(
      'Explore, compare, and review',
    );
    const primary = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Explore Tools'));
    const secondary = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Submit a Tool'));
    expect(primary).toBeTruthy();
    expect(secondary).toBeTruthy();
  });

  it('should expose section anchors for in-page navigation', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('#why-us')).toBeTruthy();
    expect(el.querySelector('#featured-tools')).toBeTruthy();
    expect(el.querySelector('#how-it-works')).toBeTruthy();
    expect(el.querySelector('#join-community')).toBeTruthy();
  });

  it('should render four feature cards with expected titles', () => {
    fixture.detectChanges();
    const titles = fixture.debugElement.queryAll(By.css('app-feature-card .title'));
    const text = titles.map((t) => t.nativeElement.textContent?.trim());
    expect(text).toEqual([
      'Curated AI Tools',
      'Real Reviews',
      'Save Time',
      'Community Driven',
    ]);
  });

  it('should render tool cards from mock directory', () => {
    fixture.detectChanges();
    const names = fixture.debugElement.queryAll(By.css('app-tool-card .name'));
    expect(names.length).toBeGreaterThanOrEqual(6);
    expect(names[0].nativeElement.textContent?.trim()).toBe('ClarityWrite');
  });

  it('should render how-it-works steps', () => {
    fixture.detectChanges();
    const stepTitles = fixture.debugElement.queryAll(By.css('.step-title'));
    expect(stepTitles.length).toBe(3);
    expect(stepTitles[0].nativeElement.textContent?.trim()).toBe('Discover tools');
    expect(stepTitles[1].nativeElement.textContent?.trim()).toBe('Compare and review');
    expect(stepTitles[2].nativeElement.textContent?.trim()).toBe('Choose the best for your needs');
  });

  it('should render email capture section', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.cta-title')?.textContent?.trim()).toBe('Join the AI Community');
    expect(el.querySelector('.cta-sub')?.textContent?.trim()).toBe('Be the first to access new tools and features');
    expect(el.querySelector('input[type="email"]')).toBeTruthy();
    const submit = Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.includes('Get Early Access'));
    expect(submit?.getAttribute('type')).toBe('submit');
  });

  it('should render footer brand and links', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.footer-brand')?.textContent?.trim()).toBe('AI Community Lab');
    const links = el.querySelectorAll('.footer-nav a');
    expect(links.length).toBe(2);
    expect(links[0].textContent?.trim()).toBe('Privacy');
    expect(links[1].textContent?.trim()).toBe('Contact');
  });

  it('should scroll featured section into view when Explore Tools is clicked', () => {
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('#featured-tools') as HTMLElement;
    const scrollIntoView = vi.fn();
    section.scrollIntoView = scrollIntoView;
    const btn = fixture.nativeElement.querySelector('.cta-primary') as HTMLButtonElement;
    btn.click();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('should open snackbar when Submit a Tool is clicked', () => {
    fixture.detectChanges();
    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    const openSpy = vi.spyOn(snackBar, 'open').mockReturnValue({} as ReturnType<MatSnackBar['open']>);
    const btn = fixture.nativeElement.querySelector('.cta-secondary') as HTMLButtonElement;
    btn.click();
    expect(openSpy).toHaveBeenCalled();
    expect(openSpy.mock.calls[0][0]).toContain('coming soon');
    openSpy.mockRestore();
  });

  it('should not open snackbar when early access submitted with empty email', () => {
    const host = fixture.componentInstance as unknown as { email: string };
    host.email = '';
    fixture.detectChanges();
    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    const openSpy = vi.spyOn(snackBar, 'open').mockReturnValue({} as ReturnType<MatSnackBar['open']>);
    const submit = fixture.nativeElement.querySelector('.cta-submit') as HTMLButtonElement;
    submit.click();
    fixture.detectChanges();
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('should open snackbar when early access submitted with value', () => {
    const host = fixture.componentInstance as unknown as { email: string };
    host.email = 'early@example.com';
    fixture.detectChanges();

    const snackBar = fixture.debugElement.injector.get(MatSnackBar);
    const openSpy = vi.spyOn(snackBar, 'open').mockReturnValue({} as ReturnType<MatSnackBar['open']>);
    const submit = fixture.nativeElement.querySelector('.cta-submit') as HTMLButtonElement;
    submit.click();
    fixture.detectChanges();
    expect(openSpy).toHaveBeenCalled();
    expect(openSpy.mock.calls[0][0]).toContain('early-access');
    openSpy.mockRestore();
  });
});
