/**
 * Extract dominant colors from an image URL using canvas pixel sampling.
 * Returns a palette mapped to branding roles (accent, secondary, bg, etc.)
 */

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface ExtractedPalette {
  color_accent: string;
  color_accent2: string;
  color_secondary: string;
  color_secondary2: string;
  color_specialty: string;
}

function rgbToHex({ r, g, b }: RGBColor): string {
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

function colorDistance(a: RGBColor, b: RGBColor): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function getSaturation({ r, g, b }: RGBColor): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max === 0) return 0;
  return (max - min) / max;
}

function getLightness({ r, g, b }: RGBColor): number {
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
}

function isNearGray({ r, g, b }: RGBColor): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return (max - min) < 30;
}

/** Simple k-means clustering to find dominant colors */
function kMeans(pixels: RGBColor[], k: number, iterations = 10): RGBColor[] {
  if (pixels.length <= k) return pixels;

  // Initialize centroids by picking evenly spaced pixels
  const step = Math.floor(pixels.length / k);
  let centroids = Array.from({ length: k }, (_, i) => ({ ...pixels[i * step] }));

  for (let iter = 0; iter < iterations; iter++) {
    // Assign pixels to nearest centroid
    const clusters: RGBColor[][] = Array.from({ length: k }, () => []);
    for (const px of pixels) {
      let minDist = Infinity;
      let closest = 0;
      for (let c = 0; c < k; c++) {
        const d = colorDistance(px, centroids[c]);
        if (d < minDist) {
          minDist = d;
          closest = c;
        }
      }
      clusters[closest].push(px);
    }

    // Update centroids
    centroids = clusters.map((cluster, i) => {
      if (cluster.length === 0) return centroids[i];
      return {
        r: Math.round(cluster.reduce((s, p) => s + p.r, 0) / cluster.length),
        g: Math.round(cluster.reduce((s, p) => s + p.g, 0) / cluster.length),
        b: Math.round(cluster.reduce((s, p) => s + p.b, 0) / cluster.length),
      };
    });
  }

  return centroids;
}

function lighten(color: RGBColor, amount: number): RGBColor {
  return {
    r: Math.min(255, Math.round(color.r + (255 - color.r) * amount)),
    g: Math.min(255, Math.round(color.g + (255 - color.g) * amount)),
    b: Math.min(255, Math.round(color.b + (255 - color.b) * amount)),
  };
}

function darken(color: RGBColor, amount: number): RGBColor {
  return {
    r: Math.max(0, Math.round(color.r * (1 - amount))),
    g: Math.max(0, Math.round(color.g * (1 - amount))),
    b: Math.max(0, Math.round(color.b * (1 - amount))),
  };
}

export async function extractPaletteFromImage(imageUrl: string): Promise<ExtractedPalette | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 64; // Sample at small size for performance
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size).data;

        // Sample pixels, skip near-white, near-black, and transparent
        const pixels: RGBColor[] = [];
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          // Skip transparent, near-white, near-black
          if (a < 128) continue;
          const lightness = getLightness({ r, g, b });
          if (lightness > 0.92 || lightness < 0.08) continue;

          pixels.push({ r, g, b });
        }

        if (pixels.length < 10) { resolve(null); return; }

        // Extract 8 clusters
        const clusters = kMeans(pixels, 8);

        // Separate chromatic and achromatic colors
        const chromatic = clusters.filter((c) => !isNearGray(c));
        const all = chromatic.length >= 2 ? chromatic : clusters;

        // Sort by saturation * (1 - extreme lightness) to find the most vibrant
        const scored = all
          .map((c) => ({
            color: c,
            score: getSaturation(c) * (1 - Math.abs(getLightness(c) - 0.5) * 1.5),
          }))
          .sort((a, b) => b.score - a.score);

        const primary = scored[0]?.color || clusters[0];
        // Pick secondary as the most different vibrant color from primary
        const secondary = scored
          .slice(1)
          .sort((a, b) => colorDistance(b.color, primary) - colorDistance(a.color, primary))[0]?.color
          || scored[1]?.color
          || lighten(primary, 0.3);

        resolve({
          color_accent: rgbToHex(primary),
          color_accent2: rgbToHex(lighten(primary, 0.2)),
          color_secondary: rgbToHex(secondary),
          color_secondary2: rgbToHex(lighten(secondary, 0.2)),
          color_specialty: rgbToHex(
            scored[2]?.color || darken(primary, 0.2)
          ),
        });
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
