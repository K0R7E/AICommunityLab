import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { FeatureCard } from './feature-card';

describe('FeatureCard', () => {
  let fixture: ComponentFixture<FeatureCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureCard],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureCard);
    fixture.componentRef.setInput('icon', 'inventory_2');
    fixture.componentRef.setInput('title', 'Curated AI Tools');
    fixture.componentRef.setInput('blurb', 'Short description.');
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render title and blurb', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('.title');
    const blurb = fixture.nativeElement.querySelector('.blurb');
    expect(title?.textContent?.trim()).toBe('Curated AI Tools');
    expect(blurb?.textContent?.trim()).toBe('Short description.');
  });

  it('should render material icon text for ligature', () => {
    fixture.detectChanges();
    const icon = fixture.debugElement.query(By.css('.icon-wrap mat-icon'));
    expect(icon.nativeElement.textContent?.trim()).toBe('inventory_2');
  });

  it('should omit blurb paragraph when blurb is empty', () => {
    fixture.componentRef.setInput('blurb', '');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.blurb')).toBeNull();
  });

  it('should use mat-card with feature-card class', () => {
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('mat-card.feature-card');
    expect(card).toBeTruthy();
  });
});
