<ul class="nav navbar-pills nav-tabs nav-stacked no-margin" role="tablist">
   <li class="active">
      <?php
         $url_profile = admin_url('clients/client');
         if(isset($client)){
            $url_profile = admin_url('clients/client/'.$client->userid.'?group=profile');
         }
         ?>
      <a href="<?php echo $url_profile; ?>" data-group="profile">
      <?php echo _l( 'client_add_edit_profile'); ?>
      </a>
   </li>
   <?php if(isset($client)) { ?>
   <?php if(has_permission('invoices','','view')) { ?>
    <li><a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=invoices'); ?>" data-group="invoices"><?php echo _l( 'client_invoices_tab'); ?></a></li>
   <?php } ?>

    <?php if(has_permission('payments','','view')) { ?>
    <li><a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=payments'); ?>" data-group="payments"><?php echo _l( 'client_payments_tab'); ?></a></li>
   <?php } ?>

    <?php if(has_permission('proposals','','view')) { ?>
    <li><a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=proposals'); ?>" data-group="proposals"><?php echo _l( 'proposals'); ?></a></li>
   <?php } ?>

     <?php if(has_permission('estimates','','view')) { ?>
    <li><a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=estimates'); ?>" data-group="estimates"><?php echo _l( 'estimates'); ?></a></li>
   <?php } ?>

   <?php if(has_permission('expenses','','view')){ ?>
   <li><a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=expenses'); ?>" data-group="expenses"><?php echo _l( 'client_expenses_tab'); ?></a></li>
   <?php } ?>
   <?php if(has_permission('contracts','','view')){ ?>
      <li><a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=contracts'); ?>" data-group="contracts"><?php echo _l( 'contracts_invoices_tab'); ?></a></li>
   <?php } ?>
   <li>
      <a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=projects'); ?>" data-group="projects">
      <?php echo _l( 'projects'); ?>
      </a>
   </li>
   <?php if((get_option('access_tickets_to_none_staff_members') == 1 && !is_staff_member()) || is_staff_member()){ ?>
   <li>
      <a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=tickets'); ?>" data-group="tickets">
      <?php echo _l( 'contracts_tickets_tab'); ?>
      </a>
   </li>
   <?php } ?>
   <li>
      <a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=tasks'); ?>" data-group="tasks">
      <?php echo _l( 'tasks'); ?>
      </a>
   </li>
   <li>
      <a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=attachments'); ?>" data-group="attachments">
      <?php echo _l( 'customer_attachments'); ?>
      </a>
   </li>
   <li>
      <a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=reminders'); ?>" data-group="reminders">
      <?php echo _l( 'client_reminders_tab'); ?>
      </a>
   </li>
   <li>
      <a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=map'); ?>" data-group="map">
      <?php echo _l( 'customer_map'); ?>
      </a>
   </li>
   <li>
      <a href="<?php echo admin_url('clients/client/'.$client->userid.'?group=notes'); ?>" data-group="notes">
      <?php echo _l( 'contracts_notes_tab'); ?>
      </a>
   </li>
   <?php } ?>
</ul>
