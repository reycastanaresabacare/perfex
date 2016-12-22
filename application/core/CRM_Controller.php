<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class CRM_Controller extends CI_Controller
{
    function __construct()
    {
        parent::__construct();
        $this->check_installation();
        $this->db->reconnect();
        $timezone = get_option('default_timezone');
        date_default_timezone_set($timezone);

    }
    private function check_installation()
    {
        if (is_dir(FCPATH . 'install')) {
            echo '<h3>Delete the install folder</h3>';
            die;
        }
    }
}
