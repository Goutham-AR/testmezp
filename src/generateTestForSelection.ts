import * as vscode from "vscode";
import { getFileExtension } from "./utils";
import { generateTest, ReqBody } from "./generate";
import { convertExtensionToLanguage } from "./constants";
import { BACKEND_URL } from "./config";

export const generateTestForSelection = async () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor");
    return;
  }
  const selectionText = editor.document.getText(editor.selection);
  if (selectionText.length === 0) {
    vscode.window.showErrorMessage("Empty selection.");
    return;
  }
  const filepath = editor.document.fileName;
  const fileExtension = getFileExtension(filepath);
  const body: ReqBody = {
    code: selectionText,
    extension: fileExtension as string,
    testFramework: "jest",
  };
  let response: string;
  try {
    response = await generateTest(BACKEND_URL, body);
  } catch (e) {
    vscode.window.showErrorMessage("Server error, please try again....");
    return;
  }
  const doc = await vscode.workspace.openTextDocument({
    content: response,
    language: convertExtensionToLanguage(fileExtension as string),
  });
  vscode.window.showTextDocument(doc);
};
