const dotenv = require('dotenv')
const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const cors = require('cors');
dotenv.config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
const uri = process.env.MONGO_URI;
app.use(cors())
app.use(express.json())


// const jwtVerify = 

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    await client.connect();

    const db = client.db('doc-appoint');
    const doctorsCollection = db.collection('doctors')
    const bookingCollection = db.collection('bookings')

    app.get('/doctors', async (req, res) => {
      const result = await doctorsCollection.find().toArray();
      res.send(result)
    })
    app.get('/doctors/search', async (req, res) => {
      const nameQuery = req.query.name;
      const result = await doctorsCollection.find({
        name: { $regex: nameQuery, $options: 'i' }
      }).toArray()
      res.send(result)
    })
    app.get('/doctors/:id', async (req, res, next) => {
      const header = req.headers.authorization;
      console.log(header);
      if (!header) {
        return res.status(401).json({ message: 'Unauthorized' })
      }
      const token = header.split(" ")[1]

      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' })
      }
      const JWKS = createRemoteJWKSet(
        new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
      )
      try {
        const { payload } = await jwtVerify(token, JWKS,)
        console.log(payload);
        next()
      } catch (error) {
        return res.status(403).json({ message: "forbidden" })
      }

    }, async (req, res) => {
      const { id } = req.params;

      const result = await doctorsCollection.findOne({
        _id: new ObjectId(id)
      })
      // console.log(result);
      res.json(result)
    });
    app.get('/top-doctors', async (req, res) => {
      const result = await doctorsCollection.find().sort({ rating: -1 }).limit(3).toArray()
      res.send(result)
    })
    // app.get('/doctors/:id', async (req, res, next) => {
    //   try {
    //     const header = req.headers.authorization;
    //     console.log("Authorization Header:", header);

    //     // ১. হেডার না থাকলে এখানেই 'return' করে দিন
    //     if (!header) {
    //       return res.status(401).json({ message: 'Unauthorized' });
    //     }

    //     const token = header.split(" ")[1];
    //     console.log(token);
    //     // ২. টোকেন না থাকলে এখানেই 'return' করে দিন
    //     if (!token) {
    //       return res.status(401).json({ message: 'Unauthorized' });
    //     }

    //     const JWKS = createRemoteJWKSet(
    //       new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
    //     );

    //     // ৩. ভেরিফিকেশনটি ট্রাই-ক্যাচ ব্লকের ভেতরেই রাখুন
    //     const { payload } = await jwtVerify(token, JWKS);
    //     console.log("JWT Payload:", payload);

    //     req.user = payload; // ভবিষ্যতের জন্য পেলোডটি রিকোয়েস্টে সেভ করে রাখা ভালো
    //     next(); // সবকিছু ঠিক থাকলে পরের ফাংশনে যাবে

    //   } catch (error) {
    //     console.error("JWT Verification Error:", error.message);
    //     // ৪. টোকেন ইনভ্যালিড বা এক্সপায়ারড হলে এখানে এসে 'return' হবে
    //     return res.status(403).json({ message: "forbidden" });
    //   }

    // }, async (req, res) => {
    //   try {
    //     const { id } = req.params;

    //     // আইডি ভ্যালিড কি না চেক করার সেফটি গার্ড
    //     if (!ObjectId.isValid(id)) {
    //       return res.status(400).json({ message: "Invalid Doctor ID Format" });
    //     }

    //     const result = await doctorsCollection.findOne({
    //       _id: new ObjectId(id)
    //     });

    //     if (!result) {
    //       return res.status(404).json({ message: "Doctor not found" });
    //     }

    //     console.log("Doctor Data Found:", result);
    //     res.status(200).json(result); // সবসময় .json() ব্যবহার করুন

    //   } catch (error) {
    //     console.error("Database Error:", error);
    //     res.status(500).json({ message: "Internal Server Error" });
    //   }
    // });

    app.get('/bookings/:userId', async (req, res) => {
      const { userId } = req.params;

      const result = await bookingCollection.find({ userId }).toArray();
      res.send(result)
    })
    app.patch('/bookings/:bookingId', async (req, res) => {
      const { bookingId } = req.params;
      const updatedData = req.body;
      console.log(bookingId, updatedData);
      const result = await bookingCollection.updateOne({
        _id: new ObjectId(bookingId)
      },
        { $set: updatedData },
      )
      res.send(result)
    })
    app.delete('/bookings/:id', async (req, res) => {
      const { id } = req.params;
      const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result)
    })
    app.post('/bookings', async (req, res) => {
      const booking = req.body
      const result = await bookingCollection.insertOne(booking);
      res.send(result)
    })
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    // await client.close();
  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
  res.send('Hello From Doc Appoint')
})
app.listen(port, () => {
  console.log(`The server is running on port ${port}`);
})