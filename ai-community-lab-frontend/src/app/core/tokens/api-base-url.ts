import { InjectionToken } from '@angular/core';

/** Backend origin without trailing slash, or '' to use the in-app mock layer. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
