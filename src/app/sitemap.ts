import type { MetadataRoute } from "next";
import { newsWithPage } from "@/data/news";

const siteUrl = "https://www.allcom.com.tw";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/services",
    "/about",
    "/portfolio",
    "/news",
    "/tools",
    "/tools/distribution-room",
    "/tools/lightning",
    "/tools/water-supply",
    "/tools/fire-water",
    "/contact",
    ...newsWithPage.map((n) => `/news/${n.slug}`),
  ];
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}
