<?php
ob_start();
?>
<li id="top_search" class="dropdown">
    <input type="search" id="search_input" class="form-control" placeholder="<?php echo _l('top_search_placeholder'); ?>">
    <div id="search_results">
    </div>
</li>
<li id="top_search_button">
    <button class="btn"><i class="fa fa-search"></i></button>
</li>
<?php
$top_search_area = ob_get_contents();
ob_end_clean();
?>
<div id="header">
    <div class="hide-menu hidden-lg"><i class="fa fa-bars"></i></div>
    <div id="logo">
        <?php get_company_logo('admin') ?>
    </div>
    <nav>
        <div class="small-logo">
            <span class="text-primary">
                <?php get_company_logo('admin') ?>
            </span>
        </div>
        <div class="mobile-menu">
            <button type="button" class="navbar-toggle visible-md visible-sm visible-xs mobile-menu-toggle collapsed" data-toggle="collapse" data-target="#mobile-collapse" aria-expanded="false">
                <i class="fa fa-chevron-down"></i>
            </button>
            <ul class="mobile-icon-menu">
                <?php
                // To prevent not loading the timers twice
                if(is_mobile()){ ?>
                <li class="dropdown notifications-wrapper">
                    <?php $this->load->view('admin/includes/notifications'); ?>
                </li>
                <?php if(is_staff_member()){ ?>
                <li>
                    <a href="#" class="open_newsfeed"><i class="fa fa-commenting" aria-hidden="true"></i></a>
                </li>
                <?php } ?>
                <li>
                    <a href="#" class="dropdown-toggle top-timers<?php if(count($_started_timers) > 0){echo ' text-warning';} ?>" data-toggle="dropdown"><i class="fa fa-clock-o"></i></a>
                    <ul class="dropdown-menu animated fadeIn started-timers-top width300">
                       <?php $this->load->view('admin/tasks/started_timers'); ?>
                   </ul>
               </li>
               <?php } ?>
           </ul>
           <div class="mobile-navbar collapse" id="mobile-collapse" aria-expanded="false" style="height: 0px;" role="navigation" >
            <ul class="nav navbar-nav">
                <li><a href="<?php echo admin_url('profile'); ?>"><?php echo _l('nav_my_profile'); ?></a></li>
                <li><a href="<?php echo admin_url('staff/edit_profile'); ?>"><?php echo _l('nav_edit_profile'); ?></a></li>
                <li><a href="#" onclick="logout(); return false;"><?php echo _l('nav_logout'); ?></a></li>
            </ul>
        </div>
    </div>
    <div class="navbar-right">
        <ul class="nav navbar-nav">
            <?php
            if(!is_mobile()){
                echo $top_search_area;
            } ?>
            <li>
                <a href="#" class="dropdown-toggle profile" data-toggle="dropdown" aria-expanded="false">
                    <?php echo staff_profile_image($_staff->staffid,array('img','img-responsive','staff-profile-image-small','pull-left')); ?>
                    <?php echo $_staff->firstname . ' ' . $_staff->lastname; ?>
                    <i class="fa fa-angle-down"></i>
                </a>
                <ul class="dropdown-menu animated fadeIn">
                    <li><a href="<?php echo admin_url('profile'); ?>"><?php echo _l('nav_my_profile'); ?></a></li>
                    <li><a href="<?php echo admin_url('staff/edit_profile'); ?>"><?php echo _l('nav_edit_profile'); ?></a></li>
                    <li><a href="#" onclick="logout(); return false;"><?php echo _l('nav_logout'); ?></a></li>
                </ul>
            </li>
            <li class="icon">
                <a href="<?php echo admin_url('business_news'); ?>" data-toggle="tooltip" data-placement="bottom" title="<?php echo _l('business_news'); ?>"><i class="fa fa-newspaper-o"></i></a>
            </li>
            <li class="icon">
                <a href="<?php echo admin_url('todo'); ?>" data-toggle="tooltip" title="<?php echo _l('nav_todo_items'); ?>" data-placement="bottom"><i class="fa fa-list"></i>
                    <?php $_unfinished_todos = total_rows('tbltodoitems',array('finished'=>0,'staffid'=>get_staff_user_id())); ?>
                    <span class="label label-warning icon-total-indicator nav-total-todos<?php if($_unfinished_todos == 0){echo ' hide';} ?>"><?php echo $_unfinished_todos; ?></span>
                </a>
            </li>
            <li class="icon">
                <a href="#" class="dropdown-toggle top-timers<?php if(count($_started_timers) > 0){echo ' text-warning';} ?>" data-toggle="dropdown"><i class="fa fa-clock-o"></i></a>
                <ul class="dropdown-menu animated fadeIn started-timers-top width300">
                    <?php $this->load->view('admin/tasks/started_timers'); ?>
                </ul>
            </li>
            <?php if(is_staff_member()){ ?>
            <li class="icon">
                <a href="#" class="open_newsfeed"><i class="fa fa-commenting" aria-hidden="true"></i></a>
            </li>
            <?php } ?>
            <li class="dropdown notifications-wrapper">
                <?php $this->load->view('admin/includes/notifications'); ?>
            </li>
        </ul>
    </div>
</nav>
</div>
<div id="mobile-search" class="<?php if(!is_mobile()){echo 'hide';} ?>">
    <ul>
        <?php
        if(is_mobile()){
            echo $top_search_area;
        } ?>
    </ul>
</div>