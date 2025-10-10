import { useState, useEffect, useRef, useCallback } from 'react';
import './OptimizedImage.css';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  quality?: number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Image format detection and WebP support
const supportsWebP = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('webp') > -1;
})();

// Generate responsive image URLs
const generateSrcSet = (src: string, _quality: number = 80) => {
  const widths = [320, 640, 1024, 1280, 1920];
  const extension = src.split('.').pop();
  const baseName = src.replace(`.${extension}`, '');
  
  return widths.map(width => {
    const format = supportsWebP ? 'webp' : extension;
    return `${baseName}_${width}w.${format} ${width}w`;
  }).join(', ');
};

// Intersection Observer hook for lazy loading
const useIntersectionObserver = (
  elementRef: React.RefObject<Element>,
  threshold: number = 0.1,
  rootMargin: string = '50px'
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsIntersecting(entry.isIntersecting);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [threshold, rootMargin]);

  return isIntersecting;
};

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  style = {},
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="100%25" height="100%25" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ELoading...%3C/text%3E%3C/svg%3E',
  quality = 80,
  loading = 'lazy',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  const imgRef = useRef<HTMLImageElement>(null);
  const isInView = useIntersectionObserver(imgRef, 0.1, '50px');

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  useEffect(() => {
    if ((priority || isInView || loading === 'eager') && !isLoaded && !hasError) {
      setCurrentSrc(src);
    }
  }, [isInView, src, priority, loading, isLoaded, hasError]);

  const imgStyle: React.CSSProperties = {
    ...style,
    opacity: isLoaded ? 1 : 0.3,
    transition: 'opacity 0.3s ease-in-out',
    filter: isLoaded ? 'none' : 'blur(4px)',
    ...(width && { width }),
    ...(height && { height })
  };

  if (hasError) {
    return (
      <div 
        className={`image-error ${className}`}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          color: '#666',
          fontSize: '14px',
          ...(width && { width }),
          ...(height && { height })
        }}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={currentSrc}
      srcSet={currentSrc === src ? generateSrcSet(src, quality) : undefined}
      sizes={currentSrc === src ? sizes : undefined}
      alt={alt}
      className={`optimized-image ${className} ${isLoaded ? 'loaded' : 'loading'}`}
      style={imgStyle}
      onLoad={handleLoad}
      onError={handleError}
      loading={priority ? 'eager' : loading}
      decoding="async"
    />
  );
};

export default OptimizedImage;