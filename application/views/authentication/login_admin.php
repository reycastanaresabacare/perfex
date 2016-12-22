<?php $this->load->view('authentication/includes/head.php'); ?>
<body class="login_admin">
 <div class="container">
  <div class="row">
   <div class="col-md-4 col-md-offset-4 authentication-form-wrapper">
    <div class="company-logo">
     <?php get_company_logo(); ?>
   </div>
   <div class="mtop40 authentication-form">
    <h1><?php echo _l('admin_auth_login_heading'); ?></h1>
    <div class="row">
      <?php include_once(APPPATH . 'views/admin/includes/alerts.php'); ?>
    </div>
    <?php echo form_open($this->uri->uri_string()); ?>
    <?php echo validation_errors('<div class="alert alert-danger text-center">', '</div>'); ?>
    <?php echo render_input('email','admin_auth_login_email',set_value('email'),'email',array('autofocus'=>true)); ?>
    <?php echo render_input('password','admin_auth_login_password','','password'); ?>
    <div class="checkbox">
      <label for="remember">
       <input type="checkbox" id="remember" name="remember"> <?php echo _l('admin_auth_login_remember_me'); ?>
     </label>
   </div>
   <div class="form-group">
    <button type="submit" class="btn btn-info btn-block"><?php echo _l('admin_auth_login_button'); ?></button>
  </div>
  <div class="form-group">
    <a href="<?php echo site_url('authentication/forgot_password'); ?>"><?php echo _l('admin_auth_login_fp'); ?></a>
  </div>
  <?php if(get_option('recaptcha_secret_key') != '' && get_option('recaptcha_site_key') != '' && is_connected('google.com')){ ?>
    <div class="g-recaptcha" data-sitekey="<?php echo get_option('recaptcha_site_key'); ?>"></div>
    <?php } ?>
    <?php echo form_close(); ?>
  </div>
</div>
</div>
</div>
</body>
</html>
