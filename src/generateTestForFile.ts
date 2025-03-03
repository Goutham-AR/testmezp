import { App } from "./app";
import { handleError } from "./errors";

export async function generateTestForFile() {
  try {
    const app = new App();
    await app.generateTest();
  } catch (e) {
    handleError(e as Error);
  }
};


