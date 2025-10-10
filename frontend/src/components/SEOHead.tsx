import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: Record<string, any>;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const seoDefaults = {
  title: 'Team Portfolio | Full-Stack Developers',
  description: 'Meet our talented team of full-stack developers. Explore our projects, expertise, and contact information.',
  image: '/images/og-default.jpg',
  url: 'https://example.com',
  type: 'website',
  keywords: ['portfolio', 'developers', 'react', 'typescript', 'full-stack'],
  author: 'Team Portfolio'
};

const SEOHead = ({
  title = seoDefaults.title,
  description = seoDefaults.description,
  image = seoDefaults.image,
  url = seoDefaults.url,
  type = seoDefaults.type,
  schema,
  keywords = seoDefaults.keywords,
  author = seoDefaults.author,
  publishedTime,
  modifiedTime
}: SEOProps) => {
  const fullImageUrl = image.startsWith('http') ? image : `${url}${image}`;
  const keywordsString = keywords.join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      <meta name="author" content={author} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Team Portfolio" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@teamportfolio" />
      <meta name="twitter:creator" content="@teamportfolio" />

      {/* Article specific meta tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Additional SEO meta tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Performance and security */}
      <meta name="referrer" content="no-referrer-when-downgrade" />
      <meta httpEquiv="x-ua-compatible" content="ie=edge" />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;