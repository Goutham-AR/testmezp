import * as vscode from "vscode";

export const CONFIG_NAMES = {
  API_URL: "apiUrl",
  MODEL_NAME: "modelName",
  CONTEXT_LENGTH: "contextLength",
};

export function getConfig(configName: string) {
  const config = vscode.workspace.getConfiguration("testme");
  return config.get<string>(configName);
} 
export const getBackendUrl = () => {
  const config = vscode.workspace.getConfiguration("testme");
  return config.get<string>("apiUrl");
};

export const getModelName = () => {
  const config = vscode.workspace.getConfiguration("testme");
  return config.get<string>("modelName");
};
