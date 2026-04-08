import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';

import { routes } from './app.routes';
import { API_BASE_URL } from './core/tokens/api-base-url';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        provideRouter(routes),
        { provide: API_BASE_URL, useValue: '' },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the landing hero title', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero-title')?.textContent).toContain('Discover the Best AI Tools');
  });

  it('should render router outlet and full landing content after navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
    expect(compiled.querySelectorAll('app-tool-card').length).toBeGreaterThanOrEqual(6);
    expect(compiled.querySelectorAll('app-feature-card').length).toBe(4);
    expect(compiled.querySelector('#featured-tools')).toBeTruthy();
    expect(compiled.querySelector('app-site-header .brand-logo')).toBeTruthy();
    expect(compiled.querySelector('#join-community')).toBeTruthy();
  });
});
