const express = require("express");
const axios = require("axios");
const cors = require("cors");
const morgan = require("morgan");
const { createClient } = require("redis");

const app = express();
const redisClient = createClient({ legacyMode: true });

connectRedis();

const DEFAULT_EXPIRATION = 3600;

app.use(cors());
app.use(morgan("dev"));

app.get("/photos", (req, res) => {
  const albumId = req.query.albumId;
  redisClient.get(`photos?albumId=${albumId}`, async (error, photos) => {
    if (error) console.error(error);
    if (photos !== null) {
      return res.json(JSON.parse(photos));
    } else {
      const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/photos",
        { params: { albumId } }
      );
      redisClient.setEx(
        `photos?albumId=${albumId}`,
        DEFAULT_EXPIRATION,
        JSON.stringify(data)
      );

      return res.json(data);
    }
  });
});

app.get("/photos/:id", async (req, res) => {
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
  );

  res.json(data);
});

async function connectRedis() {
  await redisClient.connect();
  console.log("connected");
}

app.listen(3000);
