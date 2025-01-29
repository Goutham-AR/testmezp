import * as vscode from "vscode";
import fs from "fs";
import * as fsa from "fs/promises";
import {
  findImportSymbols,
  getDefinitionsOfImportSymbols,
  getFileExtension,
  removeDuplicates,
  writeOpenAIStreaming,
  writeStreamingOutput,
} from "./utils";
import { generateTestV2, generateV3, Import, ReqBodyV2 } from "./generate";
import { getBackendUrl, getModelName } from "./config";
import path from "path";
import {
  GeneratePromptData,
  ImportsData,
  loadGeneratePrompt,
  loadImportsText,
} from "./prompts/loadPrompts";
import {
  convertExtensionToLanguage,
  extensionToTestFramework,
} from "./constants";

export const generateTestForFileV2 = async () => {
  const backendUrl = getBackendUrl();
  if (!backendUrl) {
    vscode.window.showErrorMessage("Please set apiUrl in settings");
    return;
  }
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor!");
    return;
  }
  vscode.window.showInformationMessage("Generating tests...");

  // read package.json
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage("not workspace folder opened.");
    return;
  }
  const packageJsonPath = path.join(
    workspaceFolders[0].uri.fsPath,
    "package.json",
  );
  if (!fs.existsSync(packageJsonPath)) {
    vscode.window.showErrorMessage(
      `package.json not found in ${workspaceFolders[0].uri.fsPath}`,
    );
    return;
  }
  const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");

  const document = editor.document;
  const sourceCode = document.getText();
  const filepath = document.fileName;
  const extension = getFileExtension(filepath) ?? "txt";
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

  const reqBody: any = {
    extension,
    framework: "nodejs",
    code: sourceCode,
    testFramework: "jest",
    imports,
    packagejson: packageJsonContent,
    filename: path.basename(filepath),
  };

  try {
    const response = await generateTestV2(backendUrl, reqBody);
    await writeStreamingOutput(response, extension);
  } catch (e) {
    console.log(e);
    vscode.window.showErrorMessage(`server error: ${e}. please try again.`);
    return;
  }
};

export async function generateTestV3() {
  {
    const backendUrl = getBackendUrl();
    if (!backendUrl) {
      vscode.window.showErrorMessage("Please set apiUrl in settings");
      return;
    }
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active editor!");
      return;
    }
    vscode.window.showInformationMessage("Generating tests...");

    // read package.json
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage("not workspace folder opened.");
      return;
    }
    const packageJsonPath = path.join(
      workspaceFolders[0].uri.fsPath,
      "package.json",
    );
    if (!fs.existsSync(packageJsonPath)) {
      vscode.window.showErrorMessage(
        `package.json not found in ${workspaceFolders[0].uri.fsPath}`,
      );
      return;
    }
    const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");

    const document = editor.document;
    const sourceCode = document.getText();
    const filepath = document.fileName;
    const extension = getFileExtension(filepath) ?? "txt";
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

    const importsData: ImportsData = {
      imports: removeDuplicates(imports),
    };
    const importsPromptData = loadImportsText(importsData);

    const data: GeneratePromptData = {
      language: convertExtensionToLanguage(extension),
      sourceFileName: path.basename(filepath),
      sourceFileContent: sourceCode,
      testFramework: extensionToTestFramework(extension),
      notJsx: false,
      projectInfoFileName: "package.json",
      projectInfoFile: packageJsonContent,
      importedContent: importsPromptData,
    };
    const prompt = loadGeneratePrompt(data);

    const modelName = getModelName();
    if (!modelName) {
      vscode.window.showErrorMessage(`modelName setting is not set`);
      return;
    }
    try {
      const response = await generateV3(modelName, backendUrl, prompt, true);
      await writeOpenAIStreaming(response, extension);
    } catch (e) {
      console.log(e);
      vscode.window.showErrorMessage(`server error: ${e}. please try again.`);
      return;
    }
  }
}
