const express = require("express");
const app = express();
const cors = require("cors");
// const port = 5000;
app.use(express.json());
// app.use(cors());

//middleware
//Must remove "/" from your production URL
app.use(
  cors({
    origin: ["http://localhost:3000", "https://hotel-relex.vercel.app"],
    credentials: true,
  })
);
require("dotenv").config();

// const dbuser = hotelRelexDb;
// const dbppass = Djk0lCrf6r1baq8h;
// env set
const port = process.env.PORT || 5000;
const dbUserName = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

// mogodb setting
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const bookingCollection = database.collection("booking");

    // get

    app.get("/hotels", async (req, res) => {
      const cusor = hotelCollection.find();
      const result = await cusor.toArray();
      res.send(result);
    });

    app.get("/booking", async (req, res) => {
      const cusor = bookingCollection.find();
      const result = await cusor.toArray();
      res.send(result);
    });
    // get single data

    app.get("/hotels/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await hotelCollection.findOne(query);
      res.send(result);
    });
    // booking
    app.get("/booking/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.findOne(query);
      res.send(result);
    });

    //hotel post

    app.post("/hotels", async (req, res) => {
      const hotel = req.body;
      const result = await hotelCollection.insertOne(hotel);
      res.send(result);
      console.log(result);
    });

    // booking post

    app.post("/booking", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
      console.log("server", result);
    });

    // update

    app.put("/hotels/:id", async (req, res) => {
      const id = req.params.id;
      const hotel = req.body;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updateProduct = {
        $set: {
          name: hotel.name,
          description: hotel.description,
          image: hotel.image,
          price: hotel.price,
          // amenities: hotel.amenities.selectedAmenities,
        },
      };
      const result = await hotelCollection.updateOne(
        filter,
        updateProduct,
        option
      );
      res.send(result);
      console.log();
    });

    // Delete the first document in  collection

    app.delete("/hotels/:id", async (req, res) => {
      const id = req.params.id;
      console.log("hotel is delete ", id);
      const query = { _id: new ObjectId(id) };
      const result = await hotelCollection.deleteOne(query);
      res.send(result);
    });

    // booking delete

    app.delete("/booking/:id", async (req, res) => {
      const id = req.params.id;
      console.log("booking id delete  ", id);
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
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
  res.send("This is the Hotel-Relex Server");
});

app.get("/data", async (req, res) => {
  res.send(data);
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
