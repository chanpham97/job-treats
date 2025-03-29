import { Schema, model } from 'mongoose'

const actionSchema = new Schema({
    actionType: { type: Schema.Types.ObjectId, ref: 'ActionType', required: true },
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    formattedDate: { type: String }
});

const Action = model('Action', actionSchema);

export default Action;