const BASE_URL = 'https://image.tmdb.org/t/p';
const RESOLUTION = 'w500';

/**
 * Get the full URL for an image on The Movie DB.
 * @param slug The URL slug for the image
 * @returns The full url
 */
export const getImageUrl = (slug: string) => `${BASE_URL}/${RESOLUTION}${slug}`;
