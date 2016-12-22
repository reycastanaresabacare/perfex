<?php
/**
 * Render custom fields for particular area
 * @param  string  $belongs_to belongs to ex.leads,customers,staff
 * @param  boolean $rel_id     the main ID from the table
 * @return string
 */
function render_custom_fields($belongs_to, $rel_id = false, $where = array())
{
    $CI =& get_instance();
    $CI->db->where('active', 1);
    $CI->db->where('fieldto', $belongs_to);
    if (count($where) > 0) {
        $CI->db->where($where);
    }
    $CI->db->order_by('field_order', 'asc');
    $fields      = $CI->db->get('tblcustomfields')->result_array();
    $fields_html = '';

    $is_admin    = is_admin();
    if (count($fields)) {
        $fields_html .= '<div class="row">';
        foreach ($fields as $field) {

            if ($field['only_admin'] == 1 && !$is_admin) {
                continue;
            }

            $value = '';
            if($field['bs_column'] == '' || $field['bs_column'] == 0){
                $field['bs_column'] = 12;
            }

            $fields_html .= '<div class="col-md-'.$field['bs_column'].'">';
            if($is_admin){
                $fields_html .= '<a href="'.admin_url('custom_fields/field/'.$field['id']).'" target="_blank"><i class="fa fa-pencil-square-o"></i></a>';
            }
            if ($rel_id !== false) {
                $value = get_custom_field_value($rel_id, $field['id'], $belongs_to, false);
            }

            $_input_attrs = array();
            if ($field['required'] == 1) {
                $_input_attrs['data-custom-field-required'] = true;
            }

            if ($field['disalow_client_to_edit'] == 1 && is_client_logged_in()) {
                $_input_attrs['disabled'] = true;
            }
            $_input_attrs['data-fieldto'] = $field['fieldto'];
            $_input_attrs['data-fieldid'] = $field['id'];

            $field_name = ucfirst($field['name']);
            if ($field['type'] == 'input') {
                $fields_html .= render_input('custom_fields[' . $field['fieldto'] . '][' . $field['id'] . ']', $field_name, $value, 'text', $_input_attrs);
            } else if ($field['type'] == 'date_picker') {
                $fields_html .= render_date_input('custom_fields[' . $field['fieldto'] . '][' . $field['id'] . ']', $field_name, _d($value), $_input_attrs);
            } else if ($field['type'] == 'textarea') {
                $fields_html .= render_textarea('custom_fields[' . $field['fieldto'] . '][' . $field['id'] . ']', $field_name, $value, $_input_attrs);
            } else if($field['type'] == 'colorpicker'){
                $fields_html .= render_color_picker('custom_fields[' . $field['fieldto'] . '][' . $field['id'] . ']', $field_name, $value, $_input_attrs);
            } else if ($field['type'] == 'select') {
                $_select_attrs = array();
                $select_attrs  = '';
                if ($field['required'] == 1) {
                    $_select_attrs['data-custom-field-required'] = true;
                }
                if ($field['disalow_client_to_edit'] == 1 && is_client_logged_in()) {
                    $_select_attrs['disabled'] = true;
                }
                $_select_attrs['data-fieldto'] = $field['fieldto'];
                $_select_attrs['data-fieldid'] = $field['id'];
                foreach ($_select_attrs as $key => $val) {
                    $select_attrs .= $key . '=' . '"' . $val . '" ';
                }

                $fields_html .= '<div class="form-group">';
                $fields_html .= '<label for="custom_fields[' . $field['fieldto'] . '][' . $field['id'] . ']">' . $field_name . '</label>';
                $fields_html .= '<select ' . $select_attrs . ' name="custom_fields[' . $field['fieldto'] . '][' . $field['id'] . ']" class="selectpicker form-control" data-width="100%" data-none-selected-text="' . _l('dropdown_non_selected_tex') . '">';
                $fields_html .= '<option value=""></option>';
                $options = explode(',', $field['options']);
                foreach ($options as $option) {
                    $option   = trim($option);
                    $selected = '';
                    if ($option == $value) {
                        $selected = ' selected';
                    }
                    $fields_html .= '<option value="' . $option . '"' . $selected . '' . set_select('custom_fields[' . $field['fieldto'] . '][' . $field['id'] . ']', $option) . '>' . $option . '</option>';
                }
                $fields_html .= '</select>';
                $fields_html .= '</div>';
            } else if ($field['type'] == 'checkbox') {
                $fields_html .= '<p class="control-label">' . $field_name . '</p>';
                $options = explode(',', $field['options']);
                $value   = explode(',', $value);
                $fields_html .= '<div class="form-group chk">';
                foreach ($options as $option) {
                    $checked = '';
                    // Replace double quotes with single.
                    $option  = preg_replace('/"/', '', $option);
                    $option = trim($option);
                    foreach ($value as $v) {
                        $v = trim($v);
                        if ($v == $option) {
                            $checked = 'checked';
                        }
                    }

                    $_chk_attrs                 = array();
                    $chk_attrs                  = '';
                    $_chk_attrs['data-fieldto'] = $field['fieldto'];
                    $_chk_attrs['data-fieldid'] = $field['id'];

                    if ($field['required'] == 1) {
                        $_chk_attrs['data-custom-field-required'] = true;
                    }

                    if ($field['disalow_client_to_edit'] == 1 && is_client_logged_in()) {
                        $_chk_attrs['disabled'] = true;
                    }
                    foreach ($_chk_attrs as $key => $val) {
                        $chk_attrs .= $key . '=' . '"' . $val . '" ';
                    }

                    $fields_html .= '<div class="checkbox">';
                    $fields_html .= '<input class="custom_field_checkbox" ' . $chk_attrs . ' ' . set_checkbox('custom_fields[' . $field['fieldto'] . '][' . $field['id'] . '][]', $option) . ' ' . $checked . ' value="' . $option . '" id="cfc_' . $field['id'] . '_' . slug_it($option) . '" type="checkbox" name="custom_fields[' . $field['fieldto'] . '][' . $field['id'] . '][]">';

                    $fields_html .= '<label for="cfc_' . $field['id'] . '_' . slug_it($option) . '">' . $option . '</label>';
                    $fields_html .= '<input type="hidden" name="custom_fields[' . $field['fieldto'] . '][' . $field['id'] . '][]" value="cfk_hidden">';
                    $fields_html .= '</div>';
                }
                $fields_html .= '</div>';
            }
            $name = 'custom_fields[' . $field['fieldto'] . '][' . $field['id'] . ']';
            if ($field['type'] == 'checkbox') {
                $name .= '[]';
            }

            $fields_html .= form_error($name);
            // Close column
            $fields_html .= '</div>';

        }
        // close row
        $fields_html .= '</div>';
    }

    return $fields_html;
}
/**
 * Get custom fields
 * @param  [type] $field_to belongs to ex.leads,customers,staff
 * @return array
 */
function get_custom_fields($field_to, $where = array())
{
    $is_admin = is_admin();
    $CI =& get_instance();
    $CI->db->where('fieldto', $field_to);
    if (count($where) > 0) {
        $CI->db->where($where);
    }
    if (!$is_admin) {
        $CI->db->where('only_admin', 0);
    }
    $CI->db->where('active', 1);
    $CI->db->order_by('field_order', 'asc');

    return $CI->db->get('tblcustomfields')->result_array();
}
/**
 * Get custom field value
 * @param  mixed $rel_id   the main ID from the table
 * @param  mixed $field_id field id
 * @param  string $field_to belongs to ex.leads,customers,staff
 * @return mixed
 */
function get_custom_field_value($rel_id, $field_id, $field_to, $format = true)
{
    $CI =& get_instance();
    $CI->db->where('relid', $rel_id);
    $CI->db->where('fieldid', $field_id);
    $CI->db->where('fieldto', $field_to);
    $row    = $CI->db->get('tblcustomfieldsvalues')->row();
    $result = '';
    if ($row) {

        $result = $row->value;
        if ($format == true) {
            $CI->db->where('id', $field_id);
            $_row = $CI->db->get('tblcustomfields')->row();
            if ($_row->type == 'date_picker') {
                $result = _d($result);
            }
        }
    }
    return $result;
}
/**
 * Check for custom fields, update on $_POST
 * @param  mixed $rel_id        the main ID from the table
 * @param  array $custom_fields all custom fields with id and values
 * @return boolean
 */
function handle_custom_fields_post($rel_id, $custom_fields)
{


    $affectedRows = 0;
    $CI =& get_instance();

    foreach ($custom_fields as $key => $fields) {
        foreach ($fields as $field_id => $field_value) {

            $CI->db->where('relid', $rel_id);
            $CI->db->where('fieldid', $field_id);
            $CI->db->where('fieldto', $key);
            $row = $CI->db->get('tblcustomfieldsvalues')->row();
            // Make necessary checkings for fields
            $CI->db->where('id', $field_id);
            $field_checker = $CI->db->get('tblcustomfields')->row();
            if ($field_checker->type == 'date_picker') {
                $field_value = to_sql_date($field_value);
            } else if ($field_checker->type == 'textarea') {
                $field_value = nl2br($field_value);
            } else if ($field_checker->type == 'checkbox') {
                if ($field_checker->disalow_client_to_edit == 1 && is_client_logged_in()) {
                    continue;
                }
                if (is_array($field_value)) {
                    $v = 0;
                    foreach ($field_value as $chk) {
                        if ($chk == 'cfk_hidden') {
                            unset($field_value[$v]);
                        }
                        $v++;
                    }
                    $field_value = implode(', ', $field_value);
                }
            }
            if ($row) {
                $CI->db->where('id', $row->id);
                $CI->db->update('tblcustomfieldsvalues', array(
                    'value' => $field_value
                ));
                if ($CI->db->affected_rows() > 0) {
                    $affectedRows++;
                }
            } else {
                if ($field_value != '') {
                    $CI->db->insert('tblcustomfieldsvalues', array(
                        'relid' => $rel_id,
                        'fieldid' => $field_id,
                        'fieldto' => $key,
                        'value' => $field_value
                    ));
                    $insert_id = $CI->db->insert_id();
                    if ($insert_id) {
                        $affectedRows++;
                    }
                }
            }
        }
    }
    if ($affectedRows > 0) {
        return true;
    }
    return false;
}
/**
 * Get manually added company custom fields
 * @since Version 1.0.4
 * @return array
 */
function get_company_custom_fields()
{
    $fields = get_custom_fields('company');
    $i      = 0;
    foreach ($fields as $field) {
        $fields[$i]['label'] = $field['name'];
        $fields[$i]['value'] = get_custom_field_value(0, $field['id'], 'company');
        $i++;
    }
    return $fields;
}
