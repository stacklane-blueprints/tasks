import {Task} from '📦';
import {TaskJson} from '📤';
import {status} from '🔗';

Task.status(status.$value).asc().map(TaskJson);