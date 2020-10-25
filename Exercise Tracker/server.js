const express = require('express')
const app = express()

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

const personSchema = mongoose.Schema({
  "username": {type: String, required: true},
  "count": Number,
  "log": [
    {
      "description": String,
      "duration": Number,
      "date": String
    }
  ]
})

const Person = mongoose.model("Person", personSchema);

app.use(cors())

app.use(express.urlencoded({extended: false}))
app.use(express.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



app.post("/api/exercise/new-user", (req, res) => {
  const newUser = new Person({"username":req.body.username})
  newUser.save((err, result) => {
    if (err) return console.log(err)
    res.status(200).json({
      "_id": result._id, "username": result.username
    })
  })
})

app.post("/api/exercise/add", (req, res) => {
  let {userId, description, duration, date} = req.body;
  if (date === '') {
    date = new Date().toDateString();
  } else {
    date = new Date(date).toDateString();
  }
  Person.findById(userId, (err, person) => {
    if (err) return console.log(err)
    person.log.push({
      "description": description,
      "duration": duration,
      "date": String(date)
    })
    person.save((err, result) => {
      if (err) return console.log(err)
      res.status(200).json({
        "_id": userId,
        "username": result.username,
        "date": String(date),
        "duration": Number(duration),
        "description": description
      })
    })
  })
})

app.get("/api/exercise/users", (req, res) => {
  Person
  .find()
  .select({id: 1, username: 1})
  .exec((err, results) => {
    if (err) return console.log(err)
    res.status(200).json(results)
  })
})

app.get("/api/exercise/log", (req, res) => {
  Person
  .findOne({"_id": req.query.userId})
  .select({'log._id': 0, '__v': 0})
  .exec((err, result) => {
    if (err) return console.log(err);
    let resultCopy = result;
    if (req.query.from || req.query.to) {
      let from = new Date(0)
      let to = new Date()
      if (req.query.from) {
        from = new Date(req.query.from);
      }
      if (req.query.to) {
        to = new Date(req.query.to);
      }
      from = from.getTime()
      to = to.getTime()

      resultCopy.log = resultCopy.log.filter((eachLog) => {
        let eachLogDate = new Date(eachLog.date).getTime()
        return eachLogDate >= from && eachLogDate <= to
      })
    }
    if (req.query.limit) {
      resultCopy.log = resultCopy.log.slice(0, req.query.limit)
    }
    resultCopy.count = resultCopy.log.length;
    res.status(200).json(resultCopy)
  })
})



// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
