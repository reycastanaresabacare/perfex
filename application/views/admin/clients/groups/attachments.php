  <h4 class="no-mtop bold"><?php echo _l('customer_attachments'); ?></h4>
  <hr />
  <?php if(isset($client)){ ?>
  <?php echo form_open_multipart(admin_url('clients/upload_attachment/'.$client->userid),array('class'=>'dropzone','id'=>'client-attachments-upload')); ?>
  <input type="file" name="file" multiple />
  <?php echo form_close(); ?>
  <div class="text-right mtop15">
    <div id="dropbox-chooser"></div>
</div>
<div class="attachments">
    <div class="container-fluid">
        <div class="table-responsive mtop25">
            <table class="table dt-table">
                <thead>
                    <tr>
                        <th><?php echo _l('customer_attachments_file'); ?></th>
                        <th><?php echo _l('customer_attachments_show_in_customers_area'); ?></th>
                        <th><?php echo _l('options'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($attachments as $type => $attachment){
                        $download_indicator = 'id';
                        $key_indicator = 'rel_id';
                        $upload_path = get_upload_path_by_type($type);
                        if($type == 'invoice'){
                            $url = site_url() .'download/file/sales_attachment/';
                            $download_indicator = 'attachment_key';
                        } else if($type == 'proposal'){
                            $url = site_url() .'download/file/sales_attachment/';
                            $download_indicator = 'attachment_key';
                        } else if($type == 'estimate'){
                            $url = site_url() .'download/file/sales_attachment/';
                            $download_indicator = 'attachment_key';
                        } else if($type == 'contract'){
                            $url = site_url() .'download/file/contract/';
                        } else if($type == 'lead'){
                            $url = site_url() .'download/file/lead_attachment/';
                        } else if($type == 'task'){
                            $url = site_url() .'download/file/taskattachment/';
                        } else if($type == 'ticket'){
                            $url = site_url() .'download/file/ticket/';
                            $key_indicator = 'ticketid';
                        } else if($type == 'customer'){
                            $url = site_url() .'download/file/client/';
                        } else if($type == 'expense'){
                            $url = site_url() .'download/file/expense/';
                            $download_indicator = 'rel_id';
                        }
                        ?>
                        <?php foreach($attachment as $_att){
                            ?>
                            <tr>
                                <td>
                                   <?php
                                   $path = $upload_path . $_att[$key_indicator] . '/' . $_att['file_name'];
                                   $is_image = false;
                                   if(!isset($_att['external'])) {
                                    $attachment_url = $url . $_att[$download_indicator];
                                    $is_image = is_image($path);
                                    $img_url = site_url('download/preview_image?path='.$path.'&type='.$_att['filetype']);
                                } else if(isset($_att['external']) && !empty($_att['external'])){

                                    if(!empty($_att['thumbnail_link'])){
                                        $is_image = true;
                                        $img_url = optimize_dropbox_thumbnail($_att['thumbnail_link']);
                                    }

                                    $attachment_url = $_att['external_link'];
                                }
                                if($is_image){
                                    echo '<div class="preview_image">';
                                }
                                ?>
                                <a href="<?php if($is_image){ echo $img_url; } else {echo $attachment_url; } ?>"<?php if($is_image){ ?> data-lightbox="customer-profile" <?php } ?> class="display-block mbot5">
                                    <?php if($is_image){ ?>
                                    <div class="table-image">
                                         <img src="<?php echo $img_url; ?>">
                                    </div>
                                    <?php } else { ?>
                                    <i class="<?php echo get_mime_class($_att['filetype']); ?>"></i> <?php echo $_att['file_name']; ?>
                                    <?php } ?>

                                </a>
                                <?php if($is_image){
                                    echo '</div>';
                                }
                                ?>
                            </td>
                            <td>
                            <div class="onoffswitch"<?php if($type != 'customer'){?> data-toggle="tooltip" data-title="<?php echo _l('customer_attachments_show_notice'); ?>" <?php } ?>>
                            <input type="checkbox" <?php if($type != 'customer'){echo 'disabled';} ?> id="<?php echo $_att['id']; ?>" data-id="<?php echo $_att['id']; ?>" class="onoffswitch-checkbox" data-switch-url="<?php echo ADMIN_URL; ?>/misc/toggle_file_visibility" <?php if(isset($_att['visible_to_customer']) && $_att['visible_to_customer'] == 1){echo 'checked';} ?>>
                                <label class="onoffswitch-label" for="<?php echo $_att['id']; ?>"></label>
                            </div>
                        </td>
                        <td>
                            <?php if(!isset($_att['external'])){ ?>
                            <button type="button" data-toggle="modal" data-file-name="<?php echo $_att['file_name']; ?>" data-filetype="<?php echo $_att['filetype']; ?>" data-path="<?php echo $path; ?>" data-target="#send_file" class="btn btn-info btn-icon"><i class="fa fa-envelope"></i></button>
                            <?php } ?>
                            <?php if($type == 'customer'){ ?>
                            <a href="<?php echo admin_url('clients/delete_attachment/'.$_att['rel_id'].'/'.$_att['id']); ?>"  class="btn btn-danger btn-icon _delete"><i class="fa fa-remove"></i></a>
                            <?php } ?>
                        </td>
                        <?php } ?>
                    </tr>
                    <?php } ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
<?php
include_once(APPPATH . 'views/admin/clients/modals/send_file_modal.php');
} ?>
