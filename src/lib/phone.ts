export function phoneDigits(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("52") && digits.length > 10) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("1") && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits;
}

export function isMexicanMobile(digits: string) {
  return /^\d{10}$/.test(digits);
}

export function formatPhone(digits: string) {
  if (!isMexicanMobile(digits)) return digits;
  return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
}

export function whatsappUrl(phone: string, text: string) {
  return `https://wa.me/52${phoneDigits(phone)}?text=${encodeURIComponent(text)}`;
}
