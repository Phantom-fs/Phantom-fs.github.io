# Farhan Sheth

Personal academic website for Farhan Sheth, an AI researcher working on trustworthy AI, multimodal learning, speech forensics, and scientific applications.

Live site: [phantom-fs.github.io](https://phantom-fs.github.io/)

## Deployment repository

This repository intentionally contains the production-ready static artifact served by GitHub Pages. It includes only the files required to run the public website: rendered pages, browser assets, fonts, images, the CV, and the minimal deployment workflow.

The development source, tests, package dependencies, and local tooling are maintained separately in the `website-v2` project. They are deliberately not copied here.

## Updating the site

1. Make and verify changes in the `website-v2` source project.
2. Generate its static `dist` artifact.
3. Replace this repository's deployable files with that verified artifact, then commit and push to `main`.

Pushing to `main` runs the GitHub Pages workflow and publishes the site.

## License

All rights reserved. See [LICENSE.md](LICENSE.md).
