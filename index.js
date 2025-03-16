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
    weeklyGoal: { type: Number },
    earnedTreats: [{
        treat: { type: Schema.Types.ObjectId, ref: 'Treat' },
        earnedAt: { type: Date, default: Date.now },
        weekOf: { type: Date, required: true }
    }]
});

const treatSchema = new Schema({
    name: { type: String, required: true },
    category: { type: String, enum: ['weekly', 'total'] },
    pointsRequired: Number,
    icon: String
});


const User = model('User', userSchema);
const Action = model('Action', actionSchema);
const ActionType = model('ActionType', actionTypeSchema)
const Treat = model('Treat', treatSchema)

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

function getStartOfWeek(date) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek
}

function getEndOfWeek(date) {
    const startOfWeek = getStartOfWeek(date)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek
}

async function getUsersForScoreboard() {
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
                // Experience points - only positive points
                experiencePoints: {
                    $sum: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$actions',
                                    as: 'action',
                                    cond: { $gt: ['$$action.points', 0] }
                                }
                            },
                            as: 'positiveAction',
                            in: '$$positiveAction.points'
                        }
                    }
                },
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
                                            { $gte: ['$$action.date', getStartOfWeek(new Date())] },
                                            { $lt: ['$$action.date', getEndOfWeek(new Date())] },
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
        },
        {
            $lookup: {
                from: 'treats',
                localField: 'earnedTreats.treat',
                foreignField: '_id',
                as: 'treatObjects'
            }
        },
        // Add weekly treats field
        {
            $addFields: {
                weeklyTreats: {
                    $map: {
                        input: {
                            $filter: {
                                input: '$earnedTreats',
                                as: 'earned',
                                cond: {
                                    $eq: [
                                        { $dateToString: { format: '%Y-%m-%d', date: '$$earned.weekOf' } },
                                        { $dateToString: { format: '%Y-%m-%d', date: getStartOfWeek(new Date()) } }
                                    ]
                                }
                            }
                        },
                        as: 'weeklyEarned',
                        in: {
                            $mergeObjects: [
                                '$$weeklyEarned',
                                {
                                    treatDetails: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$treatObjects',
                                                    as: 'treatObj',
                                                    cond: { $eq: ['$$treatObj._id', '$$weeklyEarned.treat'] }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        },
        // Project only the fields we need
        {
            $project: {
                _id: 1,
                name: 1,
                weeklyGoal: 1,
                experiencePoints: 1,
                weeklyPoints: 1,
                weeklyTreats: 1
            }
        }
    ])
}

app.get("/", async function (req, res) {
    const userData = await getUsersForScoreboard()
    console.log(userData)
    const data = {
        users: userData,
        actionTypes: await ActionType.find().sort({ points: -1 }),
        actions: await Action.find()
            .sort({ date: -1 })
            .limit(5)
            .populate("user")
    }
    // console.log(data.users)
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
    const userData = await User.findOne({ name: req.params.name })
    userData["joinDate"] = formatDate(userData._id.getTimestamp())
    const data = {
        user: userData,
        actions: await Action.find({ user: userData._id }).sort({ date: -1 })
    }
    console.log(data)
    res.render("profile.ejs", data)
})

app.get("/treats/weekly", async function (req, res) {
    res.json(await Treat.find({ category: 'weekly' }))
})

app.patch("/treats/user-add", async function (req, res) {
    const { userId, treatId } = req.body;

    const user = await User.findById(userId).populate('earnedTreats')
    if (!user) {
        return res.status(404).send(`User with ID ${userId} not found`);
    }

    const treat = await Treat.findById(treatId);
    if (!treat) {
        return res.status(404).send(`Treat with ID ${treatId} not found`);
    }

    const now = new Date();
    const weekOf = getStartOfWeek(now);

    const existingTreat = user.earnedTreats.find(earned =>
        earned.treat.toString() === treatId &&
        new Date(earned.weekOf).toDateString() === weekOf.toDateString()
    );

    if (existingTreat) {
        return res.status(409).send('User already has this treat for the current week');
    }

    user.earnedTreats.push({
        treat: treatId,
        earnedAt: now,
        weekOf: weekOf
    });

    try {
        const response = await user.save()
        res.json(response)
    } catch (error) {
        console.error(error.message);
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server started")
})
