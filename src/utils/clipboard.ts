/**
 * Copies a card number to clipboard, stripping whitespace
 * @param cardNumber - The card number with spaces
 * @returns Promise that resolves when copy is complete
 */
export const copyCardNumberToClipboard = async (
  cardNumber: string
): Promise<string> => {
  const digitsOnly = cardNumber.replace(/\s+/g, "");

  try {
    await navigator.clipboard.writeText(digitsOnly);
    return digitsOnly;
  } catch {
    // Fallback: create temporary input element
    const input = document.createElement("input");
    input.value = digitsOnly;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    return digitsOnly;
  }
};
