const express = require('express')
const mongodb = require('mongodb')
const mongoose = require('mongoose')
require('dotenv').config()

const app = express()

try {
 await mongoose.connect(`mongodb+srv://iamchanpham:${process.env.DB_PASS}@cluster0.6646g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
 console.log("Connected to MongoDB")
} catch {
    console.log(error)
}

app.set("view engine", "ejs")
app.use(express.static(__dirname + "/public"))
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method + " " + req.path)
  next()
})

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    experience: { type: Number, default: 0 },
    spendingPoints: { type: Number, default: 0 },
    actions: { type: [ actionSchema ] }
});  

const actionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now }
});  

const User = mongoose.model('User', userSchema);
const Action = mongoose.model('Action', actionSchema);

app.get("/", (req, res)=>{
    res.sendFile(__dirname + "/public/index.html")
})

app.listen(3000, ()=>{
    console.log("Server started")
})
