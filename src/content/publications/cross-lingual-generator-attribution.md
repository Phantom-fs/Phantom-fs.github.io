---
id: cross-lingual-generator-attribution
slug: cross-lingual-generator-attribution
title: 'Towards Attribution of Generators and Emotional Manipulation in Cross-Lingual Synthetic Speech using Geometric Learning'
authors:
  - name: Girish
    equalContribution: true
  - name: Mohd Mujtaba Akhtar
    equalContribution: true
  - name: Farhan Sheth
    isSelf: true
  - name: Muskaan Singh
year: 2025
status: published
type: conference
venueAbbreviation: IJCNLP-AACL Findings
venue: Findings of the 14th International Joint Conference on Natural Language Processing and the 4th Conference of the Asia-Pacific Chapter of the Association for Computational Linguistics
primaryCategory: Speech, Audio & Synthetic Media
hashtags: [speech-forensics, synthetic-speech, emotion, geometric-learning]
tldr: MiCuNet uses mixed-curvature fusion and temporal gating to trace emotion, manipulation, and generator source across English and Chinese synthetic speech.
doi: 10.18653/v1/2025.findings-ijcnlp.37
arxivId: '2511.10790'
scholarPublicationId: ZeKCtQQAAAAJ:YOwf2qJgpHMC
links:
  paper: https://aclanthology.org/2025.findings-ijcnlp.37/
openAccess: true
artifactAvailable: false
homeFeatured: false
detailPage: true
displayOrder: 7
---

In this work, we address the problem of fine-grained traceback of emotional and manipulation characteristics from synthetically manipulated speech. We hypothesize that combining semantic-prosodic cues captured by Speech Foundation Models (SFMs) with fine-grained spectral dynamics from auditory representations can enable more precise tracing of both emotion and manipulation source. To validate this, we introduce MiCuNet, a multitask framework for fine-grained tracing of emotional and manipulation attributes in synthetically generated speech. The approach integrates SFM embeddings with spectrogram-based auditory features through a mixed-curvature projection mechanism spanning Hyperbolic, Euclidean, and Spherical spaces, guided by learnable temporal gating. It simultaneously predicts original emotions, manipulated emotions, and manipulation sources on the EmoFake dataset across English and Chinese subsets. MiCuNet yields consistent improvements over conventional fusion strategies.
