import { deploymentOrigin } from './system';

export const primaryNavigation = [
  { href: '/', label: 'Home' },
  { href: '/research/', label: 'Research' },
  { href: '/publications/', label: 'Publications' },
  { href: '/projects/', label: 'Projects' },
  { href: '/about/', label: 'About' }
] as const;

export const socialLinks = [
  {
    href: 'https://scholar.google.com/citations?user=ZeKCtQQAAAAJ',
    label: 'Google Scholar'
  },
  { href: 'https://orcid.org/0009-0009-9371-6983', label: 'ORCID' },
  { href: 'https://github.com/Phantom-fs', label: 'GitHub' },
  { href: 'https://www.linkedin.com/in/farhan-sheth/', label: 'LinkedIn' },
  {
    href: 'https://www.researchgate.net/profile/Farhan-Sheth',
    label: 'ResearchGate'
  },
  { href: 'https://dblp.org/pid/399/0371.html', label: 'DBLP' },
  { href: 'https://huggingface.co/Phantom-fs', label: 'Hugging Face' }
] as const;

export const publicEmail = 'farhansheth.jb@gmail.com';

export const canonicalSiteUrl = `${deploymentOrigin}/`;
export const websiteId = `${canonicalSiteUrl}#website`;
export const profilePageId = `${canonicalSiteUrl}#profile-page`;
export const personId = `${canonicalSiteUrl}#person`;

export const homepageJsonLd = (description: string) => ({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@id': websiteId,
      '@type': 'WebSite',
      name: 'Farhan Sheth',
      url: canonicalSiteUrl
    },
    {
      '@id': profilePageId,
      '@type': 'ProfilePage',
      isPartOf: { '@id': websiteId },
      mainEntity: { '@id': personId },
      url: canonicalSiteUrl
    },
    {
      '@id': personId,
      '@type': 'Person',
      description,
      email: `mailto:${publicEmail}`,
      image: `${deploymentOrigin}/images/profile-img.jpg`,
      jobTitle: 'AI researcher',
      name: 'Farhan Sheth',
      sameAs: socialLinks.map(({ href }) => href),
      url: canonicalSiteUrl
    }
  ]
});
