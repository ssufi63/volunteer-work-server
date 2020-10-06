const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const admin = require('firebase-admin')
require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.haywb.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const port = 5000

const app = express()

app.use(cors());
app.use(bodyParser.json());


var serviceAccount = require("./configs/volunteer-work-e9ac1-firebase-adminsdk-9z09s-827d4256f6.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://volunteer-work-e9ac1.firebaseio.com"
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const registration = client.db("volunteerWork").collection("registration");

  app.post('/addRegistration', (req, res) => {
    const newRegistration = req.body;
    registration.insertOne(newRegistration)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  })

  app.get('/registrations', (req, res) => {
    const bearer = req.headers.authorization
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            registration.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
          else{
            res.status(401).send('Un-authorized Access')
          }
        }).catch(function (error) {
          res.status(401).send('Un-authorized Access')
        });
    }
    else{
      res.status(401).send('Un-authorized Access')
    }
  })

  app.get('/allRegistrations', (req, res) => {
    registration.find({})
    .toArray((err, documents) =>{
      res.send(documents)
    })
  })
});

app.listen(process.env.PORT || port)