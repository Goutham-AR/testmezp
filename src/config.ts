import * as vscode from "vscode";

export const getBackendUrl = () => {
  const config = vscode.workspace.getConfiguration("testme");
  return config.get<string>("apiUrl");
};
