const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { SEED_HOTELS } = require("./seedData");

app.use(express.json());

// CORS configuration for local Next.js and production URLs
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://hotel-relex.vercel.app",
    ],
    credentials: true,
  })
);

const port = process.env.PORT || 5000;
const dbUserName = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

const uri = `mongodb+srv://${dbUserName}:${dbPassword}@cluster0.58zpnyp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Helper for safe ID/slug querying
function getMongoQuery(id) {
  if (!id) return { _id: null };
  const strId = String(id).trim();
  if (ObjectId.isValid(strId) && String(new ObjectId(strId)) === strId) {
    return { $or: [{ _id: new ObjectId(strId) }, { slug: strId }, { _id: strId }] };
  }
  return { $or: [{ slug: strId }, { _id: strId }] };
}

async function run() {
  try {
    await client.connect();
    const database = client.db("hotelRelexDatabase");
    const hotelCollection = database.collection("hotels");
    const bookingCollection = database.collection("booking");

    // ==========================================
    // HOTELS / SANCTUARIES ROUTES
    // ==========================================

    // Get all hotels
    app.get("/hotels", async (req, res) => {
      try {
        const cursor = hotelCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      } catch (err) {
        console.error("Error fetching hotels:", err);
        res.status(500).send({ message: err.message });
      }
    });

    // Get single hotel by ObjectId or Slug
    app.get("/hotels/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = getMongoQuery(id);
        const result = await hotelCollection.findOne(query);
        if (!result) {
          return res.status(404).send({ message: "Sanctuary not found" });
        }
        res.send(result);
      } catch (err) {
        console.error(`Error fetching hotel ${req.params.id}:`, err);
        res.status(500).send({ message: err.message });
      }
    });

    // Add new hotel / sanctuary with rich fields
    app.post("/hotels", async (req, res) => {
      try {
        const hotel = req.body;
        const slug =
          hotel.slug ||
          (hotel.name
            ? hotel.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "")
            : `sanctuary-${Date.now()}`);

        const hotelDoc = {
          name: hotel.name || "Untitled Sanctuary",
          slug,
          category: hotel.category || "Rooms",
          tagline: hotel.tagline || "",
          price: Number(hotel.price) || 0,
          size: hotel.size || "45 m² / 485 sq ft",
          guests: hotel.guests || "2 Guests",
          bed: hotel.bed || "King Bed",
          view: hotel.view || "Panoramic View",
          image: hotel.image || "",
          gallery: Array.isArray(hotel.gallery)
            ? hotel.gallery
            : typeof hotel.gallery === "string"
            ? hotel.gallery.split(",").map((s) => s.trim()).filter(Boolean)
            : [hotel.image].filter(Boolean),
          shortDescription:
            hotel.shortDescription ||
            (hotel.description ? hotel.description.slice(0, 140) + "..." : ""),
          description: hotel.description || "",
          amenities: Array.isArray(hotel.amenities)
            ? hotel.amenities
            : typeof hotel.amenities === "string"
            ? hotel.amenities.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          highlights: Array.isArray(hotel.highlights)
            ? hotel.highlights
            : typeof hotel.highlights === "string"
            ? hotel.highlights.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          createdAt: new Date().toISOString(),
        };

        const result = await hotelCollection.insertOne(hotelDoc);
        res.send({ ...result, insertedDoc: hotelDoc });
      } catch (err) {
        console.error("Error creating hotel:", err);
        res.status(500).send({ message: err.message });
      }
    });

    // Update hotel
    app.put("/hotels/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const hotel = req.body;
        const filter = getMongoQuery(id);

        const updateDoc = {
          $set: {
            name: hotel.name,
            category: hotel.category || "Rooms",
            tagline: hotel.tagline || "",
            price: Number(hotel.price) || 0,
            size: hotel.size || "",
            guests: hotel.guests || "",
            bed: hotel.bed || "",
            view: hotel.view || "",
            image: hotel.image || "",
            gallery: Array.isArray(hotel.gallery)
              ? hotel.gallery
              : typeof hotel.gallery === "string"
              ? hotel.gallery.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            shortDescription: hotel.shortDescription || "",
            description: hotel.description || "",
            amenities: Array.isArray(hotel.amenities)
              ? hotel.amenities
              : typeof hotel.amenities === "string"
              ? hotel.amenities.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            highlights: Array.isArray(hotel.highlights)
              ? hotel.highlights
              : typeof hotel.highlights === "string"
              ? hotel.highlights.split(",").map((s) => s.trim()).filter(Boolean)
              : [],
            updatedAt: new Date().toISOString(),
          },
        };

        const result = await hotelCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (err) {
        console.error("Error updating hotel:", err);
        res.status(500).send({ message: err.message });
      }
    });

    // Delete hotel
    app.delete("/hotels/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = getMongoQuery(id);
        const result = await hotelCollection.deleteOne(query);
        res.send(result);
      } catch (err) {
        console.error("Error deleting hotel:", err);
        res.status(500).send({ message: err.message });
      }
    });

    // Seed local luxury data to MongoDB (usable via browser GET or API POST)
    const handleSeedHotels = async (req, res) => {
      try {
        let seededCount = 0;
        for (const item of SEED_HOTELS) {
          await hotelCollection.updateOne(
            { slug: item.slug },
            {
              $set: {
                ...item,
                updatedAt: new Date().toISOString(),
              },
              $setOnInsert: {
                createdAt: new Date().toISOString(),
              },
            },
            { upsert: true }
          );
          seededCount++;
        }
        const total = await hotelCollection.countDocuments();
        res.send({
          success: true,
          message: `Successfully seeded ${seededCount} curated luxury sanctuaries into MongoDB!`,
          totalInDatabase: total,
        });
      } catch (err) {
        console.error("Error seeding hotels:", err);
        res.status(500).send({ success: false, message: err.message });
      }
    };

    app.post("/seed-hotels", handleSeedHotels);
    app.get("/seed-hotels", handleSeedHotels);

    // ==========================================
    // BOOKING ROUTES
    // ==========================================

    // Get all bookings (with optional email or phone filtering)
    app.get("/booking", async (req, res) => {
      try {
        const { email, phone } = req.query;
        let filter = {};
        if (email || phone) {
          const conditions = [];
          if (email) {
            const emailRegex = new RegExp(`^${email.trim()}$`, "i");
            conditions.push({ email: emailRegex });
            conditions.push({ "customersDetails.email": emailRegex });
          }
          if (phone) {
            const phoneRegex = new RegExp(phone.trim(), "i");
            conditions.push({ phoneNumber: phoneRegex });
            conditions.push({ "customersDetails.phoneNumber": phoneRegex });
          }
          if (conditions.length > 0) {
            filter = { $or: conditions };
          }
        }
        const cursor = bookingCollection.find(filter).sort({ _id: -1 });
        const result = await cursor.toArray();
        res.send(result);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        res.status(500).send({ message: err.message });
      }
    });

    // Dedicated status check endpoint by email and/or phone number
    app.get("/booking/check", async (req, res) => {
      try {
        const { email, phone, number } = req.query;
        const rawEmail = (email || "").trim();
        const rawPhone = (phone || number || "").trim();

        if (!rawEmail && !rawPhone) {
          return res.status(400).send({
            success: false,
            message: "Please provide an email address or phone number to check reservation status.",
            bookings: [],
          });
        }

        const conditions = [];

        if (rawEmail) {
          const escapedEmail = rawEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const emailRegex = new RegExp(`^${escapedEmail}$`, "i");
          conditions.push({ email: emailRegex });
          conditions.push({ "customersDetails.email": emailRegex });
        }

        if (rawPhone) {
          const escapedPhone = rawPhone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const phoneRegex = new RegExp(escapedPhone, "i");
          const digitsOnly = rawPhone.replace(/\D/g, "");
          conditions.push({ phoneNumber: phoneRegex });
          conditions.push({ "customersDetails.phoneNumber": phoneRegex });
          if (digitsOnly.length >= 6) {
            conditions.push({ phoneNumber: new RegExp(digitsOnly, "i") });
            conditions.push({ "customersDetails.phoneNumber": new RegExp(digitsOnly, "i") });
          }
        }

        const query = { $or: conditions };
        const cursor = bookingCollection.find(query).sort({ _id: -1 });
        const rawBookings = await cursor.toArray();

        // Format and normalize records for guest presentation
        const bookings = rawBookings.map((b) => {
          const firstname = b.firstname || b.customersDetails?.firstname || "";
          const lastname = b.lastname || b.customersDetails?.lastname || "";
          const guestEmail = b.email || b.customersDetails?.email || "";
          const guestPhone = b.phoneNumber || b.customersDetails?.phoneNumber || "";
          const hotelName =
            b.hotelName ||
            b.customersDetails?.bookingDetails?.hotel?.name ||
            "Luxury Sanctuary";
          const hotelId =
            b.hotelId ||
            b.customersDetails?.bookingDetails?.hotel?._id ||
            "";
          const checkIn =
            b.checkIn || b.customersDetails?.bookingDetails?.checkIn || "";
          const checkOut =
            b.checkOut || b.customersDetails?.bookingDetails?.checkOut || "";
          const totalPrice =
            b.totalPrice ||
            b.customersDetails?.bookingDetails?.totalPrice ||
            0;
          const roomsQuantity =
            b.roomsQuantity ||
            b.customersDetails?.bookingDetails?.roomsQuantity ||
            "1";
          const adult =
            b.adult || b.customersDetails?.bookingDetails?.adult || "2";
          const children =
            b.children || b.customersDetails?.bookingDetails?.childen || "0";
          const status = b.status || "Confirmed";
          const createdAt = b.createdAt || new Date().toISOString();
          const referenceId = "RELEX-" + String(b._id).slice(-6).toUpperCase();

          return {
            _id: b._id,
            referenceId,
            status,
            firstname,
            lastname,
            fullName: `${firstname} ${lastname}`.trim() || "Valued Guest",
            email: guestEmail,
            phoneNumber: guestPhone,
            hotelName,
            hotelId,
            checkIn,
            checkOut,
            nights: b.nights || 1,
            totalPrice,
            roomsQuantity,
            adult,
            children,
            specialRequests: b.specialRequests || "",
            createdAt,
          };
        });

        res.send({
          success: true,
          count: bookings.length,
          bookings,
        });
      } catch (err) {
        console.error("Error checking booking status:", err);
        res.status(500).send({ success: false, message: err.message, bookings: [] });
      }
    });

    // Update booking status
    app.patch("/booking/:id/status", async (req, res) => {
      try {
        const id = req.params.id;
        const { status } = req.body;
        if (!status) {
          return res.status(400).send({ message: "Status is required." });
        }
        const query = getMongoQuery(id);
        const result = await bookingCollection.updateOne(query, {
          $set: { status, updatedAt: new Date().toISOString() },
        });
        res.send(result);
      } catch (err) {
        console.error("Error updating booking status:", err);
        res.status(500).send({ message: err.message });
      }
    });

    // Get single booking
    app.get("/booking/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = getMongoQuery(id);
        const result = await bookingCollection.findOne(query);
        res.send(result);
      } catch (err) {
        console.error("Error fetching booking:", err);
        res.status(500).send({ message: err.message });
      }
    });

    // Add booking (dual format to support new luxury UI & legacy dashboard)
    app.post("/booking", async (req, res) => {
      try {
        const b = req.body;
        const firstname = b.firstname || b.customersDetails?.firstname || "";
        const lastname = b.lastname || b.customersDetails?.lastname || "";
        const email = b.email || b.customersDetails?.email || "";
        const phoneNumber = b.phoneNumber || b.customersDetails?.phoneNumber || "";
        const hotelName =
          b.hotelName ||
          b.customersDetails?.bookingDetails?.hotel?.name ||
          "Luxury Sanctuary";
        const hotelId =
          b.hotelId ||
          b.customersDetails?.bookingDetails?.hotel?._id ||
          "";
        const checkIn =
          b.checkIn || b.customersDetails?.bookingDetails?.checkIn || "";
        const checkOut =
          b.checkOut || b.customersDetails?.bookingDetails?.checkOut || "";
        const totalPrice =
          b.totalPrice ||
          b.customersDetails?.bookingDetails?.totalPrice ||
          0;
        const roomsQuantity =
          b.roomsQuantity ||
          b.customersDetails?.bookingDetails?.roomsQuantity ||
          "1";
        const adult =
          b.adult || b.customersDetails?.bookingDetails?.adult || "2";
        const children =
          b.children || b.customersDetails?.bookingDetails?.childen || "0";

        const bookingDoc = {
          firstname,
          lastname,
          email,
          phoneNumber,
          specialRequests: b.specialRequests || "",
          roomsQuantity,
          adult,
          children,
          checkIn,
          checkOut,
          nights: b.nights || 1,
          totalPrice,
          hotelId,
          hotelName,
          status: b.status || "Confirmed",
          createdAt: b.createdAt || new Date().toISOString(),
          // Nested compatibility wrapper for older dashboard components
          customersDetails: {
            firstname,
            lastname,
            email,
            phoneNumber,
            bookingDetails: {
              hotel: {
                _id: hotelId,
                name: hotelName,
              },
              checkIn,
              checkOut,
              roomsQuantity,
              adult,
              childen: children,
              totalPrice,
            },
          },
        };

        const result = await bookingCollection.insertOne(bookingDoc);
        res.send(result);
      } catch (err) {
        console.error("Error creating booking:", err);
        res.status(500).send({ message: err.message });
      }
    });

    // Delete booking
    app.delete("/booking/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = getMongoQuery(id);
        const result = await bookingCollection.deleteOne(query);
        res.send(result);
      } catch (err) {
        console.error("Error deleting booking:", err);
        res.status(500).send({ message: err.message });
      }
    });

    // Ping confirmation
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send({
    status: "online",
    service: "Hotel Relex Backend API",
    endpoints: {
      hotels: "/hotels",
      hotelByIdOrSlug: "/hotels/:id",
      seedHotels: "/seed-hotels",
      booking: "/booking",
      bookingById: "/booking/:id",
    },
  });
});

app.listen(port, () => {
  console.log(`Hotel Relex Server listening on port ${port}`);
});
