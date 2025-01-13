import axios from "axios";

export interface ReqBody {
  code: string;
  extension: string;
  testFramework: string;
}
export interface Import {
  path: string;
  code: string;
}
export interface ReqBodyV2 extends ReqBody {
  imports: Import[];
}
export interface ReqBodyV3 extends ReqBodyV2 {
  sampleTest: string;
}
export const generateTest = async (backendUrl: string, body: ReqBody) => {
  return "hello";
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

export const generateTestV2 = async (backendUrl: string, body: ReqBodyV2) => {
  const path = `${backendUrl}/generate/v2`;
  const response = await axios({
    method: "POST",
    url: path,
    responseType: "stream",
    data: body,
  });
  return response;
};

export const generateTestWithStreaming = async (
  backendUrl: string,
  body: ReqBody,
) => {
  const path = `${backendUrl}/streaming_test`;
  const response = await axios({
    method: "POST",
    url: path,
    responseType: "stream",
    data: body,
  });
  return response;
};

export const generateForSelection = async (
  backendUrl: string,
  body: ReqBodyV2,
) => {
  const path = `${backendUrl}/generate/selection`;
  const response = await axios({
    method: "POST",
    url: path,
    responseType: "stream",
    data: body,
  });
  return response;
};

export const generateTestWithSample = async (
  backendUrl: string,
  body: ReqBodyV3,
) => {
  const path = `${backendUrl}/generate/v3`;
  const response = await axios({
    method: "POST",
    url: path,
    responseType: "stream",
    data: body,
  });
  return response;
};
