/** Resolve a path under public/ against the Vite base (works on any Pages subpath). */
export const assetUrl = (p: string) => import.meta.env.BASE_URL + p;
