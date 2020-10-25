// IMPORTS

'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns')
var cors = require('cors');
const url = require('url');
var app = express();
var port = process.env.PORT || 3000;

// DATABASE 

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = mongoose.Schema({
  url: {type: String, required: true}
});

const Url = mongoose.model("Url", urlSchema);

// ROUTES

const regEx = /^https?:\/\//i

app.use(cors());
app.use(express.urlencoded());

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});
  
app.post("/api/shorturl/new", (req, res) => {

  const urlParsed = url.parse(req.body.url)
   dns.lookup(urlParsed.host, (err) => {
    if (err !== null || urlParsed.protocol === 'ftp:') {
      res.json({"error": "invalid url"})
    } else {
      const url = new Url({url: req.body.url});
      url.save((err, result) => {
        if (err) return console.log(err);
        const obj = {"original_url": result.url, "short_url": result._id}
        res.json(obj)
      });
    }
  });
});

app.get("/api/shorturl/:id", (req, res) => {
  Url.findById(req.params.id, (err, result) => {
    if (err) return res.status(500).json({"error": "invalid url"})
    if (!regEx.test(result.url)) {
      result.url = `http://${result.url}`;
    }
    res.redirect(result.url)
  })
});

app.listen(port, () => {
  console.log('Node.js listening ...');
})