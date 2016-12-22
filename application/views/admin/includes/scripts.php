<?php include_once(APPPATH.'views/admin/includes/helpers_bottom.php'); ?>
<?php do_action('before_js_scripts_render'); ?>
<script src="<?php echo base_url('assets/plugins/jquery/jquery.min.js'); ?>"></script>
<?php if(ENVIRONMENT !== 'production'){ ?>
<script src="<?php echo base_url('assets/plugins/jquery/jquery-migrate.js'); ?>"></script>
<?php } ?>
<script>
$(window).on('load',function(){
    init_btn_with_tooltips();
});
</script>
<script src="<?php echo base_url('assets/plugins/jquery-ui/jquery-ui.min.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/bootstrap/js/bootstrap.min.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/metisMenu/metisMenu.min.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/datatables/datatables.min.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/bootstrap-select/js/bootstrap-select.min.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/tinymce/tinymce.min.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/jquery-validation/jquery.validate.min.js'); ?>"></script>
<?php if(file_exists(FCPATH.'assets/plugins/jquery-validation/localization/messages_'.$locale.'.min.js')){ ?>
<script src="<?php echo base_url('assets/plugins/jquery-validation/localization/messages_'.$locale.'.min.js'); ?>"></script>
<?php } ?>
<script src="<?php echo base_url('assets/plugins/moment/moment-with-locales.min.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/moment-timezone/moment-timezone-with-data.min.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/moment-duration-format/moment-duration-format.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/datetimepicker/jquery.datetimepicker.full.min.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/Chart.js/Chart.min.js'); ?>" type="text/javascript"></script>
<script src="<?php echo base_url('assets/plugins/dropzone/min/dropzone.min.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/jquery.are-you-sure/jquery.are-you-sure.js'); ?>"></script>
<?php if(get_option('dropbox_app_key') != ''){ ?>
<script type="text/javascript" src="https://www.dropbox.com/static/api/2/dropins.js" id="dropboxjs" data-app-key="<?php echo get_option('dropbox_app_key'); ?>"></script>
<?php } ?>
<?php if(isset($lightbox_assets)){ ?>
<script id="lightbox-js" src="<?php echo base_url('assets/plugins/lightbox/js/lightbox.min.js'); ?>"></script>
<?php } ?>
<?php if(isset($media_assets)){ ?>
<script src="<?php echo base_url('assets/plugins/elFinder/js/elfinder.min.js'); ?>"></script>
<?php if(file_exists(FCPATH.'assets/plugins/elFinder/js/i18n/elfinder.'.$locale.'.js')){ ?>
<script src="<?php echo base_url('assets/plugins/elFinder/js/i18n/elfinder.'.$locale.'.js'); ?>"></script>
<?php } ?>
<?php } ?>
<?php if(isset($projects_assets)){ ?>
<script src="<?php echo base_url('assets/plugins/jquery-comments/js/jquery-comments.min.js'); ?>"></script>
<script src="<?php echo base_url('assets/plugins/gantt/js/jquery.fn.gantt.min.js'); ?>"></script>
<?php } ?>
<?php if(isset($circle_progress_asset)){ ?>
<script src="<?php echo base_url('assets/plugins/jquery-circle-progress/circle-progress.min.js'); ?>"></script>
<?php } ?>
<?php if(isset($accounting_assets)){ ?>
<script src="<?php echo base_url('assets/plugins/accounting.js/accounting.min.js'); ?>"></script>
<?php } ?>
<script src="<?php echo base_url('assets/plugins/bootstrap-colorpicker/js/bootstrap-colorpicker.min.js'); ?>"></script>
<?php if(isset($calendar_assets)){ ?>
<script src="<?php echo base_url('assets/plugins/fullcalendar/fullcalendar.min.js'); ?>"></script>
<?php if(get_option('google_api_key') != ''){ ?>
<script src="<?php echo base_url('assets/plugins/fullcalendar/gcal.js'); ?>"></script>
<?php } ?>
<?php if(file_exists(FCPATH.'assets/plugins/fullcalendar/locale/'.$locale.'.js')){ ?>
<script src="<?php echo base_url('assets/plugins/fullcalendar/locale/'.$locale.'.js'); ?>"></script>
<?php } ?>
<script src="<?php echo base_url('assets/js/calendar.js'); ?>"></script>
<?php } ?>
<script src="<?php echo base_url('assets/js/sales.js'); ?>"></script>
<script src="<?php echo base_url('assets/js/tasks.js'); ?>"></script>
<script src="<?php echo base_url('assets/js/main.js'); ?>"></script>
<?php do_action('after_js_scripts_render'); ?>
