/**
 * Helper to generate official WhatsApp Click-to-Chat URL
 * Requirement:
 * - Remove spaces, hyphens, brackets, plus signs
 * - Include country calling code (e.g., 91 for India)
 * - Message body must contain ONLY the clickable invitation link (no greetings, no credentials, no extra text)
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  let clean = String(phone).replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    clean = `91${clean}`;
  }
  return clean;
}

export function generateWhatsAppInvitation({ whatsappNumber, token, fullUrl = null }) {
  const formattedNumber = formatPhoneNumber(whatsappNumber);
  const baseUrl = fullUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const invitationLink = `${baseUrl}/vendor-invitation/${token}`;
  
  // The message body MUST contain ONLY the clickable invitation link
  const encodedText = encodeURIComponent(invitationLink);
  const clickToChatUrl = `https://wa.me/${formattedNumber}?text=${encodedText}`;

  return {
    clickToChatUrl,
    invitationLink,
    formattedNumber,
  };
}

export function openWhatsApp(clickToChatUrl) {
  if (typeof window !== 'undefined' && clickToChatUrl) {
    window.open(clickToChatUrl, '_blank', 'noopener,noreferrer');
  }
}
