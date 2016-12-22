<div class="panel_s">
    <div class="panel-body">
        <h4 class="bold no-margin text-muted"><?php echo _l('customer_profile_files'); ?></h4>
    </div>
</div>
<div class="panel_s">
   <div class="panel-body">
    <?php if(count($files) == 0){ ?>
    <p class="bold no-margin"><?php echo _l('no_files_found'); ?></p>
    <?php } else { ?>
    <div class="table-responsive">
        <table class="table dt-table" data-order-col="1" data-order-type="desc">
           <thead>
            <tr>
                <th><?php echo _l('customer_attachments_file'); ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach($files as $file){ ?>
            <tr>
                <td>
                  <?php
                  $url = site_url() .'download/file/client/';
                  $path = get_upload_path_by_type('customer') . $file['rel_id'] . '/' . $file['file_name'];
                  $is_image = false;
                  if(!isset($file['external'])) {
                    $attachment_url = $url . $file['attachment_key'];
                    $is_image = is_image($path);
                    $img_url = site_url('download/preview_image?path='.$path.'&type='.$file['filetype']);
                } else if(isset($file['external']) && !empty($file['external'])){
                    if(!empty($file['thumbnail_link'])){
                        $is_image = true;
                        $img_url = optimize_dropbox_thumbnail($file['thumbnail_link']);
                    }
                    $attachment_url = $file['external_link'];
                }
                if($is_image){
                    echo '<div class="preview_image">';
                }
                ?>
                <a href="<?php echo $attachment_url; ?>" class="display-block mbot5">
                    <?php if($is_image){ ?>
                    <img src="<?php echo $img_url; ?>">
                    <?php } else { ?>
                    <i class="<?php echo get_mime_class($file['filetype']); ?>"></i> <?php echo $file['file_name']; ?>
                    <?php } ?>

                </a>
                <?php if($is_image){
                    echo '</div>';
                }
                ?>
            </td>
        </tr>
        <?php } ?>
    </tbody>
</table>
</div>
<?php } ?>
</div>
</div>
