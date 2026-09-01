---
id: uc-prun
slug: uc-prun
title: 'Uc-PrUn: Uncertainty-Calibrated Machine Unlearning using Vision-Language Models for Clinical Decision Support'
authors:
  - name: Farhan Sheth
    isSelf: true
  - name: Mohd Mujtaba Akhtar
  - name: Girish
  - name: Muskaan Singh
  - name: Alexander Davey
year: 2026
status: published
type: journal
venueAbbreviation: ACM HEALTH
venue: ACM Transactions on Computing for Healthcare
primaryCategory: Healthcare & Clinical AI
hashtags: [clinical-ai, vision-language-models, uncertainty, machine-unlearning]
tldr: Uc-PrUn couples zero-shot uncertainty estimation with selective unlearning to improve calibration and downstream clinical VLM performance.
doi: 10.1145/3820497
scholarPublicationId: ZeKCtQQAAAAJ:L8Ckcad2t8MC
links:
  paper: https://doi.org/10.1145/3820497
  code: https://github.com/Phantom-fs/Uc-PrUn
openAccess: false
artifactAvailable: true
homeFeatured: false
detailPage: true
displayOrder: 4
---

In this study, we introduce Uc-PrUn, a principled framework designed to improve the reliability of Vision–Language Models (VLMs) in clinical decision-support systems. The first stage focuses on Bayesian-inspired zero-shot uncertainty quantification using Monte Carlo dropout, while the second stage introduces an uncertainty-aware machine-unlearning strategy. Leveraging the Harvard-FairVLMed dataset, which comprises paired SLO fundus images and clinical notes for glaucoma detection, we evaluate VLMs to quantify epistemic uncertainty and identify high-variance training samples. The pruning and unlearning mechanism selectively removes uncertain samples to enhance model calibration and downstream performance. Experiments show that Uc-PrUn reduces predictive uncertainty and yields consistent gains in accuracy and F1 scores across multiple VLMs, supporting uncertainty-aware pruning in medical AI pipelines.
