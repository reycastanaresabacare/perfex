 <div class="activity-feed">
    <?php foreach($activity as $activity){
        ?>
        <div class="feed-item">
           <div class="date"><?php echo time_ago($activity['dateadded']); ?></div>
           <div class="text">
              <?php
              $fullname = $activity['fullname'];
              if($activity['staff_id'] != 0){ ?>
              <a href="<?php echo admin_url('profile/'.$activity['staff_id']); ?>"><?php echo staff_profile_image($activity['staff_id'],array('staff-profile-xs-image','pull-left mright10')); ?></a>
              <?php } else if($activity['contact_id'] != 0){
                $fullname = '<span class="label label-info inline-block mbot5">'._l('is_customer_indicator') . '</span> ' . $fullname = $activity['fullname']; ?>
                <a href="<?php echo admin_url('clients/client/'.get_user_id_by_contact_id($activity['contact_id']).'?contactid='.$activity['contact_id']); ?>">
                    <img src="<?php echo contact_profile_image_url($activity['contact_id']); ?>" class="staff-profile-xs-image pull-left mright10">
                </a>
                <?php } ?>
                <?php if($activity['visible_to_customer'] == 1){
                    $checked = 'checked';
                } else {
                    $checked = '';
                }
                ?>
                <div class="pull-right">
                    <p class="text-muted"><?php echo _l('project_activity_visible_to_customer'); ?></p>
                    <div class="text-right">
                        <div class="onoffswitch">
                            <input type="checkbox" <?php if(!has_permission('projects','','create')){echo 'disabled';} ?> id="<?php echo $activity['id']; ?>" data-id="<?php echo $activity['id']; ?>" class="onoffswitch-checkbox" data-switch-url="<?php echo ADMIN_URL; ?>/projects/change_activity_visibility" <?php echo $checked; ?>>
                            <label class="onoffswitch-label" for="<?php echo $activity['id']; ?>"></label>
                        </div>
                    </div>
                </div>
                <p class="mtop10"><?php echo $fullname . ' - <b>'.$activity['description'].'</b>'; ?></p>
                <p class="no-margin"><?php echo $activity['additional_data']; ?></p>
            </div>
            <div class="clearfix"></div>
            <hr />
        </div>
        <?php } ?>
    </div>
