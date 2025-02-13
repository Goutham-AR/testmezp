import { App } from "./app";
import { handleError } from "./errors";

export async function generateTestForFileV2() {
  try {
    const app = new App();
    await app.generateTest();
  } catch (e) {
    handleError(e as Error);
  }
};

