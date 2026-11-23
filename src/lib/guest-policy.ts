export const GUEST_COOKIE = "knowdose_guest";
export const GUEST_SESSION_SECONDS = 24 * 60 * 60;
export const GUEST_DAILY_RESPONSES = 20;

export function hasAIConsentAccess(signedIn: boolean, guest: boolean): boolean {
  return signedIn || guest;
}

export function canSaveToAccount(signedIn: boolean): boolean {
  return signedIn;
}