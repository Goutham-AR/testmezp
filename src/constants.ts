const extensionToLanguageMapper: Record<string, string> = {
  ts: "typescript",
  js: "javascript",
  tsx: "typescript",
  jsx: "javascript",
};

export const convertExtensionToLanguage = (extension: string) => {
  const language = extensionToLanguageMapper[extension];
  if (!language) {
    return "plaintext";
  }
  return language;
};
