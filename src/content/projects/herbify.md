---
id: herbify-project
slug: herbify-project
title: Herbify
order: 4
summary: A curated medicinal-herb image dataset, ensemble vision framework, and real-time identification application.
problem: Make medicinal-herb identification more reliable through a cleaned dataset, explicit preprocessing, and an accessible real-time application.
role: Curated the dataset, developed the ensemble vision framework, and translated the work into the public identification application.
contribution: Standardized the Herbify dataset with PAHD preprocessing and paired EfficientNetV2-Large with ViT-Large/16 for species identification.
datasetScale:
  - 6,104 curated images
  - 91 herb species
methodology:
  - PAHD preprocessing and quality control
  - CNN and vision-transformer fine-tuning
  - EfficientNetV2-Large and ViT-Large/16 ensemble
outcomes:
  - 99.56% F1 score
  - Scientific-name and resemblance-probability output
  - Accessible real-time identification application
technology:
  - PyTorch
  - OpenCV
  - Scikit-Learn
  - Flask
  - CNNs
  - Vision Transformers
associatedPublicationIds:
  - herbify
links:
  code: https://github.com/Phantom-fs/Herbify-Modules
  dataset: https://github.com/Phantom-fs/Herbify-Dataset
  demo: https://github.com/Phantom-fs/Herbify
---

Herbify connects curation, preprocessing, model evaluation, and public identification in one evidence trail without replacing species-level uncertainty with a decorative prediction surface.
