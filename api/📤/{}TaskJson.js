/**
 * Function to map a Task object to JSON
 */

import {Task} from '📦';

let convert = (task)=>({
    id: task.id,
    status: task.status,
    title: task.title,
    hierarchy: task.hierarchy.value
});

export {convert as TaskJson}