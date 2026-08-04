// Mirrors customer_node's src/helpers/upiValidation.js — kept in sync so the
// frontend rejects the same invalid UPI IDs the backend would, instead of
// showing "valid" and then failing (or worse, silently accepting) server-side.
//
// The old check (/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/) only verified
// "name@word" shape, so something like "jgf@jyg" passed even though "jyg"
// isn't an actual UPI PSP/bank handle and could never receive a payout.
export const KNOWN_UPI_HANDLES = new Set([
  // PhonePe
  'ybl', 'ibl', 'axl', 'waaxis', 'waicici', 'wahdfcbank', 'wasbi',
  // Google Pay
  'okhdfcbank', 'okicici', 'oksbi', 'okaxis', 'okbizaxis',
  // Paytm
  'paytm', 'ptaxis', 'ptsbi', 'pthdfc', 'pyzee',
  // Amazon Pay
  'apl', 'yapl',
  // BHIM / NPCI
  'upi', 'yapi',
  // Public sector banks
  'sbi', 'pnb', 'cnrb', 'barodampay', 'unionbankofindia', 'unionbank',
  'centralbank', 'idbi', 'boi', 'ucobank', 'iob', 'psib', 'mahb',
  // Private banks
  'icici', 'hdfcbank', 'axisbank', 'kotak', 'yesbank', 'idfcbank',
  'indus', 'induslnd', 'federal', 'fbl', 'rbl', 'dbs', 'kvb', 'karb',
  'jkb', 'sib', 'tjsb', 'dcb', 'csb', 'bandhan',
  // Other fintech / small finance banks
  'jio', 'jiopay', 'airtel', 'fam', 'slice', 'freecharge', 'cub',
  'equitas', 'ujjivan', 'au', 'esaf', 'utkarsh', 'jupiteraxis',
]);

/**
 * Returns true only if `value` is shaped like a UPI ID (local-part@handle)
 * AND the handle is one of the known real PSP/bank handles.
 */
export const isValidUpiId = (value) => {
  const upiId = String(value || '').trim();
  const match = /^[\w.\-]{2,256}@([a-zA-Z]{2,64})$/.exec(upiId);
  if (!match) return false;
  return KNOWN_UPI_HANDLES.has(match[1].toLowerCase());
};