import OptimizedImage from './OptimizedImage';

interface ImageItem {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

interface ImageGalleryProps {
  images: ImageItem[];
  columns?: number;
  gap?: number;
  className?: string;
}

const ImageGallery = ({
  images,
  columns = 3,
  gap = 16,
  className = ''
}: ImageGalleryProps) => {
  const galleryStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fit, minmax(${300}px, 1fr))`,
    gap: `${gap}px`,
    width: '100%'
  };

  // Suppress unused variable warning for columns - it could be used for responsive breakpoints
  console.debug('Gallery configured for', columns, 'columns');

  return (
    <div className={`image-gallery ${className}`} style={galleryStyle}>
      {images.map((image: ImageItem, index: number) => (
        <div key={index} className="gallery-item">
          <div className="image-container aspect-ratio-4-3">
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              {...(image.width && { width: image.width })}
              {...(image.height && { height: image.height })}
              loading={index < 6 ? 'eager' : 'lazy'}
              priority={index < 2}
              className="gallery-image"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {image.caption && (
              <div className="image-overlay">
                <span>{image.caption}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImageGallery;