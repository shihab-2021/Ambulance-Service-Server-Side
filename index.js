const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri =
  "mongodb+srv://rescuereach1:nWJUNlTL8iu1i87X@cluster0.ryfai5z.mongodb.net/?retryWrites=true&w=majority";
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
    await client.connect();
    const database = client.db("rescueReach");
    const usersCollection = database.collection("users");
    const activeUsersCollection = database.collection("activeUsers");
    const emergencyCollection = database.collection("emergency");
    const rideRequestCollection = database.collection("rideRequest");
    const rideBookedCollection = database.collection("rideBooked");
    const rideCompletedCollection = database.collection("rideCompleted");
    const reportsCollection = database.collection("reports");
    const doctorsCollection = database.collection("doctors");

    const activeUsers = [];

    // Socket.io connection
    // Socket.io connection
    // io.on("connection", (socket) => {
    //   console.log("A user connected");

    //   socket.on("sendLocation", async (data) => {
    //     // Destructure latitude and longitude from the data
    //     const { latitude, longitude } = data;
    //     console.log(data);

    //     // Insert the user's location into the database
    //     const user = await activeUsersCollection.insertOne({
    //       latitude,
    //       longitude,
    //     });
    //     activeUsers.push(user);

    //     // Emit the data back to the frontend for real-time updates (optional)
    //     io.emit("locationUpdate", { latitude, longitude });
    //   });

    //   socket.on("disconnect", () => {
    //     console.log("User disconnected");

    //     // Remove user from the activeUsers array on disconnect
    //     const userIndex = activeUsers.findIndex(
    //       (user) => user.socketId === socket.id
    //     );
    //     if (userIndex !== -1) {
    //       activeUsers.splice(userIndex, 1);
    //     }

    //     // Emit the updated activeUsers array to all clients
    //     io.emit("activeUsersUpdate", activeUsers);
    //   });
    // });

    // user post api
    app.post("/users-data", async (req, res) => {
      const cursor = await usersCollection.insertOne(req.body);
      res.json(cursor);
    });

    // users when the first time register put api
    app.put("/users-data", async (req, res) => {
      const query = { email: req.body.email };
      const options = { upsert: true };
      const updateDocs = { $set: req.body };

      // getting user info if already have in the db
      const userInfo = await usersCollection.findOne(query);
      if (userInfo) {
        res.send("already in the db ");
      } else {
        const result = await usersCollection.updateOne(
          query,
          updateDocs,
          options
        );
      }
    });

    // put user for google login
    app.put("/users-data", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // user profile update api here
    app.put("/profile-update", async (req, res) => {
      const query = { email: req.body.email };
      const options = { upsert: true };
      const updateDocs = { $set: req.body };
      const result = await usersCollection.updateOne(
        query,
        updateDocs,
        options
      );
      res.json(result);
    });

    // users follow and following api start here
    app.put("/user", async (req, res) => {
      const bloggerId = req.body.bloggerId;
      const userId = req.body.userId;
      const options = { upsert: true };

      // getting blogger info here
      const blogger = await usersCollection.findOne({
        _id: new ObjectId(bloggerId),
      });
      const bloggerPayload = {
        id: blogger?._id,
        email: blogger?.email,
        name: blogger?.displayName,
        image: blogger?.image,
      };
      // getting user info here
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      const userPayload = {
        id: user?._id,
        email: user?.email,
        name: user?.displayName,
        image: user?.image,
      };

      // update blogger here
      const bloggerDocs = {
        $push: { followers: userPayload },
      };
      // update user here
      const userDocs = {
        $push: { following: bloggerPayload },
      };

      const updateBlogger = await usersCollection.updateOne(
        blogger,
        bloggerDocs,
        options
      );
      const updateUser = await usersCollection.updateOne(
        user,
        userDocs,
        options
      );
      res.send("followers following updated");
    });

    // and user follow and following api end here
    app.get("/users", async (req, res) => {
      const user = usersCollection.find({});
      const result = await user.toArray();
      res.send(result);
    });

    // and user follow and following api end here
    // app.get("/users-data", async (req, res) => {
    //   const user = usersCollection.find({});
    //   const result = await user.toArray();
    //   res.send(result);
    // });

    // users information by email
    app.get("/users-data/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection?.findOne(query);
      res.json(user);
    });

    //make admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    //make admin
    app.put("/users/user", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "Patient" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });

    // for single user
    app.get("/user/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const cursor = await usersCollection?.findOne(query);
      res.json(cursor);
      console.log(cursor);
    });

    // blog delete api
    app.delete("/delete-user/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const result = await usersCollection?.deleteOne(query);
      res.json(result);
    });

    app.put("/activeUsers-data", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: { ...user, lastUpdated: new Date() } };
      const result = await activeUsersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    app.get("/active-users", async (req, res) => {
      const user = activeUsersCollection.find({});
      const result = await user.toArray();
      res.send(result);
    });

    setInterval(async () => {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - 1);
      // Remove inactive users from the database
      // await usersCollection.deleteMany({ lastUpdated: { $lt: now } });
      const deleteResult = await activeUsersCollection.deleteMany({
        lastUpdated: { $lte: cutoffTime },
      });
      console.log(deleteResult);
      const currentDate = new Date();

      // const user = activeUsersCollection.find({});
      // const result = await user;

      // Retrieve all data from the database
      const allData = await rideRequestCollection.find({}).toArray();

      // const time = new Date(allData[2]?.ride)

      // Filter out old data based on the dateTime field
      const oldData = allData.filter(
        (item) => new Date(item.rideDateTime) < currentDate
      );

      // Delete old data from the database
      const result = await rideRequestCollection.deleteMany({
        _id: { $in: oldData.map((item) => item._id) },
      });
      console.log(result);
      const allDocuments = await activeUsersCollection.find({}).toArray();

      // Log the update time for each document
      allDocuments.forEach((document) => {
        console.log(
          `Document ID: ${document._id}, Last Updated: ${document.lastUpdated}`
        );
      });

      // Get all active users and emit data to frontend for real-time updates
      // const activeUsers = await usersCollection.find({}).toArray();
      // io.emit("locationUpdate", activeUsers);
    }, 10000);

    // for getting all emergency
    app.get("/emergency", async (req, res) => {
      const cursor = emergencyCollection?.find({});
      const emergency = await cursor?.toArray();
      res.json(emergency);
    });

    // for posting emergency
    app.post("/emergency", async (req, res) => {
      const emergency = req.body;
      const result = await emergencyCollection.insertOne(emergency);
      res.json(result);
    });

    // for single emergency
    app.get("/emergency/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const cursor = await emergencyCollection?.findOne(query);
      res.json(cursor);
    });

    // for single emergency by email
    app.get("/emergency-rider/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await emergencyCollection?.findOne(query);
      res.json(user);
    });

    // emergency delete api
    app.delete("/delete-emergency/:email", async (req, res) => {
      const query = { email: req?.params?.email };
      const result = await emergencyCollection?.deleteOne(query);
      res.json(result);
    });

    // for getting all rideRequest
    app.get("/rideRequest", async (req, res) => {
      const cursor = rideRequestCollection?.find({});
      const rideRequest = await cursor?.toArray();
      res.json(rideRequest);
    });

    // for posting rideRequest
    app.post("/rideRequest", async (req, res) => {
      const rideRequest = req.body;
      const result = await rideRequestCollection.insertOne(rideRequest);
      res.json(result);
    });

    // for single rideRequest
    app.get("/rideRequest/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const cursor = await rideRequestCollection?.findOne(query);
      res.json(cursor);
    });

    // rideRequest delete api
    app.delete("/delete-rideRequest/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const result = await rideRequestCollection?.deleteOne(query);
      res.json(result);
    });

    // for getting all booked ride
    app.get("/rideBooked", async (req, res) => {
      const cursor = rideBookedCollection?.find({});
      const rideRequest = await cursor?.toArray();
      res.json(rideRequest);
    });

    // for posting booked ride
    app.post("/rideBooked", async (req, res) => {
      const rideRequest = req.body;
      const result = await rideBookedCollection.insertOne(rideRequest);
      res.json(result);
    });

    // for single booked ride
    app.get("/rideBooked/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const cursor = await rideBookedCollection?.findOne(query);
      res.json(cursor);
    });

    // booked ride delete api
    app.delete("/delete-rideBooked/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const result = await rideBookedCollection?.deleteOne(query);
      res.json(result);
    });

    // for getting all completed ride
    app.get("/rideCompleted", async (req, res) => {
      const cursor = rideCompletedCollection?.find({});
      const rideRequest = await cursor?.toArray();
      res.json(rideRequest);
    });

    // for posting completed ride
    app.post("/rideCompleted", async (req, res) => {
      const rideRequest = req.body;
      const result = await rideCompletedCollection.insertOne(rideRequest);
      res.json(result);
    });

    // for single completed ride
    app.get("/rideCompleted/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const cursor = await rideCompletedCollection?.findOne(query);
      res.json(cursor);
    });

    // completed ride delete api
    app.delete("/delete-rideCompleted/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const result = await rideCompletedCollection?.deleteOne(query);
      res.json(result);
    });

    // for getting all completed ride
    app.get("/report", async (req, res) => {
      const cursor = reportsCollection?.find({});
      const rideRequest = await cursor?.toArray();
      res.json(rideRequest);
    });

    // for posting completed ride
    app.post("/report", async (req, res) => {
      const rideRequest = req.body;
      const result = await reportsCollection.insertOne(rideRequest);
      res.json(result);
    });

    // for single completed ride
    app.get("/report/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const cursor = await reportsCollection?.findOne(query);
      res.json(cursor);
    });

    // completed ride delete api
    app.delete("/delete-report/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const result = await reportsCollection?.deleteOne(query);
      res.json(result);
    });

    // for getting all doctors info
    app.get("/doctor", async (req, res) => {
      const cursor = doctorsCollection?.find({});
      const rideRequest = await cursor?.toArray();
      res.json(rideRequest);
    });

    // for posting doctors info
    app.post("/doctor", async (req, res) => {
      const rideRequest = req.body;
      const result = await doctorsCollection.insertOne(rideRequest);
      res.json(result);
    });

    // for single doctors info
    app.get("/doctor/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const cursor = await doctorsCollection?.findOne(query);
      res.json(cursor);
    });

    // doctors info delete api
    app.delete("/delete-doctor/:id", async (req, res) => {
      const query = { _id: new ObjectId(req?.params?.id) };
      const result = await doctorsCollection?.deleteOne(query);
      res.json(result);
    });

    // http.listen(5000, () => {
    //   console.log(`Server running on http://localhost:${port}`);
    // });
  } finally {
    // await client.close()
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`<h1>Rescue Reach Server Running</h1>`);
});

app.listen(port, () => {
  console.log(`Listening port: ${port}`);
});
