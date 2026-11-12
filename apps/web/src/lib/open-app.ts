/**
 * Loads the app from the start. Used after moving into another organisation, so nothing from the one just left stays
 * on screen or in the cache. The address is made absolute on purpose: this is a full load, not a client navigation.
 */
export function openApp(locale: string): void {
  window.location.assign(new URL(`/${locale}`, window.location.origin).href);
}
