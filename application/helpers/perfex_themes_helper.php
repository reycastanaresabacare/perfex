<?php
/**
 * Get current template assets url
 * @return string Assets url
 */
function template_assets_url()
{
    return base_url('assets/themes/' . get_option('clients_default_theme')) . '/';
}
/**
 * Current theme view part
 * @param  string $name file name
 * @param  array  $data variables passed to view
 */
function get_template_part($name, $data = array(),$return = false)
{
    $CI =& get_instance();
    if($return == true){
        return $CI->load->view('themes/' . get_option('clients_default_theme') . '/' . 'template_parts/' . $name, $data, TRUE);
    }
    $CI->load->view('themes/' . get_option('clients_default_theme') . '/' . 'template_parts/' . $name, $data);
}
/**
 * Get all client themes in themes folder
 * @return array
 */
function get_all_client_themes()
{
    return list_folders(APPPATH . 'views/themes/');
}
/**
 * Get active client theme
 * @return mixed
 */
function active_clients_theme()
{
    $CI = &get_instance();

    $theme = get_option('clients_default_theme');

    if ($theme == '') {
        show_error('Default theme is not set');
    }
    if (!is_dir(APPPATH . 'views/themes/' . $theme)) {
        show_error('Theme does not exists');
    }
    return $theme;
}
