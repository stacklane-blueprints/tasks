/**
 * TODO improve remote fetch error handling scenarios
 */
(function () {
    'use strict';

    const getDropInfo = function(evt){
        var moveId = evt.dataTransfer.getData('text/plain');
        // if (!moveId) return null; // not workable. something to do with ordering of events

        var s = '[data-task-id="' + moveId  + '"]';

        var moveElement = document.querySelector(s);

        var afterId = evt.target.getAttribute('data-task-id');
        var afterElement = null;

        var beforeId = null;
        var beforeElement = null;

        if (afterId){
            afterElement = evt.target;

            if (evt.target.nextElementSibling){
                beforeId = evt.target.nextElementSibling.getAttribute('data-task-id');
                beforeElement = evt.target.nextElementSibling;
                if (beforeId == moveId) return null;
            }
        } else {
            if (evt.target.getAttribute('data-target') == 'tasks.addTaskPanel'){
                afterId = 'top';
            }
        }

        if (!afterId || moveId == afterId) return null;

        return {
            moveId: moveId, moveElement: moveElement,
            beforeId: beforeId, beforeElement: beforeElement,
            afterId: afterId, afterElement: afterElement};
    };

    const Move = function(dropInfo){
        var data = new FormData();
        if (dropInfo.afterId != 'top') data.append('after', dropInfo.afterId);
        if (dropInfo.beforeId) data.append('before', dropInfo.beforeId);

        fetch('/api/tasks/' + dropInfo.moveId + '/move', {
            method: 'POST', body: data, headers:{ Accept: 'application/json' },
            credentials: 'same-origin', mode: 'same-origin'
        }).then(function (response) {
            if (response.status != 200) {
                console.error(response);
                response.json().then(function(j){  /* consume */ });
            } else {
                response.json().then(function(j){
                    dropInfo.moveElement.setAttribute('data-task-hierarchy', j.hierarchy);
                });
            }
        }).catch(function (ex) {
            console.error(ex);
        });
    };

    App.register("tasks", class extends Stimulus.Controller {
        static get targets() {
            return ["template", "addTaskPanel", "addTaskInput", "states", "list", "active", "complete"];
        }
        connect(){
            this.showActive();

            var thiz = this;
            var tp = this.addTaskPanelTarget;

            tp.addEventListener('dragover', function(evt){
                evt.preventDefault();
                return false;
            }, false);

            tp.addEventListener('dragenter', function(evt){
                evt.target.classList.add('is-over');
            }, false);

            tp.addEventListener('dragleave', function(evt){
                evt.target.classList.remove('is-over');
            }, false);

            tp.addEventListener('drop', function(evt){
                var di = getDropInfo(evt);
                if (di == null) return;

                var list = thiz.listTarget;

                if (list.children.length > 1){
                    list.insertBefore(di.moveElement, list.children[0]);
                    Move(di);
                } else {
                    // otherwise this operation is inapplicable
                }
            }, false);
        }
        _showStatus(status){
            this.listTarget.innerHTML = '';

            var isComplete = status == 'complete';

            this.completeTarget.classList.toggle('is-active', isComplete);
            this.activeTarget.classList.toggle('is-active', !isComplete);
            this.element.classList.toggle('is-showing-complete', isComplete);

            // TODO loading spinner / indicator

            var thiz = this;

            fetch('/api/tasks/status/' + status, {
                method: 'GET',
                credentials: 'same-origin', mode: 'same-origin',
                headers:{ Accept: 'application/json' }
            }).then(function (response) {
                if (response.status != 200) {
                    console.error(response);
                } else {
                    response.json().then(function(j){
                        for (var i = 0; i < j.length; i++) {
                            thiz._appendTask(j[i].title, j[i].id, j[i].status, j[i].hierarchy);
                        }
                    });
                }
            }).catch(function (ex) {
                console.error(ex);
            });
        }
        showActive(){
            this._showStatus('active');
        }
        showComplete(){
            this._showStatus('complete');
        }
        add(evt){
            evt.preventDefault(); evt.stopPropagation();

            var title = this.addTaskInputTarget.value;
            this.addTaskInputTarget.value = '';

            var newRow = this._appendTask(title);

            var data = new FormData();
            data.append('title', title);

            fetch('/api/tasks', {
                method: 'POST', body: data, headers:{ Accept: 'application/json' },
                credentials: 'same-origin', mode: 'same-origin'
            }).then(function (response) {
                if (response.status != 200) {
                    console.error(response);
                } else {
                    response.json().then(function(j){
                        newRow.setAttribute('data-task-id', j.id);
                        newRow.setAttribute('data-task-hierarchy', j.hierarchy);
                    });
                }
            }).catch(function (ex) {
                console.error(ex);
            });
        }
        _appendTask(titleText, id, status, hierarchy){
            var template = this.templateTarget;
            var clone = document.importNode(template.content, true);

            var title = clone.querySelector("[data-target='task.title']");
            title.value = titleText;

            var top = clone.querySelector("[class~='task']");

            if (id) top.setAttribute('data-task-id', id);

            if (hierarchy) top.setAttribute('data-task-hierarchy', hierarchy);

            if (status == 'complete') top.classList.add('is-complete');

            this.listTarget.appendChild(clone);

            return top;
        }
    });

    App.register('task', class extends Stimulus.Controller {
        static get targets() {
            return ["title"];
        }
        connect(){
            var clone = this.element;

            clone.addEventListener('dragstart', function(evt){
                evt.target.classList.add('is-dragging');
                evt.dataTransfer.dropEffect = 'move';
                evt.dataTransfer.setData('text/plain', evt.target.getAttribute('data-task-id'));
            }, false);

            clone.addEventListener('dragover', function(evt){
                if (!getDropInfo(evt)) return;
                evt.preventDefault();
                return false;
            }, false);

            clone.addEventListener('dragenter', function(evt){
                if (!getDropInfo(evt)) return;
                evt.target.classList.add('is-over');
            }, false);

            clone.addEventListener('dragleave', function(evt){
                evt.target.classList.remove('is-over');
            }, false);

            clone.addEventListener('dragend', function(evt){
                document.querySelector('[data-target="tasks.addTaskPanel"]').classList.remove('is-over');

                [].forEach.call(clone.parentElement.children, function (c) {
                    c.classList.remove('is-over');
                    c.classList.remove('is-dragging');
                });
            }, false);

            clone.addEventListener('drop', function(evt){
                var di = getDropInfo(evt);
                if (di == null) return;

                di.afterElement.parentElement.insertBefore(di.moveElement, di.afterElement.nextSibling);

                Move(di);
            });
        }
        markComplete(event){
            this.element.classList.add('is-complete');

            var data = new FormData();
            data.append('status', 'complete');

            var thiz = this;
            fetch('/api/tasks/' + this.data.get('id'), {
                method: 'PUT', body: data, headers:{ Accept: 'application/json' },
                credentials: 'same-origin', mode: 'same-origin'
            }).then(function (response) {
                if (response.status != 200) {
                    console.error(response);
                } else {
                    response.json().then(function(j){
                        if (j.status == 'complete'){
                            thiz.element.parentElement.removeChild(thiz.element);
                        }
                    });
                }
            }).catch(function (ex) {
                console.error(ex);
            });
        }
        changeTitle(event){
            event.preventDefault();
            event.stopPropagation();

            // Prevent duplicates in e.g. Safari:
            if (this.changing) return;
            this.changing = true;

            var data = new FormData();
            data.append('title', this.titleTarget.value);

            var thiz = this;
            this.titleTarget.blur();

            fetch('/api/tasks/' + this.data.get('id'), {
                method: 'PUT', body: data, headers:{ Accept: 'application/json' },
                credentials: 'same-origin', mode: 'same-origin'
            }).then(function (response) {
                if (response.status != 200) {
                    console.error(response);
                } else {
                    response.json().then(function(j){  /* consume */ });
                }
            }).catch(function (ex) {
                console.error(ex);
            }).finally(function(){
                thiz.changing = false;
            });
        }
    });
})();