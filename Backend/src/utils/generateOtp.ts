import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Masks a phone number for safe logging.
 * Shows only the first 2 and last 2 digits.
 */
export const maskPhone = (phone: string): string => {
  if (phone.length <= 4) {
    return phone.slice(0, 2) + "***";
  }
  return phone.slice(0, 2) + "*".repeat(phone.length - 4) + phone.slice(-2);
};

/**
 * Generates a cryptographically secure 4-digit OTP.
 */
export const generateOTP = (): string => {
  const min = 1000;
  const max = 9999;
  return String(crypto.randomInt(min, max + 1));
};

/**
 * Hashes an OTP using bcrypt with salt for secure storage.
 */
export const hashOTP = async (otp: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(otp, saltRounds);
};

/**
 * Verifies a raw OTP against a stored bcrypt hash.
 */
export const verifyOTP = async (
  otp: string,
  storedHash: string,
): Promise<boolean> => {
  return bcrypt.compare(otp, storedHash);
};

/**
 * Normalizes an Indian phone number.
 */
export const normalizePhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");

  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.slice(1);
  }

  if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }

  return cleaned;
};

/**
 * Validates that a phone number is a valid Indian mobile number.
 */
export const isValidIndianPhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone);
};

/**
 * Validates that an OTP string is exactly 4 digits.
 */
export const isValidOTP = (otp: string): boolean => {
  return /^\d{4}$/.test(otp);
};
