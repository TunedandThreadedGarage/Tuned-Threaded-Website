import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { GarageExperience } from "@/components/garage/GarageExperience";
import { ProductDetail } from "@/features/store/components/ProductDetail";
import {
  fetchRelatedProducts,
  fetchStoreProductByHandle,
} from "@/lib/shopify/store-catalog";

export const revalidate = 60;

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props) {
  const { handle } = await params;
  const product = await fetchStoreProductByHandle(handle);
  if (!product) return { title: "Product — Tuned & Threaded" };
  return {
    title: `${product.title} — Tuned & Threaded`,
    description: product.descriptionHtml
      ? product.descriptionHtml.replace(/<[^>]+>/g, "").slice(0, 160)
      : `${product.title} from ${product.vendor}`,
  };
}

export default async function StoreProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await fetchStoreProductByHandle(handle);
  if (!product) notFound();
  const related = await fetchRelatedProducts(product, 4);

  return (
    <GarageExperience>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-5 pb-24 pt-24 md:px-8 md:pt-28 lg:px-10">
        <ProductDetail product={product} related={related} />
      </main>
      <SiteFooter />
    </GarageExperience>
  );
}
