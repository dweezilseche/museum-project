import QRCode from "qrcode";

// Render a string as a QR code PNG data URL, in the site's ink-on-paper palette.
export async function qrDataUrl(text) {
  return QRCode.toDataURL(String(text), {
    margin: 1,
    width: 240,
    color: { dark: "#16130fff", light: "#ffffffff" },
  });
}
