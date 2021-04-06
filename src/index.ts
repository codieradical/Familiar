import * as dotenv from "dotenv"
dotenv.config();
import { connect } from "mongoose"

import DebugModule from "./modules/DebugModule"
import HelpModule from "./modules/HelpModule"

import * as packageInfo from "../package.json"
import TaskModule from "./modules/TasksModule";

console.log(`&&& ${packageInfo.name} v${packageInfo.version} &&&`)

connect(process.env.MONGO_DB_CONNECT_STRING, { useUnifiedTopology: true, useNewUrlParser: true })
    .then(() => { console.log("& Mongoose connected. ")})

export const modules = [
    new HelpModule(),

    new DebugModule(),
    new TaskModule()
]

modules.forEach(module => {
    module.registerModule()
});
