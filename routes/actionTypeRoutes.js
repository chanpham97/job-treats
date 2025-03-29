import express from 'express'
import ActionType from "../models/ActionType.js"

async function getActionTypes(){
    return ActionType.find().sort({ points: -1 })
}

export { getActionTypes }