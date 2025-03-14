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
    await connect(`mongodb+srv://iamchanpham:${process.env.DB_PASS}@cluster0.6646g.mongodb.net/jobtreat${process.env.DB_ENV}?retryWrites=true&w=majority&appName=Cluster0`)
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
    actionType: { type: Schema.Types.ObjectId, ref: 'ActionType', required: true },
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    formattedDate: { type: String }
});

const actionTypeSchema = new Schema({
    name: { type: String, required: true },
    points: { type: Number, default: 0 }
});

const userSchema = new Schema({
    name: { type: String, required: true, unique: true },
    weeklyGoal: { type: Number }
});

const User = model('User', userSchema);
const Action = model('Action', actionSchema);
const ActionType = model('ActionType', actionTypeSchema)

function formatDate(date) {
    // Check if date is a string and parse it
    if (typeof date === 'string') {
        date = new Date(date);
    }
    // Use UTC methods to avoid timezone issues
    const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = date.getUTCDate().toString().padStart(2, "0");
    const year = date.getUTCFullYear().toString().slice(-2);
    
    // console.log(date, `${month}/${day}/${year}`)
    return `${month}/${day}/${year}`;
}

async function getUsersWithPoints() {
    // Calculate current week's Sunday boundaries
    const now = new Date();
    const currentDay = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
    
    // Calculate last Sunday (start of week)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate next Sunday (end of week)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);
    
    console.log(startOfWeek, endOfWeek)

    return User.aggregate([
        {
            $lookup: {
                from: 'actions',
                localField: '_id',
                foreignField: 'user',
                as: 'actions'
            }
        },
        {
            $addFields: {
                experiencePoints: {
                    $sum: '$actions.points'
                },
                // Add new weeklyPoints calculation
                weeklyPoints: {
                    $sum: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$actions',
                                    as: 'action',
                                    cond: {
                                        $and: [
                                            // Only include actions from current week
                                            { $gte: ['$$action.date', startOfWeek] },
                                            { $lt: ['$$action.date', endOfWeek] },
                                            // Only include positive points
                                            { $gt: ['$$action.points', 0] }
                                        ]
                                    }
                                }
                            },
                            as: 'weeklyAction',
                            in: '$$weeklyAction.points'
                        }
                    }
                }
            }
        }
    ]);
}

app.get("/", async function (req, res) {
    const data = {
        users: await getUsersWithPoints({}),
        actionTypes: await ActionType.find(),
        actions: await Action.find()
        .sort({ date: -1 })
        .limit(8)
        .populate("user")
    }
    console.log(data.users)
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

app.patch("/user/update", async function (req, res) {
    try {
        const user = await User.findOneAndUpdate(
            { name: req.body.originalName },
            { 
                $set: { 
                    name: req.body.updatedName,
                    weeklyGoal: req.body.weeklyGoal
                }
            },
            { 
                new: true,
                runValidators: true
            }
        );
        res.json(user)
    } catch (error) {
        console.error(error.message);
    }
})


app.get("/actions", async function (req, res) {
    res.json(await Action.find().sort({ date: -1 }).populate("user"))
})

app.post("/action/add", async function (req, res) {
    let actionDate = req.body.date ? new Date(req.body.date) : new Date();
    console.log(`Posting ${req.body.name} for ${req.body.user} on ${actionDate}`)

    const user = await User.findOne({ name: req.body.user })
    
    const newAction = new Action({
        name: req.body.name,
        user: user._id,
        actionType: req.body.actionType,
        points: Number(req.body.points),
        date: actionDate,
        formattedDate: formatDate(actionDate)
    })

    try {
        const response = await newAction.save()
        res.json(response)
    } catch (error) {
        console.error(error.message);
    }
})

app.delete('/action/delete/:id', async (req, res) => {
    try {
        const deletedAction = await Action.findOneAndDelete({ _id: req.params.id });

        if (!deletedAction) {
            return res.status(404).json({ message: 'Action not found' });
        }

        res.json({ message: 'Action deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get("/history", async function (req, res) {
    const data = {
        users: await User.find(),
        actionTypes: await ActionType.find(),
        actions: await Action.find().sort({ date: -1 }).limit(8).populate("user")
    }
    res.render("history.ejs", data)
})

app.get("/profile/:name", async function (req, res) {
    const userData = await User.findOne({name: req.params.name})
    userData["joinDate"] = formatDate(userData._id.getTimestamp())
    const data = {
        user: userData,
        actions: await Action.find({user: userData._id}).sort({ date: -1 })
    }
    console.log(data)
    res.render("profile.ejs", data)
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server started")
})
