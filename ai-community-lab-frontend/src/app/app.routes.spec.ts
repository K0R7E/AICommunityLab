import { routes } from './app.routes';
import { LandingPage } from './landing-page/landing-page';
import { ToolDetail } from './tool-detail/tool-detail';

describe('app routes', () => {
  it('should map default path to LandingPage', () => {
    const home = routes.find((r) => r.path === '');
    expect(home).toBeDefined();
    expect(home?.component).toBe(LandingPage);
  });

  it('should map tools/:toolId to ToolDetail', () => {
    const tool = routes.find((r) => r.path === 'tools/:toolId');
    expect(tool).toBeDefined();
    expect(tool?.component).toBe(ToolDetail);
  });
});
