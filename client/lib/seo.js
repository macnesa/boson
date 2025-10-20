import { SITE } from "./constants";

export const defaultSEO = {
  title: SITE.name,
  description: SITE.description,
  openGraph: {
    type: "website",
    url: SITE.url,
    title: SITE.name,
    description: SITE.description,
    images: [{ url: `${SITE.url}/boson.png`, width: 800, height: 600 }],
  },
};

export function generateMetadata(custom = {}) {
  return {
    ...defaultSEO,
    ...custom,
  };
}



