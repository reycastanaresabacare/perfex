$(function() {
    // Init single task data
    if (typeof(taskid) !== 'undefined' && taskid !== '') {
        init_task_modal(taskid);
    }
    $('body').on('change', 'input[name="checklist-box"]', function() {
        var checked = $(this).prop('checked');
        if (checked == true) {
            val = 1;
        } else {
            val = 0;
        }
        var listid = $(this).parents('.checklist').data('checklist-id');
        $.get(admin_url + 'tasks/checkbox_action/' + listid + '/' + val);
        recalculate_checklist_items_progress();
    });

    $('body').on('click', '.task-single-delete-timesheet', function(e) {
        e.preventDefault();
        var r = confirm(confirm_action_prompt);
        if (r == false) {
            return false;
        } else {
            var _delete_timesheet_task_id = $(this).data('task-id');
            $.get($(this).attr('href'), function() {
                init_task_modal(_delete_timesheet_task_id);
                setTimeout(function() {
                    reload_tasks_tables();
                }, 20);
            });
        }
    });

    $('body').on('click', '.task-single-add-timesheet', function(e) {
        e.preventDefault();
        var start_time = $('body').find('.task-modal-single input[name="timesheet_start_time"]').val();
        var end_time = $('body').find('.task-modal-single input[name="timesheet_end_time"]').val();
        if (start_time != '' && end_time != '') {
            var data = {};
            data.start_time = start_time;
            data.end_time = end_time;
            data.timesheet_task_id = $(this).data('task-id');
            data.timesheet_staff_id = $('body').find('.task-modal-single select[name="single_timesheet_staff_id"]').val();
            $.post(admin_url + 'tasks/log_time', data).done(function(response) {
                response = JSON.parse(response);
                if (response.success == true) {
                    init_task_modal(data.timesheet_task_id);
                    alert_float('success', response.message);
                    setTimeout(function() {
                        reload_tasks_tables();
                    }, 20);
                } else {
                    alert_float('warning', response.message);
                }
            });
        }
    });

    $('body').on('click', '.copy_task_action', function() {
        var data = {};
        var copy_task_assignees, copy_task_followers, copy_task_checklist_items, copy_task_attachments;
        data.copy_from = $(this).data('task-copy-from');
        data.copy_task_assignees = $('body').find('#copy_task_assignees').prop('checked');
        data.copy_task_followers = $('body').find('#copy_task_followers').prop('checked');
        data.copy_task_checklist_items = $('body').find('#copy_task_checklist_items').prop('checked');
        data.copy_task_attachments = $('body').find('#copy_task_attachments').prop('checked');
        $.post(admin_url + 'tasks/copy', data).done(function(response) {
            response = JSON.parse(response);
            if (response.success == true) {
                init_task_modal(response.new_task_id);
                reload_tasks_tables();
            }
            alert_float(response.alert_type, response.message);
        });
        return false;
    });

    $('body').on('click', '.new-task-to-milestone', function(e) {
        e.preventDefault();
        var milestone_id = $(this).parents('.milestone-column').data('milestone-id');
        new_task(admin_url + 'tasks/task?rel_type=project&rel_id=' + project_id + '&milestone_id=' + milestone_id);
    });

    // Focus on subject when adding new task
    $('body').on('shown.bs.modal', '#_task_modal', function() {
        if ($('input[name="task_is_edit"]').length == 0) {
            tinyMCE.execCommand('mceAddControl', false, 'tinymce-task');
            $('body').find('#_task_modal input[name="name"]').focus();
        }
    });

    // Remove the tinymce description task editor
    $('body').on('hidden.bs.modal', '#_task_modal', function() {
        tinyMCE.remove('.tinymce-task');
    });

    // Fix the modal left column height when task modal open
    $('body').on('shown.bs.modal', '.task-modal-single', function() {
        fix_task_modal_left_col_height();
    });

    // when click close modal task tracking stats fix to do not close both modals
    $('body').on('click', '.close-task-stats', function() {
        $('#task-tracking-stats-modal').modal('hide');
    });

    $('body').on('blur', 'textarea[name="checklist-description"]', function() {
        var description = $(this).val();
        var listid = $(this).parents('.checklist').data('checklist-id');
        $.post(admin_url + 'tasks/update_checklist_item', {
            description: description,
            listid: listid
        });
    });

    // Assign task to staff member
    $('body').on('change', 'select[name="select-assignees"]', function() {
        $('body').append('<div class="dt-loader"></div>');
        var data = {};
        data.assignee = $('select[name="select-assignees"]').val();
        if (data.assignee != '') {
            data.taskid = taskid;
            $.post(admin_url + 'tasks/add_task_assignees', data).done(function(response) {
                $('body').find('.dt-loader').remove();
                response = JSON.parse(response);
                reload_tasks_tables();
                init_task_modal(taskid);
            });
        }
    });

    // Add follower to task
    $('body').on('change', 'select[name="select-followers"]', function() {
        var data = {};
        data.follower = $('select[name="select-followers"]').val();
        if (data.follower != '') {
            data.taskid = taskid;
            $('body').append('<div class="dt-loader"></div>');
            $.post(admin_url + 'tasks/add_task_followers', data).done(function(response) {
                response = JSON.parse(response);
                $('body').find('.dt-loader').remove();
                init_task_modal(taskid);
            });
        }
    });

    $('body').on('show.bs.modal', '#task-tracking-stats-modal', function(event) {
        setTimeout(function() {
            tracking_chart = new Chart($('body').find('#task-tracking-stats-chart'), {
                type: 'line',
                data: task_tracking_stats_data,
            }, 1000);
        });
    });
});

function recalculate_checklist_items_progress() {
    var total_finished = $('input[name="checklist-box"]:checked').length;
    var total_checklist_items = $('input[name="checklist-box"]').length;
    var percent = 0;
    if (total_checklist_items == 0) {
        // remove the heading for checklist items
        $('body').find('.chk-heading').remove();
        $('#task-no-checklist-items').removeClass('hide');
    } else {
        $('#task-no-checklist-items').addClass('hide');
    }
    if (total_checklist_items > 2) {
        $('.task-progress-bar').parents('.progress').removeClass('hide');
        percent = (total_finished * 100) / total_checklist_items;
    } else {
        $('.task-progress-bar').parents('.progress').addClass('hide');
        return false;
    }
    $('.task-progress-bar').css('width', percent.toFixed(2) + '%');
    $('.task-progress-bar').text(percent.toFixed(2) + '%');
}

function delete_checklist_item(id, field) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'tasks/delete_checklist_item/' + id, function(response) {
            if (response.success == true) {
                $(field).parents('.checklist').remove();
                recalculate_checklist_items_progress();
            }
        }, 'json');
    }
}

function add_task_checklist_item() {
    $.post(admin_url + 'tasks/add_checklist_item', {
        taskid: taskid
    }).done(function() {
        init_tasks_checklist_items(true);
    });
}

function init_tasks_checklist_items(is_new) {
    $.post(admin_url + 'tasks/init_checklist_items', {
        taskid: taskid
    }).done(function(data) {
        $('#checklist-items').html(data);
        if (typeof(is_new) != 'undefined') {
            $('body').find('.checklist textarea').eq(0).focus();
        }
        recalculate_checklist_items_progress();
        update_checklist_order();
    });
}

function remove_task_attachment(link, id) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'tasks/remove_task_attachment/' + id, function(response) {
            if (response.success == true) {
                $(link).parents('li').remove();
            }
            var att_wrap = $('body').find('.task_attachments_wrapper');
            var attachments = att_wrap.find('li');
            if (attachments.length == 0) {
                att_wrap.remove();
            }
        }, 'json');
    }
}

function add_task_comment() {
    var data = {};
    data.content = tinyMCE.activeEditor.getContent();
    data.taskid = taskid;
    $.post(admin_url + 'tasks/add_task_comment', data).done(function(response) {
        init_task_modal(taskid);
    });
}
// Deletes task comment from database
function remove_task_comment(commentid) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'tasks/remove_comment/' + commentid, function(response) {
            if (response.success == true) {
                $('[data-commentid="' + commentid + '"]').remove();
            }
        }, 'json');
    }
}
// Remove task assignee
function remove_assignee(id, taskid) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'tasks/remove_assignee/' + id + '/' + taskid, function(response) {
            if (response.success == true) {
                alert_float('success', response.message);
            } else {
                alert_float('warning', response.message);
            }
            init_task_modal(taskid);
        }, 'json');
    }
}
// Remove task follower
function remove_follower(id, taskid) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'tasks/remove_follower/' + id + '/' + taskid, function(response) {
            if (response.success == true) {
                alert_float('success', response.message);
                init_task_modal(taskid);
            }
        }, 'json');
    }
}

// Marking task as complete
function mark_complete(task_id) {
    task_mark_as(5, task_id, admin_url + 'tasks/mark_complete/' + task_id);
}
// Unmarking task as complete
function unmark_complete(task_id) {
    task_mark_as(4, task_id, admin_url + 'tasks/unmark_complete/' + task_id);
}

function task_mark_as(status, task_id, url) {
    if (typeof(url) == 'undefined') {
        url = admin_url + 'tasks/mark_as/' + status + '/' + task_id;
    }
    $('body').append('<div class="dt-loader"></div>');
    $.get(url, function(response) {
        $('body').find('.dt-loader').remove();
        if (response.success == true) {
            reload_tasks_tables();
            if ($('.task-modal-single').is(':visible')) {
                init_task_modal(task_id);
            }
            if ($('.tasks-kanban').length == 0) {
                alert_float('success', response.message);
            }
        }
    }, 'json');
}

function reload_tasks_tables() {

    if ($.fn.DataTable.isDataTable('.table-tasks')) {
        $('.table-tasks').DataTable().ajax.reload();
    }
    if ($.fn.DataTable.isDataTable('.table-rel-tasks')) {
        $('.table-rel-tasks').DataTable().ajax.reload();
    }
    if ($.fn.DataTable.isDataTable('.table-rel-tasks-leads')) {
        $('.table-rel-tasks-leads').DataTable().ajax.reload();
    }
    if ($.fn.DataTable.isDataTable('.table-timesheets')) {
        $('.table-timesheets').DataTable().ajax.reload();
    }
}

function make_task_public(task_id) {
    $.get(admin_url + 'tasks/make_public/' + task_id, function(response) {
        if (response.success == true) {
            reload_tasks_tables();
            init_task_modal(task_id);
        }
    }, 'json');
}

function new_task(url) {
    var _url = admin_url + 'tasks/task';
    if (typeof(url) != 'undefined') {
        _url = url;
    }
    $.get(_url, function(response) {
        $('#_task').html(response)
        $('body').find('#_task_modal').modal({
            show: true,
            backdrop: 'static'
        });
    });
}

function new_task_from_relation(table, rel_type, rel_id) {
    if (typeof(rel_type) == 'undefined' && typeof(rel_id) == 'undefined') {
        rel_id = $(table).data('new-rel-id');
        rel_type = $(table).data('new-rel-type');
    }
    var url = admin_url + 'tasks/task?rel_id=' + rel_id + '&rel_type=' + rel_type;
    new_task(url);
}

// Go to edit view
function edit_task(_task_id) {
    if (typeof(_task_id) != 'undefined') {
        taskid = _task_id;
    }
    $.get(admin_url + 'tasks/task/' + taskid, function(response) {
        $('#_task').html(response)
        $('.task-modal-single').modal('hide');
        $('body').find('#_task_modal').modal({
            show: true,
            backdrop: 'static'
        });
    });
}

function task_form_handler(form) {
    tinymce.triggerSave();
    var data = $(form).serialize();
    var url = form.action;
    $.post(url, data).done(function(response) {
        response = JSON.parse(response);
        if (response.success == true) {
            alert_float('success', response.message);
        }
        if (!$('body').hasClass('project')) {
            $('#_task_modal').modal('hide');
            reload_tasks_tables();
            if (response.id) {
                init_task_modal(response.id);
                taskid = response.id;
            } else {
                init_task_modal(taskid);
            }
        } else {
            $('#_task_modal').modal('hide');
            var _r_task_id;
            if (response.id) {
                _r_task_id = response.id;
            } else {
                _r_task_id = taskid;
            }
            // reload page on project area
            var location = window.location.href;
            var parameters = new Array();
            location = location.split('?');
            var group = get_url_param('group');
            if (group) {
                parameters['group'] = group;
            }
            parameters['taskid'] = _r_task_id;
            window.location.href = buildUrl(location[0], parameters)
        }
    }).fail(function(error) {
        var response = JSON.parse(error.responseText);
        alert_float('danger', response.message);
    });
    return false;
}

function timer_action(e, task_id, timer_id) {
    if (typeof(timer_id) == 'undefined') {
        timer_id = '';
    }
    $(e).addClass('disabled');
    $.get(admin_url + 'tasks/timer_tracking/' + task_id + '/' + timer_id, function(response) {
        $(e).removeClass('disabled');
        if ($('.task-modal-single').is(':visible')) {
            init_task_modal(task_id);
        }
        init_timers();
        reload_tasks_tables();
    }, 'json');
}

function init_task_modal(taskid) {
    tinymce.remove('#task_comment');
    $.post(admin_url + 'tasks/get_task_data/', {
        taskid: taskid
    }).done(function(response) {
        taskid = taskid;
        $('.task-modal-single .data').html(response);
        init_editor('#task_comment', {
            height: 150
        });
        init_tasks_checklist_items();
        $('.task-modal-single').modal('show');
        fix_task_modal_left_col_height();
    }).fail(function(data) {
        $('.task-modal-single').modal('hide');
        alert_float('danger', data.responseText);
    });
}

function task_tracking_stats(id) {
    $.get(admin_url + 'tasks/task_tracking_stats/' + id, function(response) {
        $('body').find('#tacking-stats').html(response);
        $('#task-tracking-stats-modal').modal('toggle');
    });
}

function init_timers() {
    $.get(admin_url + 'tasks/get_staff_started_timers', function(response) {
        if (response.timers_found) {
            $('.top-timers').addClass('text-warning');
        } else {
            $('.top-timers').removeClass('text-warning');
        }
        $('.started-timers-top').html(response.html);
    }, 'json');
}

function edit_task_comment(id) {
    var edit_wrapper = $('[data-edit-comment="' + id + '"]');
    edit_wrapper.next().addClass('hide');
    edit_wrapper.removeClass('hide');
    init_editor('#task_comment_' + id, {
        height: 150,
    });
    tinymce.triggerSave();
}

function cancel_edit_comment(id) {
    var edit_wrapper = $('[data-edit-comment="' + id + '"]');
    tinymce.remove('[data-edit-comment="' + id + '"] textarea');
    edit_wrapper.addClass('hide');
    edit_wrapper.next().removeClass('hide');
}

function save_edited_comment(id) {
    tinymce.triggerSave();
    var data = {};
    data.id = id;
    data.content = $('[data-edit-comment="' + id + '"]').find('textarea').val();
    $.post(admin_url + 'tasks/edit_comment', data).done(function(response) {
        response = JSON.parse(response);
        if (response.success == true) {
            alert_float('success', response.message);
            init_task_modal(taskid);
        } else {
            cancel_edit_comment(id);
        }
        tinymce.remove('[data-edit-comment="' + id + '"] textarea');
    });
}

function update_checklist_order() {
    var order = [];
    var status = $('body').find('.checklist');
    var i = 1;
    $.each(status, function() {
        order.push([$(this).data('checklist-id'), i]);
        i++;
    });
    var data = {}
    data.order = order;
    $.post(admin_url + 'tasks/update_checklist_order', data);
}

function fix_task_modal_left_col_height() {
    var left_col = $('body').find('.task-single-col-left');
    var right_col = $('body').find('.task-single-col-right');
    left_col.css('min-height', right_col.outerHeight(true) + 'px');
}

function tasks_kanban_update(ui, object) {
    if (object === ui.item.parent()[0]) {
        var status = $(ui.item.parent()[0]).data('task-status-id');
        var taskid = $(ui.item).data('task-id');
        var tasks = $(ui.item.parent()[0]).find('[data-task-id]');

        var data = {};
        data.order = [];
        var i = 0;
        $.each(tasks,function(){
            data.order.push([$(this).data('task-id'), i]);
            i++;
        });

        task_mark_as(status, taskid);
        check_kanban_empty_col('[data-task-id]');
        setTimeout(function(){$.post(admin_url+'tasks/update_order',data);},50);
    }
}

function tasks_kanban() {
    init_kanban('tasks', tasks_kanban_update, '.tasks-status', 270, 360);
}

function tasks_bulk_action(event){
 var r = confirm(confirm_action_prompt);
 if (r == false) {
    return false;
} else {
    var mass_delete = $('#mass_delete').prop('checked');
    var ids = [];
    var data = {};
    if(mass_delete == false || typeof(mass_delete) == 'undefined'){
        data.status = $('#move_to_status_tasks_bulk_action').val();
        data.priority = $('#task_bulk_priority').val();
        if(typeof(data.priority) == 'undefined'){
            data.priority = '';
        }
        if (data.status == '' && data.priority == '') {
            return;
        }
    } else {
        data.mass_delete = true;
    }
    var rows = $('.table-tasks').find('tbody tr');
    $.each(rows, function() {
        var checkbox = $($(this).find('td').eq(0)).find('input');
        if (checkbox.prop('checked') == true) {
            ids.push(checkbox.val());
        }
    });
    data.ids = ids;
    $(event).addClass('disabled');
    setTimeout(function(){
        $.post(admin_url + 'tasks/bulk_action', data).done(function() {
           window.location.reload();
        });
    },50);
}
}
