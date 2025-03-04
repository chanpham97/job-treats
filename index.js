import express from 'express'
import mongodb from 'mongodb'
import { connect, Schema, model } from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()

try {
    await connect(`mongodb+srv://iamchanpham:${process.env.DB_PASS}@cluster0.6646g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
    console.log("Connected to MongoDB")
} catch (error) {
    console.log(error)
}

app.set("view engine", "ejs")
app.use(express.static(__dirname + "/public"))
app.use(express.json());

app.use((req, res, next) => {
    console.log(req.method + " " + req.path)
    next()
})

const actionSchema = new Schema({
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    formattedDate: { type: String }
});

const userSchema = new Schema({
    name: { type: String, required: true, unique: true },
    experiencePoints: { type: Number, default: 0 },
    spendingPoints: { type: Number, default: 0 }
});

const User = model('User', userSchema);
const Action = model('Action', actionSchema);

function formatDate(date) {
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString().slice(-2);
    return `${month}/${day}/${year}`;
}

app.get("/", async function (req, res) {
    const data = {
        users: await User.find(),
        actions: await Action.find().sort({ date: -1 }).limit(8).populate("user")
    }
    res.render("scoreboard.ejs", data)
})

app.get("/users", async function (req, res) {
    res.json(await User.find())
})

app.post("/user/add", async function (req, res) {
    const newUser = new User({
        name: req.body.name
    })

    try {
        const response = await newUser.save()
        res.json(response)
    } catch (error) {
        console.error(error.message);
    }
})

app.post("/user/adjust-points", async function (req, res) {
    const user = await User.findOne({ name: req.body.user })
    try {
        user.experiencePoints += req.body.points
        const response = await user.save()
        res.json(response)
    } catch (error) {
        console.error(error.message);
    }
})

app.get("/actions", async function (req, res) {
    res.json(await Action.find().sort({ date: -1 }).populate("user"))
})

app.post("/action/add", async function (req, res) {
    console.log(`Posting ${req.body.name} for ${req.body.user}`)
    const user = await User.findOne({ name: req.body.user })

    const newAction = new Action({
        name: req.body.name,
        user: user._id,
        points: Number(req.body.points),
        formattedDate: formatDate(new Date())
    })

    try {
        const response = await newAction.save()
        user.experiencePoints += req.body.points
        await user.save()
        res.json(response)
    } catch (error) {
        console.error(error.message);
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server started")
})
