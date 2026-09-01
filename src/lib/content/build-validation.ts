import {
  assertComponentFilesAreCopyFree,
  loadValidatedContent,
  type ValidatedContent
} from './query';

export const validateBuildInputs = async (
  contentDirectory: string,
  componentsDirectory: string
): Promise<ValidatedContent> => {
  const content = await loadValidatedContent(contentDirectory);
  await assertComponentFilesAreCopyFree(componentsDirectory);
  return content;
};
