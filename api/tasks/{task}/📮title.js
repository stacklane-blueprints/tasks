import {task} from '🔗';
import {TaskJson, ChangeTaskTitle} from "📤";

let live = task.get();

ChangeTaskTitle.submit(live);

TaskJson(live);