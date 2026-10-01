import type { MetadataRoute } from "next";

const siteUrl = "https://www.allcom.com.tw";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/services", "/about", "/portfolio", "/news", "/contact"];
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}
