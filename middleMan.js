const express = require("express");
const crypto = require("crypto");
const axios = require("axios");
const path = require("path");
const { domainExtract } = require("./utils");

let url = "",
  domain = "",
  id = {},
  keys = {},
  encryption = {},
  userQuery = {},
  flag = 0,
  searchEngine = "google",
  serve = flag ? "https://vprserver.herokuapp.com" : "http://localhost:7000";

const app = express();
const iv = crypto.randomBytes(16);
const port = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname, "client/build")));

const encrypt = (text, key, enc) => {
  const civ = enc ? (enc.includes("aes") ? iv : null) : iv;
  const cipher = crypto.createCipheriv(enc, key, civ);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  return {
    iv: civ ? civ.toString("hex") : null,
    content: encrypted.toString("hex"),
  };
};

const decrypt = (hash, key, enc) => {
  const decipher = crypto.createDecipheriv(
    enc,
    key,
    hash.iv ? Buffer.from(hash.iv, "hex") : null
  );

  const decrpyted = Buffer.concat([
    decipher.update(Buffer.from(hash.content, "hex")),
    decipher.final(),
  ]);

  return decrpyted.toString();
};

const getID = async (enc, req, res) => {
  if (!id[req.header("x-forwarded-for")])
    //req.header("x-forwarded-for")-->originating IP address of a client connecting to a web server through an HTTP proxy or a load balancer
    axios
      .get(`${serve}/getId`)
      .then(async (response) => {
        id[req.header("x-forwarded-for")] = response.data;
        await setEncryption(enc, req, res);
      })
      .catch((err) => console.log("Set Encryption Error:", err));
  else await setEncryption(enc, req, res);
};
const setEncryption = async (enc, req, res) => {
  encryption[req.header("x-forwarded-for")] = enc;
  const url = `${serve}/encryption?enc=${enc}&id=${
    id[req.header("x-forwarded-for")]
  }`;
  axios
    .get(url)
    .then((response) => {
      keys[req.header("x-forwarded-for")] = response.data; // get key from Server
      console.log("Encryption:", encryption[req.header("x-forwarded-for")]); // show encryption which is set at middleMan and server
      console.log(
        "Key:",
        keys[req.header("x-forwarded-for")],
        keys[req.header("x-forwarded-for")].length
      );
      console.log("ID:", id[req.header("x-forwarded-for")]);
    })
    .catch((err) => console.log("Set Encryption Error:", err));
};

const getResponse = async (query, req, res) => {
  /*Convert query into encrypted form and send encrypted query to the server */
  console.log(
    "Incoming Query:",
    query,
    "From :",
    req.header("x-forwarded-for")
  );
  query = encrypt(
    query,
    keys[req.header("x-forwarded-for")],
    encryption[req.header("x-forwarded-for")]
  );
  axios
    .get(
      `${serve}/query?iv=${query.iv}&content=${query.content}&id=${
        id[req.header("x-forwarded-for")]
      }`
    )
    .then((response) => {
      const data = response.data; // body of html
      if (data) {
        // userQuery[req.header("x-forwarded-for")] = "";

        res.send(
          decrypt(
            data,
            keys[req.header("x-forwarded-for")],
            encryption[req.header("x-forwarded-for")]
          )
        );
      } else res.send("Unable to Fetch");
    })
    .catch((err) => console.log("Get Response Error:", err));
};

getDomainWithProtocol = (url) => {
  let domainWithProtocol = new URL(url);
  return `${domainWithProtocol.protocol}//${domainWithProtocol.hostname}`;
};

app.get("/encryption", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  await getID(req.query.enc, req, res);
  res.send("");
});

app.get("/query", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  let query = req.query.q;

  if (query) {
    // userQuery[req.header("x-forwarded-for")] = query;
    domain = `https://${searchEngine}.com`;
    query = `${domain}/search?q=${query}`;
    await getResponse(query, req, res);
  } else res.send("");
});

app.get("/url", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  url = req.query.q;
  if (!url) return res.send("");
  domain = getDomainWithProtocol(url);
  await getResponse(url, req, res);
});

app.get("*", async (req, res) => {
  // extra response of file like logo, icon etc.
  res.header("Access-Control-Allow-Origin", "*");
  url = req.url;
  if (!url) res.send("");
  if (domain !== "") await getResponse(domain + url, req, res);
});

app.listen(port, (req, res) => {
  console.log(`server listening on port: ${port}`);
});
