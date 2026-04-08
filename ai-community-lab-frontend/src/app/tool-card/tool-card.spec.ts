import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { StarRating } from '../star-rating/star-rating';
import type { AiToolPreview } from './tool-model';
import { ToolCard } from './tool-card';

describe('ToolCard', () => {
  const mockTool: AiToolPreview = {
    id: 'test-tool',
    name: 'Test Tool',
    description: 'Does something useful.',
    category: 'Testing',
    rating: 4.25,
  };

  let fixture: ComponentFixture<ToolCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolCard],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ToolCard);
    fixture.componentRef.setInput('tool', mockTool);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render tool name, description, and category', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.name')?.textContent?.trim()).toBe('Test Tool');
    expect(fixture.nativeElement.querySelector('.desc')?.textContent?.trim()).toBe('Does something useful.');
    expect(fixture.nativeElement.querySelector('.category-chip')?.textContent?.trim()).toBe('Testing');
  });

  it('should format rating number with one decimal', () => {
    fixture.detectChanges();
    const num = fixture.nativeElement.querySelector('.rating-num')?.textContent?.trim();
    expect(num).toBe('4.3');
  });

  it('should embed star rating for tool rating', () => {
    fixture.detectChanges();
    const starDe = fixture.debugElement.query(By.css('app-star-rating'));
    expect(starDe).toBeTruthy();
    const starInstance = starDe.componentInstance as StarRating;
    expect(starInstance.rating()).toBe(4.25);
  });

  it('should update when tool input changes', () => {
    fixture.detectChanges();
    fixture.componentRef.setInput('tool', {
      ...mockTool,
      name: 'Renamed',
      rating: 5,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.name')?.textContent?.trim()).toBe('Renamed');
    expect(fixture.nativeElement.querySelector('.rating-num')?.textContent?.trim()).toBe('5.0');
  });
});
