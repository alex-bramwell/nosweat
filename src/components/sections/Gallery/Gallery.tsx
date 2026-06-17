import { useState } from 'react';
import { Section, Container, EmptyStatePreview } from '../../common';
import { useBrandingWithOverrides } from '../../../hooks/useBrandingWithOverrides';
import { useIsBuilder } from '../../../contexts/BrandingOverrideContext';
import type { GalleryItem } from '../../../types/tenant';
import styles from './Gallery.module.scss';

// Turn a video link into something embeddable: YouTube/Vimeo -> iframe, a direct
// file (mp4/webm) -> <video>.
function resolveVideo(url: string): { kind: 'iframe' | 'video'; src: string } {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return { kind: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}` };
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { kind: 'video', src: url };
}

const MediaTile = ({ item }: { item: GalleryItem }) => {
  if (item.type === 'video') {
    const v = resolveVideo(item.url);
    return v.kind === 'iframe' ? (
      <iframe
        className={styles.galleryMedia}
        src={v.src}
        title="Gym video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    ) : (
      <video className={styles.galleryMedia} src={v.src} controls playsInline preload="metadata" />
    );
  }
  return <img className={styles.galleryMedia} src={item.url} alt="" loading="lazy" />;
};

const SAMPLE_ITEMS: GalleryItem[] = [
  { type: 'image', url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600&q=80' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80' },
  { type: 'image', url: 'https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=600&q=80' },
];

const Carousel = ({ items }: { items: GalleryItem[] }) => {
  const [index, setIndex] = useState(0);
  const count = items.length;
  const go = (dir: -1 | 1) => setIndex((i) => (i + dir + count) % count);

  return (
    <div className={styles.carousel}>
      <div className={styles.carouselViewport}>
        <div className={styles.carouselTrack} style={{ transform: `translateX(-${index * 100}%)` }}>
          {items.map((item, i) => (
            <div key={i} className={styles.carouselSlide}>
              <MediaTile item={item} />
            </div>
          ))}
        </div>
      </div>
      <button type="button" className={`${styles.carouselArrow} ${styles.carouselPrev}`} aria-label="Previous" onClick={() => go(-1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <button type="button" className={`${styles.carouselArrow} ${styles.carouselNext}`} aria-label="Next" onClick={() => go(1)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>
      <div className={styles.carouselDots}>
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.carouselDot} ${i === index ? styles.carouselDotActive : ''}`}
            aria-label={`Go to item ${i + 1}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
};

const Gallery = () => {
  const branding = useBrandingWithOverrides();
  const isBuilder = useIsBuilder();

  const realItems = branding.gallery_items ?? [];
  const items = realItems.length > 0 ? realItems : (isBuilder ? SAMPLE_ITEMS : []);
  if (items.length === 0) return null;

  const photoCount = items.filter((i) => i.type === 'image').length;
  // Carousel is only used when the owner turned it on AND there are enough photos.
  const useCarousel = branding.gallery_layout === 'carousel' && photoCount > 3;

  const content = (
    <Section spacing="relaxed" background="surface" className={styles.gallerySection}>
      <Container>
        <h2 className={styles.galleryHeading}>Gallery</h2>
        {useCarousel ? (
          <Carousel items={items} />
        ) : (
          <div className={styles.galleryGrid}>
            {items.map((item, i) => (
              <div key={i} className={styles.galleryTile}>
                <MediaTile item={item} />
              </div>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );

  if (realItems.length === 0 && isBuilder) {
    return (
      <EmptyStatePreview
        title="Gallery"
        description="Show off your space, classes and community. Add photos (and one video) from the builder, and switch to a carousel once you have more than 3 photos."
      >
        {content}
      </EmptyStatePreview>
    );
  }

  return content;
};

export default Gallery;
