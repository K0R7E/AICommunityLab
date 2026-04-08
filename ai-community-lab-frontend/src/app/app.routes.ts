import { Routes } from '@angular/router';

import { LandingPage } from './landing-page/landing-page';
import { ToolDetail } from './tool-detail/tool-detail';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'tools/:toolId', component: ToolDetail },
];
