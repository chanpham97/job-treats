import { Schema, model } from 'mongoose'

const userSchema = new Schema({
    name: { type: String, required: true, unique: true },
    weeklyGoal: { type: Number },
    earnedTreats: [{
        treatType: { type: Schema.Types.ObjectId, ref: 'TreatType' },
        earnedAt: { type: Date, default: Date.now },
        weekOf: { type: Date, required: true },
        redeemed: { type: Boolean, default: false }
    }]
});

const User = model('User', userSchema);

export default User