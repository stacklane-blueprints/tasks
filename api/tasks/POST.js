import {Task} from '📦';
import {TaskJson} from '📤';
import {title} from 'form';

TaskJson(
    new Task()
        .title(title)
        .status(Task.status.active)
);