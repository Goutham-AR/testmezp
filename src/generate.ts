import axios from "axios";

export interface ReqBody {
  code: string;
  extension: string;
  testFramework: string;
}
export const generateTest = async (backendUrl: string, body: ReqBody) => {
  const path = `${backendUrl}/generate`;
  const response = await axios.post(
    path,
    {
      code: body.code,
      extension: body.extension,
      test_framework: body.testFramework,
    },
    { headers: { "Content-Type": "application/json" } },
  );
  return response.data;
};
