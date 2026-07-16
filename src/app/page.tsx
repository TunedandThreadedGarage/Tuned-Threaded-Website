import { HomeClient } from "@/components/home/HomeClient";
import {
  getShopCollections,
  getShopProducts,
} from "@/lib/shopify/catalog";

export default async function Home() {
  const [products, collections] = await Promise.all([
    getShopProducts(8),
    getShopCollections(4),
  ]);

  return <HomeClient products={products} collections={collections} />;
}
