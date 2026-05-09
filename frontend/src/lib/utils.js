import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Validate Indonesian NPWP (Nomor Pokok Wajib Pajak)
 * Supports both formats:
 * - Legacy 15-digit: XX.XXX.XXX.X-XXX.XXX
 * - New 16-digit NIK-based: all digits
 */
export function validateNPWP(npwp) {
  if (!npwp || npwp.trim() === "") return { valid: true, message: "" }; // Optional field
  const digits = npwp.replace(/[.\-\s]/g, "");
  if (digits.length === 15) {
    // Legacy format: should match pattern
    const formatted = digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})$/,
      "$1.$2.$3.$4-$5.$6"
    );
    return { valid: true, formatted, digits, message: "" };
  }
  if (digits.length === 16) {
    // New NIK-based NPWP (all numbers)
    if (/^\d{16}$/.test(digits)) {
      return { valid: true, formatted: digits, digits, message: "" };
    }
  }
  if (digits.length === 0) return { valid: true, message: "" };
  return {
    valid: false,
    message: `NPWP harus 15 digit (XX.XXX.XXX.X-XXX.XXX) atau 16 digit NIK-based. Saat ini: ${digits.length} digit.`,
  };
}

/**
 * Format NPWP to display format (15-digit legacy only)
 */
export function formatNPWP(raw) {
  const digits = (raw || "").replace(/[.\-\s]/g, "");
  if (digits.length === 15) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{1})(\d{3})(\d{3})$/, "$1.$2.$3.$4-$5.$6");
  }
  return raw || "";
}

