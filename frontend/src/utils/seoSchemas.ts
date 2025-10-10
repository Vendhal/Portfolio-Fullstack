// Structured data schemas for SEO
export const generatePersonSchema = (member: any) => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "name": member.name,
  "jobTitle": member.role,
  "description": member.bio,
  "image": member.image,
  "url": `https://example.com/member/${member.slug}`,
  "sameAs": [
    member.contact.linkedin,
    member.contact.github
  ],
  "email": member.contact.email,
  "worksFor": {
    "@type": "Organization",
    "name": "Team Portfolio",
    "url": "https://example.com"
  }
});

export const generateOrganizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Team Portfolio",
  "description": "A talented team of full-stack developers creating amazing projects",
  "url": "https://example.com",
  "logo": "https://example.com/icons/icon-512x512.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "hello@example.com"
  },
  "sameAs": [
    "https://github.com/team",
    "https://twitter.com/teamportfolio"
  ]
});

export const generateWebsiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Team Portfolio",
  "description": "Portfolio website showcasing our development team and projects",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://example.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
});

export const generateBreadcrumbSchema = (items: Array<{name: string; url: string}>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
});

export const generateCollectionPageSchema = (title: string, description: string, url: string) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": title,
  "description": description,
  "url": url,
  "isPartOf": {
    "@type": "WebSite",
    "name": "Team Portfolio",
    "url": "https://example.com"
  }
});