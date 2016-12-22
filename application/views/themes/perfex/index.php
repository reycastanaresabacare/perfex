<?php
echo $head;
if($use_navigation == true){
	get_template_part('navigation');
}
?>
<div id="wrapper">
	<div id="content">
		<div class="container">
			<div class="row">
				<?php if(is_staff_logged_in() && $use_navigation == true){ ?>
					<div id="staff_logged_in" class="alert alert-danger logged-in-as">
						You are logged in as <a href="<?php echo admin_url(); ?>">administrator</a>
					</div>
					<?php } ?>
					<?php get_template_part('alerts'); ?>
					<div class="clearfix"></div>
					<?php
					// Dont show calendar for invoices,estimates,proposals etc.. views where no navigation is included
					if(is_client_logged_in() && $use_submenu == true){ ?>
						<ul class="submenu">
							<li><a href="<?php echo site_url('clients/files'); ?>"><i class="fa fa-file" aria-hidden="true"></i> <?php echo _l('customer_profile_files'); ?></a></li>
							<li><a href="<?php echo site_url('clients/calendar'); ?>"><i class="fa fa-calendar-minus-o" aria-hidden="true"></i> <?php echo _l('calendar'); ?></a></li>
						</ul>
						<div class="clearfix"></div>
						<?php } ?>
						<?php echo $view; ?>
					</div>
				</div>
			</div>
			<?php
			echo $footer;
			echo $scripts;
			?>
		</div>
	</body>
	</html>
