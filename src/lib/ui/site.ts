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
  { href: 'https://dblp.org/pid/399/0371.html', label: 'DBLP' }
] as const;

export const publicEmail = 'farhansheth.jb@gmail.com';
