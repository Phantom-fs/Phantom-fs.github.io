---
id: curved-worlds
slug: curved-worlds
title: 'Curved Worlds, Clear Boundaries: Generalizing Speech Deepfake Detection using Hyperbolic and Spherical Geometry Spaces'
authors:
  - name: Farhan Sheth
    isSelf: true
    equalContribution: true
  - name: Girish
    equalContribution: true
  - name: Mohd Mujtaba Akhtar
    equalContribution: true
  - name: Muskaan Singh
year: 2025
status: published
type: conference
venueAbbreviation: IJCNLP-AACL
venue: Proceedings of the 14th International Joint Conference on Natural Language Processing and the 4th Conference of the Asia-Pacific Chapter of the Association for Computational Linguistics
primaryCategory: Speech, Audio & Synthetic Media
hashtags:
  [
    speech-forensics,
    deepfake-detection,
    geometric-learning,
    speech-foundation-models
  ]
tldr: RHYME fuses speech-foundation-model embeddings in hyperbolic and spherical spaces to improve cross-paradigm audio deepfake detection.
doi: 10.18653/v1/2025.ijcnlp-long.104
arxivId: '2511.10793'
scholarPublicationId: ZeKCtQQAAAAJ:mVmsd5A6BfQC
links:
  paper: https://aclanthology.org/2025.ijcnlp-long.104/
openAccess: true
artifactAvailable: false
homeFeatured: false
detailPage: true
displayOrder: 6
---

In this work, we address the challenge of generalizable audio deepfake detection (ADD) across diverse speech synthesis paradigms—including conventional text-to-speech (TTS) systems and modern diffusion or flow-matching (FM) based generators. Prior work has mostly targeted individual synthesis families and often fails to generalize across paradigms due to overfitting to generation-specific artifacts. We hypothesize that synthetic speech, irrespective of its generative origin, leaves behind shared structural distortions in the embedding space that can be aligned through geometry-aware modeling. To this end, we propose RHYME, a unified detection framework that fuses utterance-level embeddings from diverse pretrained speech encoders using non-Euclidean projections. RHYME maps representations into hyperbolic and spherical manifolds—where hyperbolic geometry excels at modeling hierarchical generator families, and spherical projections capture angular, energy-invariant cues such as periodic vocoder artifacts. The fused representation is obtained via Riemannian barycentric averaging, enabling synthesis-invariant alignment. RHYME outperforms individual PTMs and homogeneous fusion baselines, achieving top performance and setting new state-of-the-art in cross-paradigm ADD.
