const extensionToLanguageMapper: Record<string, string> = {
  ts: "typescript",
  js: "javascript",
  tsx: "typescript",
  jsx: "javascript",
  py: "python",
};

export const convertExtensionToLanguage = (extension: string) => {
  const language = extensionToLanguageMapper[extension];
  if (!language) {
    return "plaintext";
  }
  return language;
};

export const extensionToTestFramework = (extension: string) => {
  if (["tsx", "ts", "jsx", "js"].includes(extension)) {
    return "jest";
  } else if (extension === "py") {
    return "pytest";
  } else {
    return "";
  }
};
