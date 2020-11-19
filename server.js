const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const shortid = require("shortid");
const cors = require("cors");

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
let exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: String
});

let userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [exerciseSchema]
});

let Session = new mongoose.model("Session", exerciseSchema);
let User = new mongoose.model("User", userSchema);
var arrUsers = [];
app.post("/api/exercise/new-user", (req, res) => {
  const { username } = req.body;
  let newUser = new User({
    username: username
  });
  newUser.save((err, savedUser) => {
    if (!err) {
      let responseObj = {};
      responseObj["username"] = savedUser.username;
      responseObj["_id"] = savedUser.id;
      res.json(responseObj);
      arrUsers.push(responseObj);
    }
  });
});
app.get("/api/exercise/users", (req, res) => {
  res.json(arrUsers);
});

app.post("/api/exercise/add", (req, res) => {
  const { userId, description, duration, date } = req.body;
  let newDate = new Date(date ? date : Date()).toISOString().substring(0, 10);
  let newSession = new Session({
    _id: userId,
    description: description,
    duration: parseInt(duration),
    date: newDate
  });
  User.findByIdAndUpdate(
    userId,
    { $push: { log: newSession } },
    { new: true },
    (err, updatedUser) => {
      if (!err) {
        let responseObject = {};
        responseObject["_id"] = updatedUser.id;
        responseObject["username"] = updatedUser.username;
        responseObject["date"] = new Date(newSession.date).toDateString();
        responseObject["duration"] = newSession.duration;
        responseObject["description"] = newSession.description;
        res.json(responseObject);
      }
    }
  );
});

app.get("/api/exercise/log",(req,res) => {
  const {userId} = req.query;
  User.findById(userId,(err,result) => {
    if(!err){
      let responseObject=result
      
      if(req.query.limit){
        responseObject.log=responseObject.log.slice(0,req.query.limit)
      }
      responseObject['count']=result.log.length
      res.json(responseObject)
    }
  })
})