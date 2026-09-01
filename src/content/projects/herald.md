---
id: herald-project
slug: herald-project
title: 'HERALD: Privacy-Preserving Clinical LLM'
order: 2
summary: A model-agnostic, client-side cryptographic redaction framework for clinical language-model deployment.
problem: Protect selected sensitive content in clinical LLM workflows while retaining the contextual information needed for downstream utility.
role: Research Assistant at NTU; developed and evaluated the framework with Dr. Si Yong Yeo.
contribution: Designed a model-agnostic client-side pipeline that applies medical NER and part-of-speech policies before deterministic ciphertext replacement.
datasetScale:
  - Public clinical classification workloads
  - Public medical question-answering workloads
methodology:
  - Medical named-entity recognition
  - Part-of-speech policy selection
  - Deterministic client-side ciphertext replacement
outcomes:
  - Preserves protected tokens through storage, transmission, and model processing
  - Recovers substantially more downstream utility than fully secured baselines
  - Requires no downstream model architecture change
technology:
  - PyTorch
  - Transformers
  - NLP
  - Cryptography
  - Large language models
associatedPublicationIds:
  - herald
links:
  code: https://github.com/Phantom-fs/HERALD
---

The case study focuses on deployable privacy-utility trade-offs for cloud and API-assisted clinical NLP: selected tokens remain protected while the surrounding context stays usable for evaluation and real workflows.
