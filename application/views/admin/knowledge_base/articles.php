<?php init_head(); ?>
<div id="wrapper">
<div class="content">
<div class="row">
<?php include_once(APPPATH . 'views/admin/includes/alerts.php'); ?>
<div class="col-md-12">
    <div class="panel_s">
        <div class="panel-body _buttons">
            <?php if(has_permission('knowledge_base','','create')){ ?>
            <a href="<?php echo admin_url('knowledge_base/article'); ?>" class="btn btn-info"><?php echo _l('kb_article_new_article'); ?></a>
            <?php } ?>
            <a href="#" class="btn btn-default mleft5 toggle-articles-list"><i class="fa fa-th-list"></i></a>
            <div class="_hidden_inputs _filters">
                <?php foreach($groups as $group){
                    echo form_hidden('kb_group_'.$group['groupid']);
                    } ?>
            </div>
        </div>
        <div class="panel_s mtop5">
            <div class="panel-body">
                <div class="row">
                    <div class="tab-content">
                        <div role="tabpanel" class="tab-pane active kb-kan-ban kan-ban-tab hide fadeIn animated" id="kan-ban">
                            <div class="container-fluid">
                                <?php
                                    if(count($groups) == 0){
                                        echo _l('kb_no_articles_found');
                                    }
                                    foreach($groups as $group){
                                        $kanban_colors = '';
                                        foreach(get_system_favourite_colors() as $color){
                                            $color_selected_class = 'cpicker-small';
                                            $kanban_colors .= "<div class='kanban-cpicker cpicker ".$color_selected_class."' data-color='".$color."' style='background:".$color.";border:1px solid ".$color."'></div>";
                                        }
                                        ?>
                                <ul class="kan-ban-col" data-col-group-id="<?php echo $group['groupid']; ?>">
                                    <li class="kan-ban-col-wrapper">
                                        <div class="border-right panel_s">
                                            <?php
                                                $group_color = 'style="background:'.$group["color"].';border:1px solid '.$group['color'].'"';
                                                ?>
                                            <div class="panel-heading-bg primary-bg" <?php echo $group_color; ?> data-group-id="<?php echo $group['groupid']; ?>">
                                                <i class="fa fa-reorder pointer"></i> <a href="#" class="color-white" <?php if(has_permission('knowledge_base','','create') || has_permission('knowledge_base','','edit')){ ?>onclick="edit_kb_group(this,<?php echo $group['groupid']; ?>); return false;" data-name="<?php echo $group['name']; ?>" data-color="<?php echo $group['color']; ?>" data-description="<?php echo clear_textarea_breaks($group['description']); ?>" data-order="<?php echo $group['group_order']; ?>" data-active="<?php echo $group['active']; ?>" <?php } ?>><?php echo $group['name']; ?></a>
                                                <small> - <?php echo total_rows('tblknowledgebase','articlegroup='.$group['groupid']); ?></small>
                                                <a href="#" onclick="return false;" class="pull-right color-white kanban-color-picker" data-placement="bottom" data-toggle="popover" data-content="<div class='kan-ban-settings cpicker-wrapper'><?php echo $kanban_colors; ?></div>" data-html="true" data-trigger="focus"><i class="fa fa-angle-down"></i>
                                                </a>
                                            </div>
                                            <?php
                                                $this->db->select()->from('tblknowledgebase')->where('articlegroup',$group['groupid'])->order_by('article_order','asc');
                                                $articles = $this->db->get()->result_array();
                                                ?>
                                            <div class="kan-ban-content-wrapper">
                                                <div class="kan-ban-content">
                                                    <ul class="sortable article-group groups" data-group-id="<?php echo $group['groupid']; ?>">
                                                        <?php foreach($articles as $article) { ?>
                                                        <li class="<?php if($article['active'] == 0){echo 'line-throught';} ?>" data-article-id="<?php echo $article['articleid']; ?>">
                                                            <div class="panel-body">
                                                                <i class="fa fa-file-text-o"></i>
                                                                <a href="<?php echo admin_url('knowledge_base/article/'.$article['articleid']); ?>"><?php echo $article['subject']; ?></a>
                                                                <p class="text-info"><small><?php echo _l('article_total_views'); ?>: <?php echo total_rows('tblviewstracking',array('rel_type'=>'kb_article','rel_id'=>$article['articleid'])); ?></small></p>

                                                            </div>
                                                        </li>
                                                        <?php } ?>
                                                    </ul>
                                                </div>
                                            </div>
                                    </li>
                                </ul>
                                <?php } ?>
                                </div>
                            </div>
                            <div role="tabpanel" class="tab-pane" id="list_tab">
                                <div class="col-md-12">
                                    <div class="btn-group pull-right mleft4 btn-with-tooltip-group _filter_data" data-toggle="tooltip" data-title="<?php echo _l('filter_by'); ?>">
                                        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                                        <i class="fa fa-filter" aria-hidden="true"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-left" style="width:300px;">
                                            <li class="active">
                                                <a href="#" data-cview="all" onclick="dt_custom_view('','.table-articles',''); return false;"><?php echo _l('view_articles_list_all'); ?></a>
                                            </li>
                                            <?php foreach($groups as $group){ ?>
                                            <li><a href="#" data-cview="kb_group_<?php echo $group['groupid']; ?>" onclick="dt_custom_view('kb_group_<?php echo $group['groupid']; ?>','.table-articles','kb_group_<?php echo $group['groupid']; ?>'); return false;"><?php echo $group['name']; ?></a></li>
                                            <?php } ?>
                                        </ul>
                                    </div>
                                    <div class="clearfix"></div>
                                        <?php render_datatable(
                                            array(
                                                _l('kb_dt_article_name'),
                                                _l('kb_dt_group_name'),
                                                _l('options'),
                                                ),'articles'); ?>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<?php include_once(APPPATH.'views/admin/knowledge_base/group.php'); ?>
<?php init_tail(); ?>
<script>
    $(function(){
        var KB_Articles_ServerParams = {};
        $.each($('._hidden_inputs._filters input'),function(){
            KB_Articles_ServerParams[$(this).attr('name')] = '[name="'+$(this).attr('name')+'"]';
        });

        initDataTable('.table-articles', window.location.href, [2], [2], KB_Articles_ServerParams);
        fix_kanban_height(290,360);

        $(".groups").sortable({
            connectWith: ".article-group",
            helper: 'clone',
            appendTo: '#kan-ban',
            placeholder: "ui-state-highlight-kan-ban-kb",
            revert: true,
            scroll: true,
            scrollSensitivity: 50,
            scrollSpeed: 70,
            update: function(event, ui) {
                if (this === ui.item.parent()[0]) {
                    var articles = $(ui.item).parents('.article-group').find('li');
                    i = 1;
                    var order = [];
                    $.each(articles, function() {
                        i++;
                        order.push([$(this).data('article-id'), i]);
                    });

                    setTimeout(function() {
                        $.post(admin_url + 'knowledge_base/update_kan_ban', {
                            order: order,
                            groupid: $(ui.item.parent()[0]).data('group-id')
                        }).done(function(response) {
                            response = JSON.parse(response);
                            if (response.success == true) {
                                alert_float('success', response.message);
                            }
                        })
                    }, 100);
                }
            }
        }).disableSelection();
        setTimeout(function(){
            $('.kb-kan-ban').removeClass('hide');
        },200);
        $(".container-fluid").sortable({
            helper: 'clone',
            item: '.kan-ban-col',
            update: function(event, ui) {
                var order = [];
                var status = $('.kan-ban-col');
                var i = 0;
                $.each(status, function() {
                    order.push([$(this).data('col-group-id'), i]);
                    i++;
                });
                var data = {}
                data.order = order;
                $.post(admin_url + 'knowledge_base/update_groups_order', data);
            }
        });
        // Status color change
        $('body').on('click', '.kb-kan-ban .cpicker', function() {
            var color = $(this).data('color');
            var group_id = $(this).parents('.panel-heading-bg').data('group-id');
            $.post(admin_url + 'knowledge_base/change_group_color', {
                color: color,
                group_id: group_id
            });
        });
       $('.toggle-articles-list').on('click', function() {
        var list_tab = $('#list_tab');
        if (list_tab.hasClass('toggled')) {
            list_tab.css('display', 'none').removeClass('toggled');
            $('.kan-ban-tab').css('display', 'block');
            $('input[name="search[]"]').removeClass('hide');
        } else {
            list_tab.css('display', 'block').addClass('toggled');
            $('.kan-ban-tab').css('display', 'none');
            $('input[name="search[]"]').addClass('hide');
        }
    });
    });
</script>
</body>
</html>