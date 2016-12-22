 <?php
$table_data = array(
    _l('tasks_dt_name'),
    _l('tasks_dt_datestart'),
    _l('task_duedate'),
    _l('task_assigned'),
    _l('task_status'),
    _l('task_relation'),
    _l('tasks_list_priority')
);
if(isset($bulk_actions)){
    array_unshift($table_data,'<span class="hide"> - </span><div class="checkbox mass_select_all_wrap"><input type="checkbox" id="mass_select_all" data-to-table="tasks"><label></label></div>');
}
if (has_permission('tasks', '', 'create') || has_permission('tasks', '', 'edit')) {
    array_push($table_data, _l('task_billable'));
    array_push($table_data, _l('task_billed'));
}
$custom_fields = get_custom_fields('tasks', array(
    'show_on_table' => 1
));
foreach ($custom_fields as $field) {
    array_push($table_data, $field['name']);
}
array_push($table_data, _l('options'));
render_datatable($table_data, 'tasks');
?>
