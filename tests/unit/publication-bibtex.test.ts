import { describe, expect, it } from 'vitest';
import { createBibTeX } from '../../src/lib/publications/bibtex';

describe('publication bibliography generation', () => {
  it('uses verified publication metadata and preserves the DOI', () => {
    expect(
      createBibTeX({
        authors: ['Farhan Sheth', 'Ari Example'],
        doi: '10.1145/3820497',
        id: 'uc-prun',
        title:
          'Uc-PrUn: Uncertainty-Calibrated Machine Unlearning using Vision-Language Models for Clinical Decision Support',
        type: 'journal',
        venue: 'ACM Transactions on Computing for Healthcare',
        year: 2026
      })
    ).toBe(`@article{sheth2026ucprun,
  author = {Farhan Sheth and Ari Example},
  title = {Uc-PrUn: Uncertainty-Calibrated Machine Unlearning using Vision-Language Models for Clinical Decision Support},
  journal = {ACM Transactions on Computing for Healthcare},
  year = {2026},
  doi = {10.1145/3820497}
}`);
  });

  it('uses an arXiv-backed misc entry for an under-review preprint', () => {
    expect(
      createBibTeX({
        arxivId: '2606.03399',
        authors: ['Farhan Sheth', 'Ziyuan Yang'],
        id: 'herald',
        title:
          'Selective Token-Level Cryptographic Redaction for Privacy-Preserving Clinical Deployment of Large Language Models',
        type: 'preprint',
        venue: 'arXiv preprint',
        year: 2026
      })
    ).toBe(`@misc{sheth2026herald,
  author = {Farhan Sheth and Ziyuan Yang},
  title = {Selective Token-Level Cryptographic Redaction for Privacy-Preserving Clinical Deployment of Large Language Models},
  eprint = {2606.03399},
  archivePrefix = {arXiv},
  year = {2026}
}`);
  });
});
