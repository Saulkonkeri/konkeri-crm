import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Aquí bloqueamos el paso a tus zonas privadas:
      disallow: ['/api/', '/crm/', '/radar/', '/privado/'], 
    },
    sitemap: 'https://arienzoliving.com/sitemap.xml',
  }
}