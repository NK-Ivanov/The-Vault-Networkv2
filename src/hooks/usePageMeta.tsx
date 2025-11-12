import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

export const usePageMeta = (meta: PageMeta) => {
  useEffect(() => {
    const baseUrl = 'https://vaultnet.work';
    const currentUrl = `${baseUrl}${window.location.pathname}`;

    // Update document title
    document.title = meta.title;

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', meta.description);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', meta.ogUrl || currentUrl);

    // Update Open Graph tags
    const updateOGTag = (property: string, content: string) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateOGTag('og:title', meta.ogTitle || meta.title);
    updateOGTag('og:description', meta.ogDescription || meta.description);
    updateOGTag('og:url', meta.ogUrl || currentUrl);

    // Update Twitter tags
    const updateTwitterTag = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    updateTwitterTag('twitter:title', meta.twitterTitle || meta.title);
    updateTwitterTag('twitter:description', meta.twitterDescription || meta.description);
    updateTwitterTag('twitter:url', meta.ogUrl || currentUrl);
  }, [meta]);
};

