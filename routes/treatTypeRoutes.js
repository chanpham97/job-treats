import express from 'express'
import TreatType from "../models/TreatType.js"
import { getUserWithTreats  } from './userRoutes.js'
import { getStartOfWeek } from '../util/dateUtils.js'
const router = express.Router()

router.get("/weekly", async function (req, res) {
    res.json(await TreatType.find({ category: 'weekly' }))
})

router.patch("/user-add", async function (req, res) {
    const { name, treatTypeId } = req.body;

    const user = await getUserWithTreats(name)
    if (!user) {
        console.log(`User ${name} not found`)
        return res.status(404).send(`User ${name} not found`);
    }

    const treatType = await TreatType.findById(treatTypeId);
    if (!treatType) {

        console.log(`Treat with ID ${treatTypeId} not found`)
        return res.status(404).send(`Treat with ID ${treatTypeId} not found`);
    }

    const now = new Date();
    const weekOf = getStartOfWeek(now);
    console.log(`Adding treat ${treatTypeId} for user ${name} on week of ${weekOf}`)

    const existingTreat = user.earnedTreats.find(earned =>
        earned.treatType.toString() === treatTypeId &&
        new Date(earned.weekOf).toDateString() === weekOf.toDateString()
    );

    if (existingTreat) {
        return res.status(409).send('User already has this treat for the current week');
    }

    user.earnedTreats.push({
        treatType: treatTypeId,
        earnedAt: now,
        weekOf: weekOf,
        redeemed: false
    });

    try {
        const response = await user.save()
        console.log(response)
        res.json(response)
    } catch (error) {
        console.error(error.message);
    }
})

router.patch("/user-claim", async function (req, res) {
    const { userName, treatId } = req.body;
    console.log(`Claiming treat ${treatId} for ${userName}`)
    const user = await getUserWithTreats(userName)
    if (!user) {
        return res.status(404).send(`User ${userName} not found`);
    }
    console.log(user)
    const existingTreat = user.earnedTreats.find(earned => earned._id.toString() === treatId);
    if (!existingTreat) {
        return res.status(409).send('User does not have earned treat with this ID');
    }

    console.log(existingTreat)
    if (existingTreat.redeemed) {
        return res.status(409).send('User already redeemed this treat');
    } else {
        existingTreat.redeemed = true
    }

    try {
        const response = await user.save()
        res.json(response)
    } catch (error) {
        console.error(error.message);
    }
})

export default router;