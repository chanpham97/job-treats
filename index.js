import express from 'express'
import { connect } from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { router as actionRoutes, getRecentActions, getActionsForUserProfile, getActionCountsForUserProfile } from './routes/actionRoutes.js'
import { router as userRoutes, getUsersForScoreboard, getAllUsers, getUserProfileData } from './routes/userRoutes.js'
import { getActionTypes } from './routes/actionTypeRoutes.js'
import treatTypesRoutes from './routes/treatTypeRoutes.js'

dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express()

try {
    await connect(`mongodb+srv://iamchanpham:${process.env.DB_PASS}@cluster0.6646g.mongodb.net/jobtreat${process.env.DB_ENV}?retryWrites=true&w=majority&appName=Cluster0`)
    console.log("Connected to MongoDB")
} catch (error) {
    console.log(error)
}

app.set("view engine", "ejs")
app.use(express.static(__dirname + "/public"))
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form submissions

app.use((req, res, next) => {
    console.log(req.method + " " + req.path)
    next()
})

app.use('/action', actionRoutes)
app.use('/user', userRoutes)
app.use('/treats', treatTypesRoutes)

app.get("/", async function (req, res) {
    const data = {
        users: await getUsersForScoreboard(),
        actionTypes: await getActionTypes(),
        actions: await getRecentActions(5)
    }

    res.render("scoreboard.ejs", data)
})

app.get("/history", async function (req, res) {
    const data = {
        users: await getAllUsers(),
        actionTypes: await getActionTypes(),
        actions: await getRecentActions(8)
    }
    res.render("history.ejs", data)
})

app.get("/profile/:name", async function (req, res) {
    const userData = await getUserProfileData(req.params.name)
   
    const data = {
        user: userData,
        actions: await getActionsForUserProfile(userData._id),
        actionCounts: await getActionCountsForUserProfile(userData._id, ["Applied to a job", "Completed a job interview"])
    }

    // console.log(data)
    res.render("profile.ejs", data)
})


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server started")
})
