import * as vscode from "vscode";
import { getFileExtension, writeStreamingOutput } from "./utils";
import { generateForSelection, ReqBodyV2 } from "./generate";
import { BACKEND_URL } from "./config";
import { AxiosResponse } from "axios";

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
  const body: ReqBodyV2 = {
    code: selectionText,
    extension: fileExtension as string,
    testFramework: "jest",
    imports: [],
  };
  let response: AxiosResponse;
  try {
    response = await generateForSelection(BACKEND_URL, body);
  } catch (e) {
    vscode.window.showErrorMessage("Server error, please try again....");
    return;
  }
  await writeStreamingOutput(response, fileExtension as string);
};
