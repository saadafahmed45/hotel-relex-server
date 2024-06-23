const express = require("express");
const app = express();
const cors = require("cors");
// const port = 5000;
app.use(express.json());
app.use(cors());
require("dotenv").config();

// const dbuser = hotelRelexDb;
// const dbppass = Djk0lCrf6r1baq8h;
// env set
const port = process.env.PORT || 5000;
const dbUserName = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

// mogodb setting
const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${dbUserName}:${dbPassword}@cluster0.58zpnyp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("hotelRelexDatabase");
    const hotelCollection = database.collection("hotels");

    // get

    app.get("/hotels", async (req, res) => {
      const cusor = hotelCollection.find();
      const result = await cusor.toArray();
      res.send(result);
    });

    // post

    app.post("/hotels", async (req, res) => {
      const hotel = req.body;
      const result = await hotelCollection.insertOne(hotel);
      res.send(result);
      console.log(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("start server");
});

app.get("/data", async (req, res) => {
  res.send(data);
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
