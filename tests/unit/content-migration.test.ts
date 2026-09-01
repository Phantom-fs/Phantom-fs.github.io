import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { loadValidatedContent } from '../../src/lib/content/query';
import { contentSchemas } from '../../src/lib/content/contracts';

const contentRoot = resolve('src/content');

describe('Milestone 2 verified corpus', () => {
  it('contains the complete deduplicated Scholar/reference inventory', async () => {
    const content = await loadValidatedContent(contentRoot);
    expect(content.publications).toHaveLength(18);
    expect(new Set(content.publications.map(({ data }) => data.id)).size).toBe(
      18
    );
    expect(
      new Set(content.publications.map(({ data }) => data.primaryCategory))
    ).toEqual(
      new Set([
        'Healthcare & Clinical AI',
        'Privacy, Trust & Safety',
        'Speech, Audio & Synthetic Media',
        'Multimodal & Human-Centered AI',
        'Scientific & Applied AI',
        'Earth & Agricultural Intelligence'
      ])
    );
    expect(
      content.publications.every(
        ({ body, data }) => body.length > 0 && data.tldr.length > 0
      )
    ).toBe(true);
  });

  it('keeps the approved editorial and detail selections exact', async () => {
    const content = await loadValidatedContent(contentRoot);
    const home = content.publications
      .filter(({ data }) => data.homeFeatured)
      .sort((left, right) => left.data.displayOrder - right.data.displayOrder);
    const detail = content.publications
      .filter(({ data }) => data.detailPage)
      .sort((left, right) => left.data.displayOrder - right.data.displayOrder);

    expect(home.map(({ data }) => data.id)).toEqual([
      'herald',
      'recruitview',
      'alzheimer-detection',
      'signal-eacl-2026'
    ]);
    expect(detail.map(({ data }) => data.id)).toEqual([
      'herald',
      'recruitview',
      'alzheimer-detection',
      'uc-prun',
      'signal-eacl-2026',
      'curved-worlds',
      'cross-lingual-generator-attribution',
      'learning-heat',
      'soil-classification',
      'herbify'
    ]);
  });

  it('publishes the resolved identity and opportunity copy', async () => {
    const content = await loadValidatedContent(contentRoot);
    const siteText = content.site
      .map(({ body, data }) => `${data.title}\n${data.summary}\n${body}`)
      .join('\n');
    const identity = content.site.find(({ data }) => data.id === 'identity');
    expect(identity?.data.title).toBe('AI researcher');
    expect(siteText).not.toContain('Early-career AI researcher');
    expect(siteText).toContain('farhansheth.jb@gmail.com');
    expect(siteText).toContain('2026–2027');
  });

  it('stores source-backed advisor links and separate education fields', async () => {
    const content = await loadValidatedContent(contentRoot);
    const positions = new Map(
      content.positions.map((entry) => [entry.data.id, entry.data])
    );

    expect(positions.get('ntu-research-assistant')?.advisor).toEqual({
      name: 'Dr. Si Yong Yeo',
      url: 'https://dr.ntu.edu.sg/entities/person/Yeo-Si-Yong'
    });
    expect(positions.get('ulster-research-intern')?.advisor).toEqual({
      name: 'Dr. Muskaan Singh',
      url: 'https://www.ulster.ac.uk/staff/m-singh'
    });
    expect(positions.get('nit-research-intern')?.advisor).toEqual({
      name: 'Dr. Rajesh Singla',
      url: 'https://departments.nitj.ac.in/dept/ice/Faculty/6430445938bff038a7806479'
    });
    expect(positions.get('ulpgc-research-assistant')?.advisor).toEqual({
      name: 'Prof. Carlos M. Travieso-González',
      url: 'https://scholar.google.com/citations?user=G1ks9nIAAAAJ'
    });
    expect(positions.get('manipal-project-lead')?.advisor).toEqual({
      name: 'Prof. Sandeep Chaurasia',
      url: 'https://jaipur.manipal.edu/fosta/faculty-details.php?url=147/'
    });

    const education = content.education.find(
      ({ data }) => data.id === 'manipal-btech'
    );
    expect(education?.data.cgpa).toBe('8.53/10.0');
    expect(education?.data.coursework).toEqual(
      expect.arrayContaining([
        'Artificial Intelligence',
        'Machine Learning',
        'Data Science',
        'Data Mining & Data Warehousing',
        'Linear Algebra',
        'Calculus',
        'Probability & Statistics',
        'Data Structures & Algorithms',
        'Computer Architecture'
      ])
    );
  });

  it('keeps approved service entries without changing verified honor data', async () => {
    const content = await loadValidatedContent(contentRoot);
    expect(content.service.map(({ data }) => data.id)).not.toContain(
      'community-volunteering'
    );
    expect(content.service).toContainEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 'icassp-2026-reviewer',
          organization:
            'IEEE International Conference on Acoustics, Speech and Signal Processing',
          role: 'Peer reviewer',
          title: 'Reviewer, ICASSP 2026'
        })
      })
    );
    expect(
      content.service
        .find(({ data }) => data.id === 'icassp-2026-reviewer')
        ?.body.trim()
    ).toBe('');
    expect(content.site.map(({ data }) => data.id)).not.toContain(
      'about-acknowledgements'
    );

    const studentExcellenceAward = content.honors.find(
      ({ data }) => data.id === 'student-excellence-award'
    );
    expect(studentExcellenceAward?.data).toMatchObject({
      issuer: 'Manipal University Jaipur',
      year: 2025
    });

    const siteText = content.site
      .map(({ body, data }) => `${data.title}\n${data.summary}\n${body}`)
      .join('\n');
    expect(siteText).not.toContain('A navigable record');
    expect(siteText).not.toContain('Evidence-led case studies');
    expect(siteText).not.toContain('Acknowledgement of the advisers');
    expect(siteText).not.toContain('early-career');
  });

  it('keeps the verified Uc-PrUn publication status and approved venue label', async () => {
    const content = await loadValidatedContent(contentRoot);
    const ucPrun = content.publications.find(
      ({ data }) => data.id === 'uc-prun'
    );
    expect(ucPrun?.data.status).toBe('published');
    expect(ucPrun?.data.venueAbbreviation).toBe('ACM HEALTH');
  });

  it('keeps the visitor disclosure concise and explicit', async () => {
    const content = await loadValidatedContent(contentRoot);
    const visitorMap = content.site.find(
      ({ data }) => data.id === 'visitor-map'
    );
    expect(visitorMap).toBeDefined();
    if (!visitorMap) return;

    const visitorText = `${visitorMap.data.summary}\n${visitorMap.body}`;
    expect(visitorMap.body.trim()).toBe('');
    expect(visitorText).toMatch(/visit|reader/i);
    expect(visitorText).not.toContain(
      'An optional map of visits to this site.'
    );
    expect(visitorText).not.toContain(
      'This optional map is provided by MapMyVisitors and may be unavailable when the service is blocked.'
    );
    expect(visitorText).not.toContain(
      'The rest of the site does not depend on it.'
    );
    expect(visitorText.length).toBeLessThan(180);
  });

  it('keeps site copy free of generic instructional scaffolding', async () => {
    const content = await loadValidatedContent(contentRoot);
    const siteText = content.site
      .map(({ body, data }) => `${data.title}\n${data.summary}\n${body}`)
      .join('\n');
    const bannedPatterns = [
      /in this section,? we will/i,
      /click here/i,
      /a navigable record/i,
      /evidence-led case studies/i,
      /optional map/i,
      /the rest of the site does not depend on it/i
    ];

    for (const pattern of bannedPatterns) {
      expect(siteText).not.toMatch(pattern);
    }
  });

  it('keeps News entries as concise accepted-at venue statements', async () => {
    const content = await loadValidatedContent(contentRoot);
    expect(content.updates).toHaveLength(5);

    for (const entry of content.updates) {
      expect(entry.data.title).toMatch(/^Accepted at /);
      expect(entry.data.title).not.toMatch(/published/i);
      expect(entry.data.title).not.toMatch(
        /Uc-PrUn|SIGNAL|synthetic-speech|Alzheimer|Learning heat/i
      );
      expect(entry.data.summary).toMatch(/^Accepted at .+\.$/);
      expect(entry.data.summary.length).toBeLessThan(150);
      expect(entry.body.trim()).toBe('');
    }
  });

  it('requires a non-paper artifact link when artifactAvailable is true', async () => {
    const content = await loadValidatedContent(contentRoot);
    const source = content.publications.find(
      ({ data }) => data.id === 'herald'
    );
    expect(source).toBeDefined();
    if (!source) return;

    const paperOnly = {
      ...source.data,
      links: { paper: 'https://arxiv.org/abs/2606.03399' },
      artifactAvailable: true
    };
    const noArtifact = { ...paperOnly, artifactAvailable: false };

    expect(contentSchemas.publications.safeParse(paperOnly).success).toBe(
      false
    );
    expect(contentSchemas.publications.safeParse(noArtifact).success).toBe(
      true
    );
  });

  it('rejects named review destinations for unpublished records', async () => {
    const content = await loadValidatedContent(contentRoot);
    const source = content.publications.find(
      ({ data }) => data.id === 'herald'
    );
    expect(source).toBeDefined();
    if (!source) return;

    const namedDestination = {
      ...source.data,
      venueAbbreviation: 'NeurIPS 2026',
      venue: 'arXiv preprint; under review at NeurIPS 2026'
    };

    expect(
      contentSchemas.publications.safeParse(namedDestination).success
    ).toBe(false);
    expect(contentSchemas.publications.safeParse(source.data).success).toBe(
      true
    );
  });
});
