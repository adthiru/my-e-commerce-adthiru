// Credit card validation utilities

// Validate card number - must be exactly 16 digits
export const validateCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, "");
  return /^\d{16}$/.test(cleaned);
};

// Get card type from number
export const getCardType = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s/g, "");
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
  };

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleaned)) return type;
  }
  return "unknown";
};

// Validate expiry date (MM/YY format)
export const validateExpiry = (expiry) => {
  const match = expiry.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt("20" + match[2], 10);

  if (month < 1 || month > 12) return false;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
};

// Validate CVV
export const validateCVV = (cvv, cardType) => {
  const length = cardType === "amex" ? 4 : 3;
  return new RegExp(`^\\d{${length}}$`).test(cvv);
};

// Format card number with spaces
export const formatCardNumber = (value) => {
  const cleaned = value.replace(/\D/g, "");
  const groups = cleaned.match(/.{1,4}/g);
  return groups ? groups.join(" ") : cleaned;
};

// Format expiry date
export const formatExpiry = (value) => {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length >= 2) {
    return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
  }
  return cleaned;
};

// Address validation
export const validateAddress = (address) => {
  const errors = {};

  if (!address.title || address.title.length < 2) {
    errors.title = "Address title is required";
  }
  if (!address.full_address || address.full_address.length < 10) {
    errors.full_address = "Please enter a complete address";
  }
  if (!address.city || address.city.length < 2) {
    errors.city = "City is required";
  }
  if (!address.region || address.region.length < 2) {
    errors.region = "Region/State is required";
  }
  if (!address.zipcode || !/^\d{5}(-\d{4})?$/.test(address.zipcode)) {
    errors.zipcode = "Valid ZIP code is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
