export const getFileExtension = (filepath: string) => {
  // TODO: does not support windows paths
  return filepath.split("/").pop()?.split(".").pop();
};
