import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Skip the API proxy paths, Next internals and files with an extension.
  matcher: '/((?!api|v1|_next|_vercel|.*\\..*).*)',
};
