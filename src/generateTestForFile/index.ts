import { handleError } from "../lib/errors";
import { GenerateApp } from "./app";

export async function generateTestForFile() {
  try {
    const app = new GenerateApp();
    await app.generateTest();
  } catch (e) {
    handleError(e as Error);
  }
};

