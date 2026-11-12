/** The picture types accepted as the company logo. An SVG is left out on purpose: it can carry scripts. */
export const LOGO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const;

export type LogoExtension = (typeof LOGO_EXTENSIONS)[number];

/** The biggest logo accepted, in bytes. */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** How long the link to the logo works, in seconds. The web app asks again when it needs the picture. */
export const LOGO_LINK_SECONDS = 300;

/** The logo as shown, from `GET /v1/company-logo`. */
export interface CompanyLogoResponse {
  /** Null while no logo is set, or while file storage is not set up. */
  logo: {
    /** A short-lived link to the picture. */
    url: string;
    fileName: string;
    /** When the logo was last changed. */
    updatedAt: string;
  } | null;
}
