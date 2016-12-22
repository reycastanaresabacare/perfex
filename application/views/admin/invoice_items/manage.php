<?php init_head(); ?>
<div id="wrapper">
    <div class="content">
        <div class="row">
            <?php include_once(APPPATH . 'views/admin/includes/alerts.php'); ?>
            <div class="col-md-12">
            <?php if(has_permission('items','','create')){ ?>
                <div class="panel_s">
                    <div class="panel-body _buttons">
                        <a href="#" class="btn btn-info pull-left" data-toggle="modal" data-target="#sales_item_modal"><?php echo _l('new_invoice_item'); ?></a>
                    </div>
                </div>
                <?php } ?>
                <div class="panel_s">
                    <div class="panel-body">
                        <div class="clearfix"></div>
                        <?php render_datatable(array(
                            _l('invoice_items_list_description'),
                            _l('invoice_item_long_description'),
                            _l('invoice_items_list_rate'),
                            _l('invoice_items_list_tax'),
                            _l('options'),
                            ),'invoice-items'); ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<?php $this->load->view('admin/invoice_items/item'); ?>
<?php init_tail(); ?>
<script>
    initDataTable('.table-invoice-items', window.location.href, [4], [4],'undefined',[0,'ASC']);
</script>
</body>
</html>
