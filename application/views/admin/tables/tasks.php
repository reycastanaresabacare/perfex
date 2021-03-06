<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$assignee_column = 3;
$aColumns = array(
    'name',
    'startdate',
    'duedate',
    '(SELECT GROUP_CONCAT(staffid SEPARATOR ",") FROM tblstafftaskassignees WHERE taskid=tblstafftasks.id) as assignees',
    'status',
    'rel_id',
    'priority'
);

if($this->_instance->input->get('bulk_actions')){
    array_unshift($aColumns, '1');
    $assignee_column = 4;
}

if (has_permission('tasks', '', 'create') || has_permission('tasks', '', 'edit')) {
    array_push($aColumns, 'billable');
    array_push($aColumns, 'billed');
}

$where = array();
include_once(APPPATH . 'views/admin/tables/includes/tasks_filter.php');

$join          = array();
$custom_fields = get_custom_fields('tasks', array(
    'show_on_table' => 1
));
$i             = 0;
foreach ($custom_fields as $field) {
    $select_as = 'cvalue_' . $i;
    if ($field['type'] == 'date_picker') {
        $select_as = 'date_picker_cvalue_' . $i;
    }
    array_push($aColumns, 'ctable_' . $i . '.value as ' . $select_as);
    array_push($join, 'LEFT JOIN tblcustomfieldsvalues as ctable_' . $i . ' ON tblstafftasks.id = ctable_' . $i . '.relid AND ctable_' . $i . '.fieldto="' . $field['fieldto'] . '" AND ctable_' . $i . '.fieldid=' . $field['id']);
    $i++;
}
$sIndexColumn = "id";
$sTable       = 'tblstafftasks';
// Fix for big queries. Some hosting have max_join_limit
if (count($custom_fields) > 4) {
    @$this->_instance->db->query('SET SQL_BIG_SELECTS=1');
}
$result  = data_tables_init($aColumns, $sIndexColumn, $sTable, $join, $where, array(
    'tblstafftasks.id',
    'dateadded',
    'priority',
    'rel_type',
    'invoice_id'
));
$output  = $result['output'];
$rResult = $result['rResult'];
foreach ($rResult as $aRow) {
    $row = array();

    for ($i = 0; $i < count($aColumns); $i++) {
        if (strpos($aColumns[$i], 'as') !== false && !isset($aRow[$aColumns[$i]])) {
            $_data = $aRow[strafter($aColumns[$i], 'as ')];
        } else {
            $_data = $aRow[$aColumns[$i]];
        }

        if($aColumns[$i] == '1'){
            $_data = '<div class="checkbox"><input type="checkbox" value="'.$aRow['id'].'"><label></label></div>';
        } else if ($aColumns[$i] == 'name') {
            $_data = '<a href="#" class="main-tasks-table-href-name" onclick="init_task_modal(' . $aRow['id'] . '); return false;">' . $_data . '</a>';
        } else if ($aColumns[$i] == 'startdate' || $aColumns[$i] == 'duedate') {
            if ($aColumns[$i] == 'startdate') {
                $_data = _d($aRow['startdate']);
            } else {
                $_data = _d($aRow['duedate']);
            }
        } else if ($aColumns[$i] == 'status') {
            $_data = '<span class="inline-block label label-'.get_status_label($aRow['status']).'">' . format_task_status($aRow['status'],false,true);
            if ($aRow['status'] == 5) {
                $_data .= '<a href="#" onclick="unmark_complete(' . $aRow['id'] . '); return false;"><i class="fa fa-check task-icon task-finished-icon" data-toggle="tooltip" title="' . _l('task_unmark_as_complete') . '"></i></a>';
            } else {
                $_data .= '<a href="#" onclick="mark_complete(' . $aRow['id'] . '); return false;"><i class="fa fa-check task-icon task-unfinished-icon" data-toggle="tooltip" title="' . _l('task_single_mark_as_complete') . '"></i></a>';
            }
            $_data .= '</span>';
        } else if ($aColumns[$i] == 'priority') {
            $_data = '<span class="text-' . get_task_priority_class($_data) . ' inline-block">' . task_priority($_data) . '</span>';
        } else if ($aColumns[$i] == 'rel_id') {
            if (!empty($_data)) {
                $rel_data   = get_relation_data($aRow['rel_type'], $aRow['rel_id']);
                $rel_values = get_relation_values($rel_data, $aRow['rel_type']);
                // Show client company if task is related to project
                if ($aRow['rel_type'] == 'project') {
                    $this->_instance->db->select('clientid');
                    $this->_instance->db->where('id', $aRow['rel_id']);
                    $client = $this->_instance->db->get('tblprojects')->row();
                    if ($client) {
                        $this->_instance->db->select('company');
                        $this->_instance->db->where('userid', $client->clientid);
                        $company = $this->_instance->db->get('tblclients')->row();
                        if ($company) {
                            $rel_values['name'] .= ' - ' . $company->company;
                        }

                    }
                }
                $_data = '<a data-toggle="tooltip" title="' . ucfirst($aRow['rel_type']) . '" href="' . $rel_values['link'] . '">' . $rel_values['name'] . '</a>';
                // for exporting
                $_data .= '<span class="hide"> - ' . ucfirst($aRow['rel_type']) . '</span>';
            }
        } else if ($aColumns[$i] == 'billable') {
            if ($_data == 1) {
                $billable = _l("task_billable_yes");
            } else {
                $billable = _l("task_billable_no");
            }
            $_data = $billable;
        } else if ($aColumns[$i] == 'billed') {
            if ($aRow['billable'] == 1) {
                if ($_data == 1) {
                    $_data = '<span class="label label-success inline-block">' . _l('task_billed_yes') . '</span>';
                } else {
                    $_data = '<span class="label label-danger inline-block">' . _l('task_billed_no') . '</span>';
                }
            } else {
                $_data = '';
            }
        } else if ($aColumns[$i] == $aColumns[$assignee_column]) {
            $assignees        = explode(',', $_data);
            $_data            = '';
            $export_assignees = '';
            foreach ($assignees as $assigned) {

                if ($assigned != '') {
                    $full_name = get_staff_full_name($assigned);
                    $_data .= '<a href="' . admin_url('profile/' . $assigned) . '">' . staff_profile_image($assigned, array(
                        'staff-profile-image-small mright5'
                    ), 'small', array(
                        'data-toggle' => 'tooltip',
                        'data-title' => $full_name
                    )) . '</a>';
                    // For exporting
                    $export_assignees .= $full_name . ', ';

                }
            }
            if ($export_assignees != '') {
                $_data .= '<span class="hide">' . substr($export_assignees, 0, -2) . '</span>';
            }
        } else {
            if (strpos($aColumns[$i], 'date_picker_') !== false) {
                $_data = _d($_data);
            }
        }
        $row[] = $_data;
    }
    $options = '';


    if (has_permission('tasks', '', 'edit')) {
        $options .= icon_btn('#', 'pencil-square-o', 'btn-default pull-right mleft5', array(
            'onclick' => 'edit_task(' . $aRow['id'] . '); return false'
        ));
    }


    $class = 'btn-success no-margin';
    $atts  = array(
        'onclick' => 'timer_action(this,' . $aRow['id'] . '); return false'
    );


    $tooltip        = '';
    $is_assigned    = $this->_instance->tasks_model->is_task_assignee(get_staff_user_id(), $aRow['id']);
    $is_task_billed = $this->_instance->tasks_model->is_task_billed($aRow['id']);
    if ($is_task_billed || !$is_assigned || $aRow['status'] == 5) {
        $class = 'btn-default disabled';
        if($aRow['status'] == 5){
            $tooltip = ' data-toggle="tooltip" data-title="' . format_task_status($aRow['status'],false,true) . '"';
        } else if ($is_task_billed) {
            $tooltip = ' data-toggle="tooltip" data-title="' . _l('task_billed_cant_start_timer') . '"';
        } else if(!$is_assigned) {
            $tooltip = ' data-toggle="tooltip" data-title="' . _l('task_start_timer_only_assignee') . '"';
        }
    }

    if (!$this->_instance->tasks_model->is_timer_started($aRow['id'])) {
        $options .= '<span' . $tooltip . ' class="pull-right">' . icon_btn('#', 'clock-o', $class . ' no-margin', $atts) . '</span>';
    } else {
        $options .= icon_btn('#', 'clock-o', 'btn-danger pull-right no-margin', array(
            'onclick' => 'timer_action(this,' . $aRow['id'] . ',' . $this->_instance->tasks_model->get_last_timer($aRow['id'])->id . '); return false'
        ));
    }

    $row[]              = $options;
    $rowClass = '';
    if ((!empty($aRow['duedate']) && $aRow['duedate'] < date('Y-m-d')) && $aRow['status'] != 5) {
        $rowClass = 'text-danger bold ';
    }
    $row['DT_RowClass'] = $rowClass;
    $output['aaData'][] = $row;
}
