import * as vscode from "vscode";
import {
  findImportSymbols,
  getDefinitionsOfImportSymbols,
  getFileExtension,
  writeStreamingOutput,
} from "./utils";
import { generateTestWithSample, Import, ReqBodyV3 } from "./generate";
import { getBackendUrl } from "./config";

export const generateTestForFileWithSample = async () => {
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

  const files = await vscode.workspace.findFiles("**/*");
  const selectedFile = await vscode.window.showQuickPick(
    files.map((file) => ({
      label: vscode.workspace.asRelativePath(file),
      file: file,
    })),
    {
      placeHolder: "Select a file",
    },
  );
  let sampleContent = "";
  if (selectedFile) {
    const document = await vscode.workspace.openTextDocument(selectedFile.file);
    sampleContent = document.getText();
  }
  const reqBody: ReqBodyV3 = {
    extension,
    code: sourceCode,
    testFramework: "jest",
    imports,
    sampleTest: sampleContent,
  };
  try {
    const response = await generateTestWithSample(backendUrl, reqBody);
    await writeStreamingOutput(response, extension);
  } catch (e) {
    vscode.window.showErrorMessage(`server error: ${e}. please try again.`);
    return;
  }
};
