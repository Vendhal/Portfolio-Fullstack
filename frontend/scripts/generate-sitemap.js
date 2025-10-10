import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SEO Configuration - importing JSON in ES modules
const seoConfigPath = path.join(__dirname, '../seo-config.json');
const seoConfig = JSON.parse(fs.readFileSync(seoConfigPath, 'utf8'));

// Site configuration
const SITE_URL = seoConfig.seo.siteUrl;
const PAGES = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/member/sai-sandeep', priority: '0.8', changefreq: 'monthly' },
  { url: '/member/jai-ganesh', priority: '0.8', changefreq: 'monthly' },
  { url: '/member/jayram-reddy', priority: '0.8', changefreq: 'monthly' },
  { url: '/dashboard', priority: '0.6', changefreq: 'weekly' }
];

function generateSitemap() {
  const currentDate = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  PAGES.forEach(page => {
    sitemap += `
  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  sitemap += `
</urlset>`;

  // Write sitemap to public directory
  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemap);
  console.log('✅ Sitemap generated successfully at public/sitemap.xml');
}

function generateRobotsTxt() {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Disallow admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /*.json$
Disallow: /src/
Disallow: /node_modules/

# Allow common crawlers
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Crawl delay
Crawl-delay: 1`;

  const publicDir = path.join(__dirname, '../public');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);
  console.log('✅ robots.txt generated successfully at public/robots.txt');
}

// Generate both files immediately
console.log('Starting SEO file generation...');
generateSitemap();
generateRobotsTxt();
console.log('🎉 SEO files generated successfully!');

export { generateSitemap, generateRobotsTxt };