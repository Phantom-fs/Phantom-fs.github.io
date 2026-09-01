---
id: geological-rock-classification
slug: geological-rock-classification
title: 'Advancing Geological Image Segmentation: Deep Learning Approaches for Rock Type Identification and Classification'
authors:
  - name: Amit Kumar Gupta
  - name: Priya Mathur
  - name: Farhan Sheth
    isSelf: true
  - name: Carlos M. Travieso-Gonzalez
  - name: Sandeep Chaurasia
year: 2024
status: published
type: journal
venueAbbreviation: ACG
venue: Applied Computing and Geosciences
primaryCategory: Earth & Agricultural Intelligence
hashtags: [geology, rock-classification, computer-vision, transfer-learning]
tldr: A 950-image, 19-rock dataset is evaluated with transfer-learned CNN families, reaching above 99% in the preprocessed and cross-validated settings.
doi: 10.1016/j.acags.2024.100192
scholarPublicationId: ZeKCtQQAAAAJ:9yKSN-GCB0IC
links:
  paper: https://doi.org/10.1016/j.acags.2024.100192
  code: https://github.com/Phantom-fs/Rock-Type-Classification
openAccess: true
artifactAvailable: true
homeFeatured: false
detailPage: false
displayOrder: 11
---

This study aims to tackle the obstacles linked with geological image segmentation by employing sophisticated deep learning techniques. Geological formations, characterized by diverse forms, sizes, textures, and colors, present a complex landscape for traditional image processing techniques. Drawing inspiration from recent advancements in image segmentation, particularly in medical imaging and object recognition, this research proposed a comprehensive methodology tailored to the specific requirements of geological image datasets. To establish the dataset, a minimum of 50 images per rock type was deemed essential, with the majority captured at the University of Las Palmas of Gran Canaria and during a field expedition to La Isla de La Palma, Spain. This dual-source approach ensures diversity in geological formations, enriching the dataset with a comprehensive range of visual characteristics. The study involves the identification of 19 distinct rock types, each documented with 50 samples, resulting in a comprehensive database containing 950 images. The methodology involves two crucial phases: initial preprocessing, followed by transfer learning and fine-tuning of ResNet, Inception V3, DenseNet, MobileNet V3, and EfficientNet V2 large models. DenseNet201 and InceptionV3 attained the highest accuracy of 98.49% on the original dataset; in five-fold cross-validation, MobileNet V3 large reached 99.15% accuracy. The authors report faster convergence without overfitting after preprocessing and minimal misclassifications among specific classes.
