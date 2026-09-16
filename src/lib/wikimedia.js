export const WIKIMEDIA_THUMBNAIL_WIDTHS = [
  120, 250, 330, 500, 960, 1280, 1920, 3840,
];

const THUMBNAIL_URL =
  /^(https:\/\/upload\.wikimedia\.org\/.+\/thumb\/.+)\/\d+px-([^/]+)$/;

export function isWikimediaThumbnail(src) {
  return THUMBNAIL_URL.test(src);
}

export function getWikimediaThumbnail(src, width) {
  const standardWidth =
    WIKIMEDIA_THUMBNAIL_WIDTHS.find((candidate) => candidate >= width) ??
    WIKIMEDIA_THUMBNAIL_WIDTHS[WIKIMEDIA_THUMBNAIL_WIDTHS.length - 1];

  return src.replace(THUMBNAIL_URL, `$1/${standardWidth}px-$2`);
}
