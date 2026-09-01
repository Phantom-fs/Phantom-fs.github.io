---
id: agro-companion
slug: agro-companion
title: Agro Companion
order: 3
summary: An agricultural decision-support tool combining soil-image classification with fuzzy crop recommendations.
problem: Help farmers connect soil-image evidence with crop recommendations that also account for geological and environmental factors.
role: Led the research framework and translated the soil-classification work into a public decision-support application.
contribution: Combined CNN and vision-transformer soil classification with fuzzy crop recommendation rather than treating recognition as the final decision.
datasetScale:
  - Seven soil types
  - More than 20 crop recommendations
  - Dataset expanded from 1,189 to 8,413 images
methodology:
  - CycleGAN augmentation
  - CNN and ViT families with grid search and k-fold validation
  - Ensemble learning with fuzzy logic
outcomes:
  - 7.1× dataset expansion (+607.6%)
  - 92% crop-recommendation top-1 accuracy
  - Recommendations combine five geological and four environmental factors
technology:
  - Python
  - PyTorch
  - Keras
  - OpenCV
  - Flask
  - MATLAB
  - Fuzzy logic
associatedPublicationIds:
  - soil-classification
links:
  code: https://github.com/Phantom-fs/Agro-Companion-Modules
  demo: https://phantom-fs.github.io/Agro-Companion/
---

Agro Companion turns image classification into an agricultural decision path: the soil prediction feeds a transparent recommendation layer instead of producing an isolated label.
