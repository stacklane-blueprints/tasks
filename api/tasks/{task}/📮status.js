import {task} from '🔗';
import {TaskJson, ChangeTaskStatus} from "📤";

let live = task.get();

ChangeTaskStatus.submit(live);

TaskJson(live);