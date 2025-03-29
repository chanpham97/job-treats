import express from 'express'
import User from "../models/User.js"
import { formatDate, getStartOfWeek, getEndOfWeek } from '../util/dateUtils.js'
const router = express.Router()

router.get("/all", async function (req, res) {
    res.json(await User.find())
})

router.post("/add", async function (req, res) {
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

router.patch("/update", async function (req, res) {
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

async function getAllUsers() {
    return User.find()
}

async function getUser(name) {
    return User.findOne({ name: name })
}

async function getUserWithTreats(name){
    return User.findOne({name: name}).populate('earnedTreats')
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
                from: 'treattypes',
                localField: 'earnedTreats.treatType',
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
                                                    cond: { $eq: ['$$treatObj._id', '$$weeklyEarned.treatType'] }
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

async function getUserProfileData(name){
    const userData = await User.findOne({ name: name })
    .populate('earnedTreats.treatType')
    .lean()

    userData["joinDate"] = formatDate(userData._id.getTimestamp())
    for (let i = 0; i < userData.earnedTreats.length; i++){
        const treat = userData.earnedTreats[i]
        treat["weekOfFormatted"] = formatDate(treat.weekOf)
    }

    return userData
}

export { router, getUsersForScoreboard, getAllUsers, getUserProfileData, getUser, getUserWithTreats }