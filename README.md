# Farhan Sheth

Farhan Sheth's academic website: [phantom-fs.github.io](https://phantom-fs.github.io/).

The site is a static Astro deployment. The tracked
`src/data/generated/citations.json` file is the last fully validated,
Scholar-only citation snapshot, so CI, browser tests, and ordinary code
deployments are deterministic and never query Scholar.

GitHub Actions refreshes this snapshot daily at 08:17 UTC. A refresh queries
Google Scholar directly, validates all configured publications, commits the
updated snapshot only on success, and deploys the resulting site. If Scholar
is unavailable or returns incomplete data, the refresh fails before changing
the snapshot or the live site.

Generated site output, dependencies, and caches remain untracked.

## License

All rights reserved. See [LICENSE.md](LICENSE.md).
