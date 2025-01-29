import axios from "axios";
import OpenAI from "openai";

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
  framework: string;
  imports: Import[];
}
export interface ReqBodyV3 extends ReqBodyV2 {
  sampleTest: string;
}

export const generateV3 = async (
  modelName: string,
  backendUrl: string,
  prompt: string,
  stream: boolean,
) => {
  const openai = new OpenAI({
    baseURL: backendUrl,
    apiKey: "key",
  });
  const response = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: "user", content: prompt }],
    stream,
  });
  return response;
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
