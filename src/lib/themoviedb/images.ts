const BASE_URL = 'https://image.tmdb.org/t/p';
const RESOLUTION = 'w500';

/** Image widths TMDB serves that the app uses: `w500` for posters and cards, `w1280` for full-width backdrops. */
export type ImageSize = 'w500' | 'w1280';

/**
 * Get the full URL for an image on The Movie DB.
 * @param slug The URL slug for the image
 * @param size The width to request; defaults to `w500`
 * @returns The full url
 */
export const getImageUrl = (slug: string, size: ImageSize = RESOLUTION) => `${BASE_URL}/${size}${slug}`;
