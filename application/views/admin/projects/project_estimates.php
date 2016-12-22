 <?php
 if(has_permission('estimates','','create')){
   include_once(APPPATH . 'views/admin/estimates/estimates_top_stats.php');
}
?>
<div class="project_estimates">
    <?php $this->load->view('admin/estimates/list_template'); ?>
</div>
