---
id: recruitview
slug: recruitview
title: 'RecruitView: A Multimodal Dataset for Predicting Personality and Interview Performance for Human Resources Applications'
authors:
  - name: Amit Kumar Gupta
    equalContribution: true
  - name: Farhan Sheth
    isSelf: true
    equalContribution: true
  - name: Hammad Shaikh
  - name: Dheeraj Kumar
  - name: Angkul Puniya
  - name: Deepak Panwar
  - name: Sandeep Chaurasia
  - name: Priya Mathur
year: 2025
status: under-review
type: preprint
venueAbbreviation: arXiv
venue: arXiv preprint
primaryCategory: Multimodal & Human-Centered AI
hashtags:
  [multimodal-learning, dataset, personality-assessment, interview-performance]
tldr: RecruitView contributes a 2,011-clip multimodal interview dataset and CRMF, a geometry-aware model that improves correlation while using fewer parameters.
arxivId: '2512.00450'
scholarPublicationId: ZeKCtQQAAAAJ:qxL8FJ1GzNcC
links:
  paper: https://arxiv.org/abs/2512.00450
  code: https://github.com/AI4A-lab/CRMF
  dataset: https://huggingface.co/datasets/AI4A-lab/RecruitView
openAccess: true
artifactAvailable: true
homeFeatured: true
detailPage: true
displayOrder: 2
---

Automated personality and soft skill assessment from multimodal behavioral data remains challenging due to limited datasets and methods that fail to capture geometric structure inherent in human traits. We introduce RecruitView, a dataset of 2,011 naturalistic video interview clips from 300+ participants with 27,000 pairwise comparative judgments across 12 dimensions: Big Five personality traits, overall personality score, and six interview performance metrics. To leverage this data, we propose Cross-Modal Regression with Manifold Fusion (CRMF), a geometric deep learning framework that explicitly models behavioral representations across hyperbolic, spherical, and Euclidean manifolds. CRMF employs geometry-specific expert networks to capture hierarchical trait structures, directional behavioral patterns, and continuous performance variations simultaneously. An adaptive routing mechanism dynamically weights expert contributions based on input characteristics. Through principled tangent space fusion, CRMF achieves superior performance while training 40–50% fewer trainable parameters than large multimodal models. Extensive experiments demonstrate that CRMF substantially outperforms the selected baselines, achieving up to 11.4% improvement in Spearman correlation and 6.0% in concordance index. The RecruitView dataset is publicly available at https://huggingface.co/datasets/AI4A-lab/RecruitView. This record remains labelled under review; the arXiv source does not establish acceptance.
