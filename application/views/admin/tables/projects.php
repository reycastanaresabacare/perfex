<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$aColumns = array('tblprojects.id','name', 'clientid', 'start_date', 'deadline','(SELECT GROUP_CONCAT(staff_id SEPARATOR ",") FROM tblprojectmembers WHERE project_id=tblprojects.id) as members','status');

if(has_permission('projects','','create') || has_permission('projects','','edit')){
  array_push($aColumns,'billing_type');
}

$sIndexColumn = "id";
$sTable = 'tblprojects';

$additionalSelect = array('company');
$join = array(
  'JOIN tblclients ON tblclients.userid = tblprojects.clientid',
  );

$where = array();
$filter = array();

if(is_numeric($clientid)){
  array_push($where,' AND clientid='.$clientid);
}

if(!has_permission('projects','','view') || $this->_instance->input->post('my_projects')){
  array_push($where,' AND tblprojects.id IN (SELECT project_id FROM tblprojectmembers WHERE staff_id='.get_staff_user_id().')');
}
$_statuses = array();
foreach($this->_instance->projects_model->get_project_statuses() as $status){
  if($this->_instance->input->post('project_status_'.$status)){
    array_push($_statuses,$status);
  }
}

if(count($_statuses) > 0){
  array_push($filter, 'OR status IN (' . implode(', ',$_statuses) . ')');
}
if(count($filter) > 0){
  array_push($where,'AND ('.prepare_dt_filter($filter).')');
}

$custom_fields = get_custom_fields('projects',array('show_on_table'=>1));
$i = 0;
foreach($custom_fields as $field){
  $select_as = 'cvalue_'.$i;
  if($field['type'] == 'date_picker') {
    $select_as = 'date_picker_cvalue_'.$i;
  }
  array_push($aColumns,'ctable_'.$i.'.value as '.$select_as);
  array_push($join,'LEFT JOIN tblcustomfieldsvalues as ctable_'.$i . ' ON tblprojects.id = ctable_'.$i . '.relid AND ctable_'.$i . '.fieldto="'.$field['fieldto'].'" AND ctable_'.$i . '.fieldid='.$field['id']);
  $i++;
}

// Fix for big queries. Some hosting have max_join_limit
if(count($custom_fields) > 4){
  @$this->_instance->db->query('SET SQL_BIG_SELECTS=1');
}
$result = data_tables_init($aColumns,$sIndexColumn,$sTable,$join,$where,$additionalSelect);

$output = $result['output'];
$rResult = $result['rResult'];

foreach ( $rResult as $aRow )
{
  $row = array();
  for ( $i=0 ; $i<count($aColumns) ; $i++ )
  {
    if(strpos($aColumns[$i],'as') !== false && !isset($aRow[ $aColumns[$i] ])){
      $_data = $aRow[ strafter($aColumns[$i],'as ')];
    } else {
      $_data = $aRow[ $aColumns[$i] ];
    }
    if($aColumns[$i] == 'tblprojects.id'){
      $_data = '<span class="label label-default inline-block">'.$_data.'</span>';
    } else if($aColumns[$i] == 'clientid'){
      $_data = '<a href="'.admin_url('clients/client/'.$aRow['clientid']).'">'. $aRow['company'] . '</a>';
    } else if($aColumns[$i] == 'start_date' || $aColumns[$i] == 'deadline' || $aColumns[$i] == 'project_created'){
      $_data = _d($_data);
    } else if($aColumns[$i] == 'name'){
      $_data = '<a href="'.admin_url('projects/view/'.$aRow['tblprojects.id']).'">'.$_data.'</a>';
    } else if($aColumns[$i] == 'billing_type'){
      if($aRow['billing_type'] == 1){
        $type_name = 'project_billing_type_fixed_cost';
      } else if($aRow['billing_type'] == 2){
        $type_name = 'project_billing_type_project_hours';
      } else {
        $type_name = 'project_billing_type_project_task_hours';
      }
      $_data = _l($type_name);
    } else if($aColumns[$i] == 'status'){
      if($_data == 1){
        $label = 'default';
      } else if($_data == 2){
        $label = 'info';
      } else if($_data == 3){
       $label = 'warning';
     } else {
       $label = 'success';
     }
     $status = '<span class="label label-'.$label.' inline-block">'._l('project_status_'.$_data).'</span>';
     $_data = $status;
   } else if($i == 5){
    $members = explode(',', $_data);
    $_data     = '';
    $export_members = '';
    foreach ($members as $member) {
      if ($member != '') {
        $full_name = get_staff_full_name($member);
        $_data .= '<a href="' . admin_url('profile/' . $member) . '">' . staff_profile_image($member, array(
          'staff-profile-image-small mright5'
          ), 'small', array(
          'data-toggle' => 'tooltip',
          'data-title' => $full_name
          )) . '</a>';
        // For exporting
        $export_members .= $full_name.', ';
      }
    }
    if($export_members != ''){
      $_data .= '<span class="hide">'.substr($export_members, 0,-2).'</span>';
    }

   } else {
        // check if field is date so can be converted, possible option is to be custom field with type of date
     if(strpos($aColumns[$i],'date_picker_') !== false){
       $_data = _d($_data);
     }
   }

   $row[] = $_data;
 }
 $options = '';
 if(has_permission('projects','','edit')){
  $options .= icon_btn('projects/project/'.$aRow['tblprojects.id'],'pencil-square-o');
}
if(has_permission('projects','','delete')){
  $options .= icon_btn('projects/delete/'.$aRow['tblprojects.id'],'remove','btn-danger _delete');
}

$row[] = $options;
$output['aaData'][] = $row;
}
