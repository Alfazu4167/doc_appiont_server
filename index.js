const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const cors = require('cors');
const dotenv = require('dotenv')
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

    app.get('/doctors', async (req, res) => {
      const result = await doctorsCollection.find().toArray();
      res.send(result)
    })
    app.get('/doctors/:id', async(req,res)=>{
      const {id} = req.params;
      
      const result = await doctorsCollection.findOne({
        _id: new ObjectId(id)
      })
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