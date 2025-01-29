import axios from "axios";

export class LLMService {
  constructor(private url: string) {}

  public async sendRequest<T>(path: string, body: T, streaming: boolean) {
    const resp = await axios({
      url: `${this.url}/${path}`,
      method: "POST",
      responseType: streaming ? "stream" : "json",
      data: body,
    });
    return resp;
  }
}
