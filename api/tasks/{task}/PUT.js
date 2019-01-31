import {task} from '🔗';
import {TaskJson} from "📤";
import {Task} from '📦';
import {title, status} from 'form';

let live = task.get();

if (title) {
    live.title = title;
}

if (status) {
    if (status == Task.status.active) live.status = Task.status.active;
    if (status == Task.status.complete) live.status = Task.status.complete;
}

TaskJson(live);