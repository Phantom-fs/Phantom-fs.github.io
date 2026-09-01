---
id: recruitview-crmf
slug: recruitview-crmf
title: RecruitView & CRMF
order: 1
summary: A multimodal interview dataset and manifold-fusion framework for personality and interview-performance assessment.
problem: Assess personality and interview performance from naturalistic multimodal interview data without reducing the task to a single modality.
role: Project lead for the grant-supported interview-assessment collaboration; led the RecruitView data-collection and annotation infrastructure and designed CRMF.
contribution: Built the end-to-end data and modelling pipeline, including the psychologist-informed QA-Labeler platform and geometry-aware Cross-Modal Regression with Manifold Fusion.
datasetScale:
  - 2,011 naturalistic video interview clips
  - More than 300 participants
  - 27,000 pairwise comparative judgements across 12 dimensions
methodology:
  - Video, audio, and text embeddings
  - Manifold-specific experts over hyperbolic, spherical, and Euclidean spaces
  - Adaptive routing and pairwise comparative annotation
outcomes:
  - Up to 11.4% higher Spearman correlation
  - Up to 6.0% higher concordance index
  - 40–50% fewer trainable parameters than large multimodal baselines
technology:
  - PyTorch
  - Transformers
  - NLP
  - Web APIs
  - MongoDB
associatedPublicationIds:
  - recruitview
links:
  dataset: https://huggingface.co/datasets/AI4A-lab/RecruitView
  code: https://github.com/AI4A-lab/CRMF
---

RecruitView treats interview assessment as a data and representation-learning problem, connecting naturalistic video collection with comparative human judgements and a lightweight multimodal model rather than presenting a generic screening interface.
