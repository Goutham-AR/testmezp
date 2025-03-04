import * as vscode from "vscode";
import path from "path";
import { encoding_for_model } from "@dqbd/tiktoken";
import fs from "fs";
import { AppError } from "../lib/errors";
import {
  findImportSymbols,
  getDefinitionsOfImportSymbols,
  Import,
} from "../lib/utils";
import {
  GeneratePromptData,
  loadGeneratePrompt,
  loadImportsText,
} from "../lib/prompts/loadPrompts";
import { IApp } from "../lib/app";

export class GenerateApp extends IApp {
  public async generateTest() {
    const document = this.getCurrentDocument();
    const sourceCode = document.getText();
    // read package.json
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new AppError("No workspace folder opened");
    }
    const packageJsonPath = path.join(
      workspaceFolders[0].uri.fsPath,
      "package.json",
    );
    if (!fs.existsSync(packageJsonPath)) {
      throw new AppError(
        `package.json not found in ${workspaceFolders[0].uri.fsPath}`,
      );
    }
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");

    const filepath = document.fileName;
    const importSymbols = await findImportSymbols(document);
    const definitions = await getDefinitionsOfImportSymbols(
      importSymbols,
      document,
    );
    const localDefinitions = definitions.filter(
      (def) => def.locations.length > 0,
    );
    const imports: Import[] = localDefinitions.map((def) => ({
      path: def.path,
      code: def.locations[0].text,
    }));
    const language = document.languageId;
    const importsPrompt = loadImportsText({ imports });
    let promptData: GeneratePromptData = {
      language,
      sourceFileName: path.basename(filepath),
      sourceFileContent: sourceCode,
      testFramework: "jest",
      importedContent: importsPrompt,
      projectInfoFile: packageJsonContent,
      projectInfoFileName: "package.json",
    };
    let prompt = loadGeneratePrompt(promptData);
    const tokenizer = encoding_for_model("gpt-3.5-turbo");
    const encoding = tokenizer.encode(prompt);
    if (encoding.length >= this._contextLength) {
      this._showWarning(
        "context limit exceeded, removing imports from the prompt",
      );
      promptData.importedContent = undefined;
      prompt = loadGeneratePrompt(promptData);
      if (tokenizer.encode(prompt).length >= this._contextLength) {
        this._showWarning("context exceeded, the response might be inaccurate");
      }
    }
    try {
      const response = await this._sendPromptStreaming(prompt);
      await this._writeStreamingOutput(response, language);
    } catch (e) {
      this._showError(`llm server request failed: ${(e as Error).message}`);
    }
  }
}
