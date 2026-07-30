export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  return /^\+?[1-9]\d{1,14}$/.test(phone);
}

export function validateFamilyName(name: string): boolean {
  return name.trim().length >= 2;
}
