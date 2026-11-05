/**
 * Simple phone parser fallback matching your express-validator check.
 */
export const parseAuthPhone = (phone: string, country?: string): boolean => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
};
