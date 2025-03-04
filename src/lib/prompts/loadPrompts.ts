import Mustache from "mustache";
import fs from "fs/promises";
import { generate } from "./generate";
import { importsPrompt } from "./imports";
import { generateWithSample } from "./generateWithSample";

export async function readFile(filename: string) {
  const content = fs.readFile(filename, "utf-8");
  return content;
}

export interface GeneratePromptData {
  language: string;
  sourceFileName: string;
  sourceFileContent: string;
  testFramework: string;
  importedContent?: string;
  additionalInstructions?: string;
  projectInfoFile?: string;
  projectInfoFileName?: string;
}

export interface GenerateWithSamplePromptData {
  language: string;
  sourceFileName: string;
  sourceFileContent: string;
  sampleSourceFileContent: string;
  sampleTestFileContent: string;
  testFramework: string;
}

export function loadGenerateWithSamplePrompt(
  data: GenerateWithSamplePromptData,
) {
  const renderedContent = mustacheRenderString(generateWithSample, data);
  return renderedContent;
}

export function loadGeneratePrompt(data: GeneratePromptData) {
  const renderedContent = mustacheRenderString(generate, data);
  return renderedContent;
}

export interface ImportsData {
  imports: {
    path: string;
    code: string;
  }[];
}

export function loadImportsText(data: ImportsData) {
  const renderedContent = mustacheRenderString(importsPrompt, data);
  return renderedContent;
}

async function mustacheRender<T>(templatePath: string, data: T) {
  const template = await readFile(templatePath);
  return Mustache.render(template, data, {}, { escape: (t: string) => t });
}

function mustacheRenderString<T>(content: string, data: T) {
  return Mustache.render(content, data, {}, { escape: (t: string) => t });
}

export interface ErrorData {
  testFilename: string;
  testFileContent: string;
  sourceFilename: string;
  sourceFileContent: string;
  stdout: string;
  stderr: string;
}

// export async function loadErrorText(data: ErrorData) {
//   const renderedContent = await mustacheRender(ERROR_TEMPLATE, data);
//   return renderedContent;
// }
