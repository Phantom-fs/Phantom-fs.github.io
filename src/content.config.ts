import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { contentSchemas } from './lib/content/contracts';

const collection = (name: keyof typeof contentSchemas) =>
  defineCollection({
    loader: glob({
      base: `./src/content/${name}`,
      pattern: '**/*.md'
    }),
    schema: contentSchemas[name]
  });

export const collections = {
  site: collection('site'),
  research: collection('research'),
  publications: collection('publications'),
  projects: collection('projects'),
  positions: collection('positions'),
  education: collection('education'),
  honors: collection('honors'),
  service: collection('service'),
  updates: collection('updates')
};
