import express from 'express'
import mongoose from 'mongoose'
import Action from "../models/Action.js"
import ActionType from "../models/ActionType.js"
import { getUser } from "./userRoutes.js"
import { formatDate } from "../util/dateUtils.js"
const router = express.Router()

router.get("/all", async function (req, res) {
    res.json(await Action.find().sort({ date: -1 }).populate("user"))
})

router.post("/add", async function (req, res) {
    let actionDate = req.body.date ? new Date(req.body.date) : new Date();
    console.log(`Posting ${req.body.name} for ${req.body.user} on ${actionDate}`)

    const user = await getUser(req.body.user)
    if (!user) {
        return res.status(404).send(`User not found`);
    }

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

router.delete('/delete/:id', async (req, res) => {
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

async function getRecentActions(count) {
    return Action.find()
        .sort({ date: -1 })
        .limit(count)
        .populate("user")
}

async function getActionsForUserProfile(userId) {
    return Action.find({ user: userId }).sort({ date: -1 })
}

async function getActionCountsForUserProfile(userId, actionTypeNames = null) {
    try {
        const matchStage = { user: new mongoose.Types.ObjectId(userId) };

        if (actionTypeNames && actionTypeNames.length > 0) {
            matchStage["actionType"] = {
                $in: await ActionType.find({ name: { $in: actionTypeNames } }).distinct("_id")
            };
        }

        console.log(matchStage)

        const actionCounts = await Action.aggregate([
            { $match: matchStage },
            {
                $lookup: {
                    from: "actiontypes",
                    localField: "actionType",
                    foreignField: "_id",
                    as: "actionTypeDetails"
                }
            },
            { $unwind: "$actionTypeDetails" },
            { 
                $group: { 
                    _id: "$actionTypeDetails.name", 
                    count: { $sum: 1 } 
                }
            }
        ]);

        return actionCounts.reduce((acc, action) => {
            acc[action._id] = action.count;
            return acc;
        }, {});

    } catch (error) {
        console.error("Error in getUserActionBreakdown:", error);
        return {};
    }
};

export { router, getRecentActions, getActionsForUserProfile, getActionCountsForUserProfile as getActionCountsForUserProfile }