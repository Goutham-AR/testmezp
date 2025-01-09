const axios = require("axios");

const main = async () => {
  const response = await axios({
    method: "POST",
    url: "http://0.0.0.0:8000/streaming_test",
    responseType: "stream",
  });
  response.data.on("data", (chunk) => {
    console.log(chunk.toString());
  });
  response.data.on("end", () => {
    console.log("stream ended");
  });
  response.data.on("error", (err) => {
    console.error(err);
  });
};

main();
