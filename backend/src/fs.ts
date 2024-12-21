import fs from 'node:fs/promises';

export const checkFileExists = async (file: string): Promise<boolean> => {
  try {
    await fs.access(file);
    return true;
  }
  catch (error) {
    return false;
  }
};
