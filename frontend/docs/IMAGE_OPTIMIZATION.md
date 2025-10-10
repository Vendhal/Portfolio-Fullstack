# Image Optimization Guide

## Overview
This project includes a comprehensive image optimization system that provides:
- Responsive image loading with WebP support
- Lazy loading with Intersection Observer
- Progressive loading with blur-to-sharp effect
- Optimized image components for React

## Components

### OptimizedImage
A React component that automatically optimizes image loading:

```tsx
import OptimizedImage from './components/OptimizedImage';

<OptimizedImage
  src="/images/photo.jpg"
  alt="Description"
  width={800}
  height={600}
  loading="lazy"
  priority={false}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### ImageGallery
A responsive image gallery component:

```tsx
import ImageGallery from './components/ImageGallery';

const images = [
  { src: '/images/1.jpg', alt: 'Image 1', caption: 'Caption' },
  { src: '/images/2.jpg', alt: 'Image 2' }
];

<ImageGallery images={images} columns={3} gap={16} />
```

## Features

### 1. WebP Support Detection
- Automatically detects browser WebP support
- Falls back to original format when necessary

### 2. Responsive Images
- Generates srcset for multiple screen sizes
- Uses appropriate image sizes based on viewport
- Configurable breakpoints and sizes

### 3. Lazy Loading
- Uses Intersection Observer API for performance
- Loads images when they enter the viewport
- Configurable root margin and threshold

### 4. Progressive Loading
- Shows blur placeholder while loading
- Smooth transition to sharp image
- Error state handling

### 5. Performance Optimizations
- Priority loading for above-the-fold images
- Preconnect hints for external image domains
- Proper image decoding attributes

## Image Optimization Script

Run the image optimization script to process your images:

```bash
npm run optimize-images
```

This script will:
- Process images in the specified directory
- Generate responsive variants
- Convert to optimized formats
- Report file size savings

## Best Practices

### 1. Image Formats
- Use WebP for modern browsers
- Fallback to JPEG/PNG for compatibility
- Use appropriate quality settings (80-90% for photos)

### 2. Responsive Images
- Provide multiple sizes for different viewports
- Use appropriate `sizes` attribute
- Consider pixel density for high-DPI displays

### 3. Loading Strategy
- Use `priority={true}` for above-the-fold images
- Use `loading="lazy"` for below-the-fold images
- Implement proper error handling

### 4. Performance
- Minimize initial image payload
- Use progressive JPEG for large images
- Optimize SVGs and remove unnecessary metadata

## Configuration

### Vite Configuration
Add image optimization to your Vite build:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [
    // ... other plugins
  ],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
});
```

### Image Directories
```
public/
  images/          # Static images
    original/      # Source images
    optimized/     # Processed images
    icons/         # App icons
src/
  assets/
    images/        # Component-specific images
```

## Browser Support

### Features Used:
- Intersection Observer API (polyfill available)
- Picture element and srcset
- WebP format detection
- CSS object-fit

### Fallbacks:
- Placeholder images for unsupported formats
- Graceful degradation for older browsers
- CSS fallbacks for unsupported properties

## Performance Metrics

### Core Web Vitals Impact:
- **LCP (Largest Contentful Paint)**: Optimized through priority loading and responsive images
- **CLS (Cumulative Layout Shift)**: Prevented with proper aspect ratios and placeholders
- **FID (First Input Delay)**: Improved through lazy loading and reduced bundle size

### Monitoring:
- Use browser DevTools to monitor loading performance
- Implement performance monitoring for image metrics
- Track WebP adoption rates

## Future Enhancements

1. **Image CDN Integration**: Connect with services like Cloudinary or ImageKit
2. **Advanced Formats**: Support for AVIF and other next-gen formats
3. **Machine Learning**: Implement smart cropping and optimization
4. **Build-time Optimization**: Generate optimized images during build process
5. **Service Worker Caching**: Cache optimized images for offline usage