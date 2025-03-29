import { Schema, model } from 'mongoose'

const actionTypeSchema = new Schema({
    name: { type: String, required: true },
    points: { type: Number, default: 0 }
});

const ActionType = model('ActionType', actionTypeSchema)

export default ActionType;