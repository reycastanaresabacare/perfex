<?php
defined('BASEPATH') OR exit('No direct script access allowed');
$aColumns      = array(
    'staff_id',
    'task_id',
    'start_time',
    'end_time',
    'end_time - start_time',
    'end_time - start_time',
    );
$sIndexColumn  = "id";
$sTable        = 'tbltaskstimers';
$join          = array('LEFT JOIN tblstafftasks ON tblstafftasks.id = tbltaskstimers.task_id');
$project_tasks = $this->_instance->projects_model->get_tasks($project_id);
$task_ids      = array();
foreach ($project_tasks as $task) {
    array_push($task_ids, $task['id']);
}
$where = array();
if (count($task_ids) > 0) {
    $where = array(
        'WHERE task_id IN (' . implode(', ', $task_ids) . ')'
        );
} else {
    echo json_encode(json_decode('{"draw":0,"iTotalRecords":"0","iTotalDisplayRecords":"0","aaData":[]}'));
    die;
}
if(!has_permission('projects','','create')){
    array_push($where,'AND staff_id='.get_staff_user_id());
}

$staff_ids = $this->_instance->projects_model->get_distinct_tasks_timesheets_staff($project_id);
$_staff_ids = array();
foreach($staff_ids as $s){
    if($this->_instance->input->post('staff_id_'.$s['staff_id'])){
        array_push($_staff_ids,$s['staff_id']);
    }
}
if(count($_staff_ids) > 0){
    array_push($where,'AND staff_id IN ('.implode(', ',$_staff_ids).')');
}

$result  = data_tables_init($aColumns, $sIndexColumn, $sTable, $join, $where, array(
    'tbltaskstimers.id',
    'tblstafftasks.name',
    'billed',
    'billable',
    ));
$output  = $result['output'];
$rResult = $result['rResult'];
foreach ($rResult as $aRow) {
    $row = array();
    for ($i = 0; $i < count($aColumns); $i++) {
        $_data = $aRow[$aColumns[$i]];
        if ($aColumns[$i] == 'staff_id') {
            $_data = '<a href="' . admin_url('staff/profile/' . $aRow['staff_id']) . '"> ' . staff_profile_image($aRow['staff_id'], array(
                'staff-profile-image-small mright5'
                )) . '</a>';
            if(has_permission('staff','','edit')){
                $_data .= ' <a href="' . admin_url('staff/member/' . $aRow['staff_id']) . '"> ' . get_staff_full_name($aRow['staff_id']) . '</a>';
            } else {
                $_data .= get_staff_full_name($aRow['staff_id']);
            }

        } else if ($aColumns[$i] == 'task_id') {
                $_data = '<a href="#" onclick="init_task_modal(' . $aRow['task_id'] . '); return false;">' .$aRow['name'] . '</a>';

                if($aRow['billed'] == 1){
                    // hidden is for export
                    $_data .=  '<span class="hidden"> - </span><span class="label label-success inline-block pull-right">'._l('task_billed_yes').'</span>';
                } else if($aRow['billable'] == 1 && $aRow['billed'] == 0){
                    $_data .=  '<span class="hidden"> - </span> <span class="label label-warning inline-block pull-right">'._l('task_billed_no').'</span>';
                }

        } else if ($aColumns[$i] == 'start_time' || $aColumns[$i] == 'end_time') {
            if ($aColumns[$i] == 'end_time' && $_data == NULL) {
                $_data = '';
            } else {
                $_data = strftime(get_current_date_format().' %H:%M', $_data);
            }
        } else {
            if($i == 4){
                if ($_data == NULL) {
                     $_data = seconds_to_time_format(time() - $aRow['start_time']);
                 } else {
                    $_data = seconds_to_time_format($_data);
                }
            } else {
                if ($_data == NULL) {
                     $_data = sec2qty(time() - $aRow['start_time']);
                 } else {
                    $_data = sec2qty($_data);
                }
            }

    }
    $row[] = $_data;
}

$options = '';
if(($aRow['staff_id'] == get_staff_user_id() || has_permission('projects','','edit')) && !$this->_instance->tasks_model->is_task_billed($aRow['task_id'])){
    if($aRow['end_time'] !== NULL){
        $attrs = array(
            'onclick' => 'edit_timesheet(this,' . $aRow['id'] . ');return false',
            'data-start_time'=>strftime(get_current_date_format() . ' %H:%M',$aRow['start_time']),
            'data-timesheet_task_id'=>$aRow['task_id'],
            'data-timesheet_staff_id'=>$aRow['staff_id'],
            );
        if($aRow['end_time'] == NULL){
           $attrs['data-end_time'] = strftime(get_current_date_format() . ' %H:%M',time());
        } else {
           $attrs['data-end_time'] = strftime(get_current_date_format() . ' %H:%M',$aRow['end_time']);
        }
        $options .= icon_btn('#', 'pencil-square-o', 'btn-default', $attrs);
    }

     if ($aRow['end_time'] == NULL) {
        $options .= icon_btn('#', 'clock-o', 'btn-danger', array(
            'onclick' => 'timer_action(this,' . $aRow['task_id'] . ',' . $aRow['id'] . ');return false',
            'data-toggle' => 'tooltip',
            'data-title' => _l('timesheet_stop_timer')
            ));
    }
    if(has_permission('projects','','delete') || has_permission('tasks','','delete')){
        $options .= icon_btn('tasks/delete_timesheet/'.$aRow['id'], 'remove', 'btn-danger _delete');
    }
}

$row[]              = $options;
$output['aaData'][] = $row;
}
