import { resolve } from 'node:path';
import { validateBuildInputs } from '../src/lib/content/build-validation';

const contentDirectory = resolve(process.env.CONTENT_ROOT ?? 'src/content');
const componentsDirectory = resolve(
  process.env.COMPONENTS_ROOT ?? 'src/components'
);

await validateBuildInputs(contentDirectory, componentsDirectory);
