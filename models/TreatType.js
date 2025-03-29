import { Schema, model } from 'mongoose'

const treatTypeSchema = new Schema({
    name: { type: String, required: true },
    category: { type: String, enum: ['weekly', 'total'] },
    pointsRequired: Number,
    icon: String
});

const TreatType = model('TreatType', treatTypeSchema)


export default TreatType