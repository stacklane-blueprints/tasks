
import {before, after} from 'form';
import {Task} from '📦';
import {task} from '🔗';
import {TaskJson} from '📤';

let beforeTask = null;
let afterTask = null;

if (before) beforeTask = Task.get(before);
if (after) afterTask = Task.get(after);

let moveTask = task.get();

if (afterTask){

    if (beforeTask){
        // Create position between 'before' and 'after' Tasks:
        moveTask.hierarchy = afterTask.hierarchy.before(beforeTask.hierarchy);
    } else {
        // Next position after 'after' Task (making the moved Task last):
        moveTask.hierarchy = afterTask.hierarchy.next();
    }

} else {

    try {
        if (beforeTask != moveTask){
            // Move to position to the first Task,
            // making the moved Task the first Task:
            let firstTask = Task.all().get(); // already in ascending order
            moveTask.hierarchy = firstTask.hierarchy.previous();
        }
    } catch ($ModelNotFound){
        // Nothing to do / ignore
    }

}

TaskJson(moveTask);