const dotenv = require('dotenv')
const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const cors = require('cors');
dotenv.config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = process.env.MONGO_URI;
app.use(cors())
app.use(express.json())


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
    app.get('/doctors/:id', async (req, res) => {
      const { id } = req.params;

      const result = await doctorsCollection.findOne({
        _id: new ObjectId(id)
      })
      res.send(result)
    });
    app.get('/top-doctors', async (req, res) => {
      const result = await doctorsCollection.find().sort({ rating: -1 }).limit(3).toArray()
      res.send(result)
    })
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