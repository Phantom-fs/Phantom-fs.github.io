---
id: herbify
slug: herbify
title: 'Herbify: An ensemble deep learning framework integrating convolutional neural networks and vision transformers for precise herb identification'
authors:
  - name: Farhan Sheth
    isSelf: true
  - name: Ishika Chatter
  - name: Manvendra Jasra
  - name: Gireesh Kumar
  - name: Richa Sharma
year: 2025
status: published
type: journal
venueAbbreviation: PM
venue: Plant Methods
primaryCategory: Earth & Agricultural Intelligence
hashtags: [herb-identification, computer-vision, vision-transformers, dataset]
tldr: Herbify standardizes 6,104 images across 91 species and combines EfficientNetV2-Large with ViT-Large/16 for high-precision identification.
doi: 10.1186/s13007-025-01421-5
scholarPublicationId: ZeKCtQQAAAAJ:Tyk-4Ss8FVUC
links:
  paper: https://doi.org/10.1186/s13007-025-01421-5
  code: https://github.com/Phantom-fs/Herbify-Modules
  dataset: https://github.com/Phantom-fs/Herbify-Dataset
  demo: https://github.com/Phantom-fs/Herbify
openAccess: true
artifactAvailable: true
homeFeatured: false
detailPage: true
displayOrder: 10
---

Herbs have historically been central to medicinal practices, representing one of the earliest forms of therapeutic intervention. While synthetic drugs are often highly effective for acute conditions, their use is frequently accompanied by adverse side effects. In response to this need, the current study introduces a computer vision framework for accurate herb identification. A novel dataset, Herbify, was compiled from two different herb datasets and refined through rigorous cleaning, preprocessing, and quality control procedures. The resulting dataset underwent standardization via the Preprocessing Algorithm for Herb Detection (PAHD), producing a refined dataset of 6104 images, representing 91 distinct herb species, with an average of about 67 images per species. Utilizing transfer learning, the research harnessed pre-trained Convolutional Neural Networks (CNNs) and Vision Transformers (ViTs), then integrated these models into an ensemble framework. EfficientNet v2-Large achieved an F1-score of 99.13%, while the ensemble of EfficientNet v2-Large and ViT-Large/16, termed EfficientL-ViTL, attained an F1-score of 99.56%. The research also introduces the Herbify application, an AI-driven framework designed to identify herbs using the developed model and return scientific names and resemblance probabilities.
