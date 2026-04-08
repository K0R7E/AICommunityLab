import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { StarRating } from './star-rating';

describe('StarRating', () => {
  let fixture: ComponentFixture<StarRating>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StarRating],
    }).compileComponents();

    fixture = TestBed.createComponent(StarRating);
  });

  it('should create', () => {
    fixture.componentRef.setInput('rating', 0);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render five star icons by default max', () => {
    fixture.componentRef.setInput('rating', 3);
    fixture.detectChanges();
    const icons = fixture.debugElement.queryAll(By.css('mat-icon'));
    expect(icons.length).toBe(5);
  });

  it('should expose aria-label with rating and max', () => {
    fixture.componentRef.setInput('rating', 4.2);
    fixture.componentRef.setInput('max', 5);
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('.star-rating') as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('4.2 out of 5 stars');
  });

  it('should show full stars for integer rating', () => {
    fixture.componentRef.setInput('rating', 3);
    fixture.detectChanges();
    const full = fixture.debugElement.queryAll(By.css('mat-icon.full'));
    const empty = fixture.debugElement.queryAll(By.css('mat-icon.empty'));
    expect(full.length).toBe(3);
    expect(empty.length).toBe(2);
  });

  it('should show a half star for fractional part >= 0.5', () => {
    fixture.componentRef.setInput('rating', 2.5);
    fixture.detectChanges();
    const half = fixture.debugElement.queryAll(By.css('mat-icon.half'));
    expect(half.length).toBe(1);
  });

  it('should clamp rating above max', () => {
    fixture.componentRef.setInput('rating', 99);
    fixture.componentRef.setInput('max', 5);
    fixture.detectChanges();
    const full = fixture.debugElement.queryAll(By.css('mat-icon.full'));
    expect(full.length).toBe(5);
  });

  it('should treat negative rating as zero stars filled', () => {
    fixture.componentRef.setInput('rating', -2);
    fixture.detectChanges();
    const full = fixture.debugElement.queryAll(By.css('mat-icon.full'));
    expect(full.length).toBe(0);
  });

  it('should respect custom max', () => {
    fixture.componentRef.setInput('rating', 2);
    fixture.componentRef.setInput('max', 3);
    fixture.detectChanges();
    const icons = fixture.debugElement.queryAll(By.css('mat-icon'));
    expect(icons.length).toBe(3);
  });
});
