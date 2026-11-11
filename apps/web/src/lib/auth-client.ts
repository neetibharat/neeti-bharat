import { magicLinkClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

/** Talks to /api/auth on the web origin; the web server forwards it to the API. */
export const authClient = createAuthClient({ plugins: [magicLinkClient()] });
