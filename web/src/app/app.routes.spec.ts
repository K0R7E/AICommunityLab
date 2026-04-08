import { routes } from './app.routes';
import { LandingPage } from './landing-page/landing-page';

describe('app routes', () => {
  it('should map default path to LandingPage', () => {
    const home = routes.find((r) => r.path === '');
    expect(home).toBeDefined();
    expect(home?.component).toBe(LandingPage);
  });
});
