<?php
defined('BASEPATH') OR exit('No direct script access allowed');
class Leads_model extends CRM_Model
{
    private $is_admin;
    function __construct()
    {
        parent::__construct();
        $this->is_admin = is_admin();
    }
    /**
     * Get lead
     * @param  string $id Optional - leadid
     * @return mixed
     */
    public function get($id = '', $where = array())
    {
        $this->db->select('*,tblleads.name, tblleads.id,tblleadsstatus.name as status_name,tblleadssources.name as source_name');
        $this->db->join('tblleadsstatus','tblleadsstatus.id=tblleads.status','left');
        $this->db->join('tblleadssources','tblleadssources.id=tblleads.source','left');

        $this->db->where($where);
        if (is_numeric($id)) {
            $this->db->where('tblleads.id', $id);
            $lead = $this->db->get('tblleads')->row();
            if ($lead) {
                $lead->attachments = $this->get_lead_attachments($id);
            }

            return $lead;
        }
        return $this->db->get('tblleads')->result_array();
    }
    public function do_kanban_query($status, $search = '', $page = 1, $sort = array(), $count = false)
    {

        $limit                         = get_option('leads_kanban_limit');
        $defaut_leads_kanban_sort      = get_option('defaut_leads_kanban_sort');
        $defaut_leads_kanban_sort_type = get_option('defaut_leads_kanban_sort_type');

        $this->db->select('tblleads.name as lead_name,tblleadssources.name as source_name,tblleads.id as id,assigned,email,phonenumber,company,dateadded,status,lastcontact');
        $this->db->from('tblleads');
        $this->db->join('tblleadssources', 'tblleadssources.id=tblleads.source', 'left');
        $this->db->where('status', $status);
        if (!$this->is_admin) {
            $this->db->where('(assigned = ' . get_staff_user_id() . ' OR addedfrom=' . get_staff_user_id() . ' OR is_public=1)');
        }
        if ($search != '') {
            $this->db->where('(tblleads.name LIKE "%' . $search . '%" OR tblleadssources.name LIKE "%' . $search . '%" OR email LIKE "%' . $search . '%" OR phonenumber LIKE "%' . $search . '%" OR company LIKE "%' . $search . '%")');
        }

        if (isset($sort['sort_by']) && $sort['sort_by'] && isset($sort['sort']) && $sort['sort']) {
            $this->db->order_by($sort['sort_by'], $sort['sort']);
        } else {
            $this->db->order_by($defaut_leads_kanban_sort, $defaut_leads_kanban_sort_type);
        }

        if ($page > 1) {
            $page--;
            $position = ($page * $limit);
            $this->db->limit($limit, $position);
        } else {
            $this->db->limit($limit);
        }

        if ($count == false) {
            return $this->db->get()->result_array();
        } else {
            return $this->db->count_all_results();
        }
    }
    /**
     * Add new lead to database
     * @param mixed $data lead data
     * @return mixed false || leadid
     */
    public function add($data)
    {
        if (isset($data['contacted_today'])) {
            $data['lastcontact'] = date('Y-m-d H:i:s');
            unset($data['contacted_today']);
        } else {
            $data['lastcontact'] = to_sql_date($data['custom_contact_date'], true);
        }
        if (isset($data['custom_fields'])) {
            $custom_fields = $data['custom_fields'];
            unset($data['custom_fields']);
        }
        if (isset($data['is_public'])) {
            $data['is_public'] = 1;
        } else {
            $data['is_public'] = 0;
        }

        if(!isset($data['country']) || isset($data['country']) && $data['country'] == ''){
            $data['country'] = 0;
        }

        unset($data['custom_contact_date']);
        $data['dateadded'] = date('Y-m-d H:i:s');
        $data['addedfrom'] = get_staff_user_id();
        $data              = do_action('before_lead_added', $data);
        if (isset($data['custom_fields'])) {
            $custom_fields = $data['custom_fields'];
            unset($data['custom_fields']);
        }
        $this->db->insert('tblleads', $data);
        $insert_id = $this->db->insert_id();
        if ($insert_id) {
            logActivity('New Lead Added [Name: ' . $data['name'] . ']');
            $this->log_lead_activity($insert_id, 'not_lead_activity_created');
            if (isset($custom_fields)) {
                handle_custom_fields_post($insert_id, $custom_fields);
            }
            $this->lead_assigned_member_notification($insert_id, $data['assigned']);

            return $insert_id;
        }
        return false;
    }
    public function lead_assigned_member_notification($lead_id, $assigned)
    {
        if ((!empty($assigned) && $assigned != 0) && $assigned != get_staff_user_id()) {
            $name = $this->db->select('name')->from('tblleads')->where('id', $lead_id)->get()->row()->name;
            add_notification(array(
                'description' => 'not_assigned_lead_to_you',
                'touserid' => $assigned,
                'link' => '#leadid=' . $lead_id,
                'additional_data' => serialize(array(
                    get_staff_full_name(get_staff_user_id()),
                    $name
                ))
            ));
            $this->db->where('id', $lead_id);
            $this->db->update('tblleads', array(
                'dateassigned' => date('Y-m-d')
            ));

            $this->log_lead_activity($lead_id, 'not_lead_activity_assigned_to', false, serialize(array(
                get_staff_full_name(),
                '<a href="' . admin_url('profile/' . $assigned) . '" target="_blank">' . get_staff_full_name($assigned) . '</a>'
            )));
        }
    }
    /**
     * Update lead
     * @param  array $data lead data
     * @param  mixed $id   leadid
     * @return boolean
     */
    public function update($data, $id)
    {
        $current_lead_data = $this->get($id);
        $current_status    = $this->get_status($current_lead_data->status);
        if ($current_status) {
            $current_status_id = $current_status->id;
            $current_status    = $current_status->name;
        } else {
            if ($current_lead_data->junk == 1) {
                $current_status = _l('lead_junk');
            } else if ($current_lead_data->lost == 1) {
                $current_status = _l('lead_lost');
            } else {
                $current_status = '';
            }
            $current_status_id = 0;
        }

        $affectedRows = 0;
        if (isset($data['custom_fields'])) {
            $custom_fields = $data['custom_fields'];
            if (handle_custom_fields_post($id, $custom_fields)) {
                $affectedRows++;
            }
            unset($data['custom_fields']);
        }
        if (isset($data['is_public'])) {
            $data['is_public'] = 1;
        } else {
            $data['is_public'] = 0;
        }

        if(!isset($data['country']) || isset($data['country']) && $data['country'] == ''){
            $data['country'] = 0;
        }

        if(isset($data['lastcontact']) && $data['lastcontact'] == '' || isset($data['lastcontact']) && $data['lastcontact'] == NULL){
            $data['lastcontact'] = NULL;
        } else {
            $data['lastcontact'] = to_sql_date($data['lastcontact'],true);
        }

        $this->db->where('id', $id);
        $this->db->update('tblleads', $data);
        if ($this->db->affected_rows() > 0) {
            $affectedRows++;
            if ($current_status_id != $data['status']) {
                $this->db->where('id', $id);
                $this->db->update('tblleads', array(
                    'last_status_change' => date('Y-m-d H:i:s')
                ));
                $new_status_name = $this->get_status($data['status'])->name;
                $this->log_lead_activity($id, 'not_lead_activity_status_updated', false, serialize(array(
                    get_staff_full_name(),
                    $current_status,
                    $new_status_name
                )));
            }

            if(($current_lead_data->junk == 1 || $current_lead_data->lost == 1) && $data['status'] != 0){
                $this->db->where('id',$id);
                $this->db->update('tblleads',array('junk'=>0,'lost'=>0));
            }

            if (isset($data['assigned'])) {
                if ($current_lead_data->assigned != $data['assigned'] && (!empty($data['assigned']) && $data['assigned'] != 0)) {
                    if ($data['assigned'] != get_staff_user_id()) {
                        add_notification(array(
                            'description' => 'not_assigned_lead_to_you',
                            'touserid' => $data['assigned'],
                            'link' => '#leadid=' . $id,
                            'additional_data' => serialize(array(
                                get_staff_full_name(get_staff_user_id()),
                                $data['name']
                            ))
                        ));

                        $this->db->where('id', $id);
                        $this->db->update('tblleads', array(
                            'dateassigned' => date('Y-m-d')
                        ));

                        $this->log_lead_activity($id, 'not_lead_activity_assigned_to', false, serialize(array(
                            get_staff_full_name(),
                            '<a href="' . admin_url('profile/' . $data['assigned']) . '">' . get_staff_full_name($data['assigned']) . '</a>'
                        )));
                    }
                }
            }
            logActivity('Lead Updated [Name: ' . $data['name'] . ']');
            return true;
        }
        if ($affectedRows > 0) {
            return true;
        }
        return false;
    }
    /**
     * Delete lead from database and all connections
     * @param  mixed $id leadid
     * @return boolean
     */
    public function delete($id)
    {
        $affectedRows = 0;

        do_action('before_lead_deleted', $id);

        $this->db->where('id', $id);
        $this->db->delete('tblleads');
        if ($this->db->affected_rows() > 0) {
            logActivity('Lead Deleted [Deleted by: ' . get_staff_full_name() . ', LeadID: ' . $id . ']');

            $attachments = $this->get_lead_attachments($id);
            foreach ($attachments as $attachment) {
                $this->delete_lead_attachment($attachment['id']);
            }

            // Delete the custom field values
            $this->db->where('relid', $id);
            $this->db->where('fieldto', 'leads');
            $this->db->delete('tblcustomfieldsvalues');

            $this->db->where('leadid', $id);
            $this->db->delete('tblleadactivitylog');

            $this->db->where('leadid', $id);
            $this->db->delete('tblleadsemailintegrationemails');

            $this->db->where('rel_id', $id);
            $this->db->where('rel_type', 'lead');
            $this->db->delete('tblnotes');

            $this->db->where('rel_type', 'lead');
            $this->db->where('rel_id', $id);
            $this->db->delete('tblreminders');

            $this->load->model('proposals_model');
            $this->db->where('rel_id',$id);
            $this->db->where('rel_type','lead');
            $proposals = $this->db->get('tblproposals')->result_array();

            foreach($proposals as $proposal){
                $this->proposals_model->delete($proposal['id']);
            }

            // Get related tasks
            $this->load->model('tasks_model');
            $this->db->where('rel_type', 'lead');
            $this->db->where('rel_id', $id);
            $tasks = $this->db->get('tblstafftasks')->result_array();
            foreach ($tasks as $task) {
                $this->tasks_model->delete_task($task['id']);
            }

            $affectedRows++;
        }
        if ($affectedRows > 0) {
            return true;
        }
        return false;
    }
    /**
     * Mark lead as lost
     * @param  mixed $id lead id
     * @return boolean
     */
    public function mark_as_lost($id)
    {
        $this->db->select('status');
        $this->db->from('tblleads');
        $this->db->where('id',$id);
        $last_lead_status = $this->db->get()->row()->status;

        $this->db->where('id', $id);
        $this->db->update('tblleads', array(
            'lost' => 1,
            'status' => 0,
            'last_status_change' => date('Y-m-d H:i:s'),
            'last_lead_status'=>$last_lead_status
        ));
        if ($this->db->affected_rows() > 0) {
            $this->log_lead_activity($id, 'not_lead_activity_marked_lost');
            logActivity('Lead Marked as Lost [LeadID: ' . $id . ']');
            return true;
        }
        return false;
    }
    /**
     * Unmark lead as lost
     * @param  mixed $id leadid
     * @return boolean
     */
    public function unmark_as_lost($id)
    {
        $this->db->select('last_lead_status');
        $this->db->from('tblleads');
        $this->db->where('id',$id);
        $last_lead_status = $this->db->get()->row()->last_lead_status;

        $this->db->where('id', $id);
        $this->db->update('tblleads', array(
            'lost' => 0,
            'status'=>$last_lead_status
        ));
        if ($this->db->affected_rows() > 0) {
            $this->log_lead_activity($id, 'not_lead_activity_unmarked_lost');
            logActivity('Lead Unmarked as Lost [LeadID: ' . $id . ']');
            return true;
        }
        return false;
    }
    /**
     * Mark lead as junk
     * @param  mixed $id lead id
     * @return boolean
     */
    public function mark_as_junk($id)
    {
        $this->db->select('status');
        $this->db->from('tblleads');
        $this->db->where('id',$id);
        $last_lead_status = $this->db->get()->row()->status;

        $this->db->where('id', $id);
        $this->db->update('tblleads', array(
            'junk' => 1,
            'status' => 0,
            'last_status_change' => date('Y-m-d H:i:s'),
            'last_lead_status'=>$last_lead_status
        ));
        if ($this->db->affected_rows() > 0) {
            $this->log_lead_activity($id, 'not_lead_activity_marked_junk');
            logActivity('Lead Marked as Junk [LeadID: ' . $id . ']');
            return true;
        }
        return false;
    }
    /**
     * Unmark lead as junk
     * @param  mixed $id leadid
     * @return boolean
     */
    public function unmark_as_junk($id)
    {
        $this->db->select('last_lead_status');
        $this->db->from('tblleads');
        $this->db->where('id',$id);
        $last_lead_status = $this->db->get()->row()->last_lead_status;

        $this->db->where('id', $id);
        $this->db->update('tblleads', array(
            'junk' => 0,
            'status'=>$last_lead_status
        ));
        if ($this->db->affected_rows() > 0) {
            $this->log_lead_activity($id, 'not_lead_activity_unmarked_junk');
            logActivity('Lead Unmarked as Junk [LeadID: ' . $id . ']');
            return true;
        }
        return false;
    }
    /**
     * Get lead attachments
     * @since Version 1.0.4
     * @param  mixed $id lead id
     * @return array
     */
    public function get_lead_attachments($id = '', $attachment_id = '')
    {
        if (is_numeric($attachment_id)) {
            $this->db->where('id', $attachment_id);
            return $this->db->get('tblfiles')->row();
        }
        $this->db->where('rel_id', $id);
        $this->db->where('rel_type', 'lead');
        $this->db->order_by('dateadded', 'DESC');
        return $this->db->get('tblfiles')->result_array();
    }
    public function add_attachment_to_database($lead_id, $attachment, $external = false)
    {

        $this->misc_model->add_attachment_to_database($lead_id, 'lead', $attachment, $external);

        $this->leads_model->log_lead_activity($lead_id, 'not_lead_activity_added_attachment');
        $lead = $this->get($lead_id);

        $not_user_ids = array();
        if ($lead->addedfrom != get_staff_user_id()) {
            array_push($not_user_ids, $lead->addedfrom);
        }
        if ($lead->assigned != get_staff_user_id() && $lead->assigned != 0) {
            array_push($not_user_ids, $lead->assigned);
        }
        foreach ($not_user_ids as $uid) {
            add_notification(array(
                'description' => 'not_lead_added_attachment',
                'touserid' => $uid,
                'link' => '#leadid=' . $lead_id,
                'additional_data' => serialize(array(
                    $lead->name
                ))
            ));
        }
    }
    /**
     * Delete lead attachment
     * @param  mixed $id attachment id
     * @return boolean
     */
    public function delete_lead_attachment($id)
    {
        $attachment = $this->get_lead_attachments('', $id);
        $deleted    = false;

        if ($attachment) {
            if (empty($attachment->external)) {
                unlink(get_upload_path_by_type('lead') . $attachment->rel_id . '/' . $attachment->file_name);
            }
            $this->db->where('id', $attachment->id);
            $this->db->delete('tblfiles');
            if ($this->db->affected_rows() > 0) {
                $deleted = true;
                logActivity('Lead Attachment Deleted [LeadID: ' . $attachment->rel_id . ']');
            }

            if (is_dir(get_upload_path_by_type('lead') . $attachment->rel_id)) {
                // Check if no attachments left, so we can delete the folder also
                $other_attachments = list_files(get_upload_path_by_type('lead') . $attachment->rel_id);
                if (count($other_attachments) == 0) {
                    // okey only index.html so we can delete the folder also
                    delete_dir(get_upload_path_by_type('lead') . $attachment->rel_id);
                }
            }
        }
        return $deleted;
    }

    // Sources
    /**
     * Get leads sources
     * @param  mixed $id Optional - Source ID
     * @return mixed object if id passed else array
     */
    public function get_source($id = false)
    {
        if (is_numeric($id)) {
            $this->db->where('id', $id);
            return $this->db->get('tblleadssources')->row();
        }
        return $this->db->get('tblleadssources')->result_array();
    }
    /**
     * Add new lead source
     * @param mixed $data source data
     */
    public function add_source($data)
    {
        $this->db->insert('tblleadssources', $data);
        $insert_id = $this->db->insert_id();
        if ($insert_id) {
            logActivity('New Leads Source Added [SourceID: ' . $insert_id . ', Name: ' . $data['name'] . ']');
        }
        return $insert_id;
    }
    /**
     * Update lead source
     * @param  mixed $data source data
     * @param  mixed $id   source id
     * @return boolean
     */
    public function update_source($data, $id)
    {
        $this->db->where('id', $id);
        $this->db->update('tblleadssources', $data);
        if ($this->db->affected_rows() > 0) {
            logActivity('Leads Source Updated [SourceID: ' . $id . ', Name: ' . $data['name'] . ']');
            return true;
        }
        return false;
    }
    /**
     * Delete lead source from database
     * @param  mixed $id source id
     * @return mixed
     */
    public function delete_source($id)
    {
        $current = $this->get_source($id);
        // Check if is already using in table
        if (is_reference_in_table('source', 'tblleads', $id) || is_reference_in_table('lead_source', 'tblleadsemailintegration', $id)) {
            return array(
                'referenced' => true
            );
        }
        $this->db->where('id', $id);
        $this->db->delete('tblleadssources');
        if ($this->db->affected_rows() > 0) {
            if (get_option('leads_default_source') == $id) {
                update_option('leads_default_source', '');
            }
            logActivity('Leads Source Deleted [LeadID: ' . $id . ']');
            return true;
        }
        return false;
    }
    // Statuses
    /**
     * Get lead statuses
     * @param  mixed $id status id
     * @return mixed      object if id passed else array
     */
    public function get_status($id = '', $where = array())
    {
        $this->db->where($where);
        if (is_numeric($id)) {
            $this->db->where('id', $id);
            return $this->db->get('tblleadsstatus')->row();
        }
        $this->db->order_by('statusorder', 'asc');
        return $this->db->get('tblleadsstatus')->result_array();
    }
    /**
     * Add new lead status
     * @param array $data lead status data
     */
    public function add_status($data)
    {
        $this->db->insert('tblleadsstatus', $data);
        $insert_id = $this->db->insert_id();
        if ($insert_id) {
            logActivity('New Leads Status Added [StatusID: ' . $insert_id . ', Name: ' . $data['name'] . ']');
            return $insert_id;
        }
        return false;
    }
    public function update_status($data, $id)
    {
        $this->db->where('id', $id);
        $this->db->update('tblleadsstatus', $data);
        if ($this->db->affected_rows() > 0) {
            logActivity('Leads Status Updated [StatusID: ' . $id . ', Name: ' . $data['name'] . ']');
            return true;
        }
        return false;
    }
    /**
     * Delete lead status from database
     * @param  mixed $id status id
     * @return boolean
     */
    public function delete_status($id)
    {
        $current = $this->get_status($id);
        // Check if is already using in table
        if (is_reference_in_table('status', 'tblleads', $id) || is_reference_in_table('lead_status', 'tblleadsemailintegration', $id)) {
            return array(
                'referenced' => true
            );
        }

        $this->db->where('id', $id);
        $this->db->delete('tblleadsstatus');
        if ($this->db->affected_rows() > 0) {
            if (get_option('leads_default_status') == $id) {
                update_option('leads_default_status', '');
            }
            logActivity('Leads Status Deleted [StatusID: ' . $id . ']');
            return true;
        }
        return false;
    }
    /**
     * Update canban lead status when drag and drop
     * @param  array $data lead data
     * @return boolean
     */
    public function update_lead_status($data)
    {
        $this->db->select('status');
        $this->db->where('id',$data['leadid']);
        $_old = $this->db->get('tblleads')->row();

        $old_status = '';

        if($_old){
            $old_status = $this->get_status($_old->status);
            if($old_status){
                $old_status = $old_status->name;
            }
        }

        $affectedRows   = 0;
        $current_status = $this->get_status($data['status'])->name;

        $this->db->where('id', $data['leadid']);
        $this->db->update('tblleads', array(
            'status' => $data['status']
        ));

        $_log_message = '';

        if ($this->db->affected_rows() > 0) {
            $affectedRows++;
            if ($current_status != $old_status && $old_status != '') {
                $_log_message    = 'not_lead_activity_status_updated';
                $additional_data = serialize(array(
                    get_staff_full_name(),
                    $old_status,
                    $current_status
                ));
            }
            $this->db->where('id', $data['leadid']);
            $this->db->update('tblleads', array(
                'last_status_change' => date('Y-m-d H:i:s')
            ));
        }
        if (isset($data['order'])) {
            foreach ($data['order'] as $order_data) {
                $this->db->where('id', $order_data[0]);
                $this->db->update('tblleads', array(
                    'leadorder' => $order_data[1]
                ));
            }
        }
        if ($affectedRows > 0) {
            if ($_log_message == '') {
                return true;
            }
            $this->log_lead_activity($data['leadid'], $_log_message, false, $additional_data);
            return true;
        }
        return false;
    }
    /* Ajax */
    /**
     * All lead activity by staff
     * @param  mixed $id lead id
     * @return array
     */
    public function get_lead_activity_log($id)
    {
        $this->db->where('leadid', $id);
        $this->db->order_by('date', 'ASC');
        return $this->db->get('tblleadactivitylog')->result_array();
    }
    /**
     * Add lead activity from staff
     * @param  mixed  $id          lead id
     * @param  string  $description activity description
     */
    public function log_lead_activity($id, $description, $integration = false, $additional_data = '')
    {
        $log = array(
            'date' => date('Y-m-d H:i:s'),
            'description' => $description,
            'leadid' => $id,
            'staffid' => get_staff_user_id(),
            'additional_data' => $additional_data,
            'full_name'=>get_staff_full_name(get_staff_user_id())
        );
        if ($integration == true) {
            $log['staffid'] = 0;
            $log['full_name'] = '[CRON]';
        }

        $this->db->insert('tblleadactivitylog', $log);
        return $this->db->insert_id();
    }
    /**
     * Get email integration config
     * @return object
     */
    public function get_email_integration()
    {
        $this->db->where('id', 1);
        return $this->db->get('tblleadsemailintegration')->row();
    }
    /**
     * Get lead imported email activity
     * @param  mixed $id leadid
     * @return array
     */
    public function get_mail_activity($id)
    {
        $this->db->where('leadid', $id);
        $this->db->order_by('dateadded', 'asc');
        return $this->db->get('tblleadsemailintegrationemails')->result_array();
    }
    /**
     * Update email integration config
     * @param  mixed $data All $_POST data
     * @return boolean
     */
    public function update_email_integration($data)
    {
        $this->db->where('id', 1);
        $original_settings = $this->db->get('tblleadsemailintegration')->row();

        $this->db->where('id', 1);
        if (isset($data['active'])) {
            $data['active'] = 1;
        } else {
            $data['active'] = 0;
        }

        if (isset($data['delete_after_import'])) {
            $data['delete_after_import'] = 1;
        } else {
            $data['delete_after_import'] = 0;
        }

        if (isset($data['notify_lead_imported'])) {
            $data['notify_lead_imported'] = 1;
        } else {
            $data['notify_lead_imported'] = 0;
        }
        if (isset($data['notify_lead_contact_more_times'])) {
            $data['notify_lead_contact_more_times'] = 1;
        } else {
            $data['notify_lead_contact_more_times'] = 0;
        }
        if ($data['notify_lead_contact_more_times'] != 0 || $data['notify_lead_imported'] != 0) {
            if ($data['notify_type'] == 'specific_staff') {
                if (isset($data['notify_ids_staff'])) {
                    $data['notify_ids'] = serialize($data['notify_ids_staff']);
                    unset($data['notify_ids_staff']);
                } else {
                    $data['notify_ids'] = serialize(array());
                    unset($data['notify_ids_staff']);
                }
                if (isset($data['notify_ids_roles'])) {
                    unset($data['notify_ids_roles']);
                }
            } else {
                if (isset($data['notify_ids_roles'])) {
                    $data['notify_ids'] = serialize($data['notify_ids_roles']);
                    unset($data['notify_ids_roles']);
                } else {
                    $data['notify_ids'] = serialize(array());
                    unset($data['notify_ids_roles']);
                }
                if (isset($data['notify_ids_staff'])) {
                    unset($data['notify_ids_staff']);
                }
            }
        } else {
            $data['notify_ids']  = serialize(array());
            $data['notify_type'] = NULL;
            if (isset($data['notify_ids_staff'])) {
                unset($data['notify_ids_staff']);
            }
            if (isset($data['notify_ids_roles'])) {
                unset($data['notify_ids_roles']);
            }
        }
        if (isset($data['only_loop_on_unseen_emails'])) {
            $data['only_loop_on_unseen_emails'] = 1;
        } else {
            $data['only_loop_on_unseen_emails'] = 0;
        }
        // Check if not empty $data['password']
        // Get original
        // Decrypt original
        // Compare with $data['password']
        // If equal unset
        // If not encrypt and save
        if (!empty($data['password'])) {
            $or_decrypted = $this->encryption->decrypt($original_settings->password);
            if ($or_decrypted == $data['password']) {
                unset($data['password']);
            } else {
                $data['password'] = $this->encryption->encrypt($data['password']);
            }
        }

        $this->db->update('tblleadsemailintegration', $data);
        if ($this->db->affected_rows() > 0) {
            return true;
        }
        return false;
    }
    public function change_status_color($data)
    {
        $this->db->where('id', $data['status_id']);
        $this->db->update('tblleadsstatus', array(
            'color' => $data['color']
        ));
    }
    public function update_status_order()
    {
        $data = $this->input->post();
        foreach ($data['order'] as $status) {
            $this->db->where('id', $status[0]);
            $this->db->update('tblleadsstatus', array(
                'statusorder' => $status[1]
            ));
        }
    }
}
