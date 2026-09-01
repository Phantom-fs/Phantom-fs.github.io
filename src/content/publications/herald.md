---
id: herald
slug: herald
title: 'Selective Token-Level Cryptographic Redaction for Privacy-Preserving Clinical Deployment of Large Language Models'
authors:
  - name: Farhan Sheth
    isSelf: true
    equalContribution: true
  - name: Ziyuan Yang
    equalContribution: true
  - name: Yongying Lan
  - name: Si Yong Yeo
year: 2026
status: under-review
type: preprint
venueAbbreviation: arXiv
venue: arXiv preprint
primaryCategory: Privacy, Trust & Safety
hashtags:
  [clinical-ai, privacy-preserving-ai, cryptography, large-language-models]
tldr: HERALD protects selected sensitive tokens with client-side deterministic ciphertext while preserving context and downstream clinical utility.
arxivId: '2606.03399'
scholarPublicationId: ZeKCtQQAAAAJ:9ZlFYXVOiuMC
links:
  paper: https://arxiv.org/abs/2606.03399
  code: https://github.com/Phantom-fs/HERALD
openAccess: true
artifactAvailable: true
homeFeatured: true
detailPage: true
displayOrder: 1
---

While large language models (LLMs) are increasingly used for clinical applications, many existing pipelines require sending raw sensitive health information to remote servers, heightening the risk of privacy leakage. Encrypting an entire dataset introduces prohibitive computational, alignment, and communication overheads. To preserve privacy while maintaining usability, we present Healthcare Encryption & Redaction via Adaptive Linguistic Decomposition (HERALD), a token-level cryptographic redaction framework designed to encrypt only sensitive tokens while preserving surrounding context for downstream model utility. HERALD combines medical named-entity recognition with part-of-speech-driven policies to select candidate tokens, performs targeted lemmatization to stabilize surface forms, and substitutes each protected token with deterministic ciphertext wrapped in explicit delimiters. The model-agnostic framework operates entirely on the client side, keeping sensitive content encrypted during storage, transmission, and processing without changes to downstream models. Evaluation on public classification and medical question-answering datasets shows that fully secured baselines suffer substantial utility loss, whereas HERALD consistently recovers performance close to plaintext. This record remains under review and is not presented as accepted or published.
