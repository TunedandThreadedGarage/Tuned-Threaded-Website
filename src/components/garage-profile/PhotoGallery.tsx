import Image from "next/image";
import type { GarageAlbum, GaragePhoto } from "@/types/database";
import { BeforeAfterCompare } from "@/components/garage-profile/BeforeAfterCompare";
import { ReportButton } from "@/features/moderation/components/ReportButton";
import { GalleryLikeButton } from "@/features/gallery/components/GalleryLikeButton";

export function PhotoGallery({
  albums,
  photos,
  ownerUserId,
}: {
  albums: GarageAlbum[];
  photos: GaragePhoto[];
  ownerUserId?: string;
}) {
  if (albums.length === 0) {
    return <p className="text-sm text-text-muted">No public albums yet.</p>;
  }

  return (
    <div className="space-y-10">
      {albums.map((album) => {
        const albumPhotos = photos.filter((p) => p.album_id === album.id);
        const beforeAfter = albumPhotos.filter(
          (p) => p.category === "before_after" || album.category === "before_after",
        );

        return (
          <section key={album.id}>
            <div className="mb-3">
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-text">
                {album.name}
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-metal">
                {album.category.replace("_", " ")}
              </p>
            </div>

            {beforeAfter.length >= 2 ? (
              <div className="mb-4">
                <BeforeAfterCompare
                  beforeUrl={beforeAfter[0].url}
                  afterUrl={beforeAfter[1].url}
                />
              </div>
            ) : null}

            {albumPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {albumPhotos.map((photo) => (
                  <figure
                    key={photo.id}
                    className="group relative aspect-square overflow-hidden border border-border bg-surface-elevated"
                  >
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? ""}
                      fill
                      className="object-cover"
                      sizes="25vw"
                    />
                    {photo.caption ? (
                      <figcaption className="absolute inset-x-0 bottom-0 bg-bg/70 px-2 py-1 text-[10px] text-text">
                        {photo.caption}
                      </figcaption>
                    ) : null}
                    <div className="absolute right-1 top-1 flex flex-col items-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <GalleryLikeButton photoId={photo.id} />
                      {ownerUserId ? (
                        <ReportButton
                          targetType="gallery_photo"
                          targetId={photo.id}
                          targetUserId={ownerUserId}
                          label="Report"
                          className="bg-black/60 px-2 py-1 text-[10px] text-white hover:text-accent"
                        />
                      ) : null}
                    </div>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">Empty album.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
