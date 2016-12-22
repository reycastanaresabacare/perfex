Dropzone.options.salesUpload = false;
$(function() {
    // Init invoices top stats
    init_invoices_total();
    // Init expenses total
    init_expenses_total();
    // Make items sortable
    init_estimates_total();
    // Make items sortable
    init_items_sortable();

    if ($('body').hasClass('estimates-pipeline')) {
        var estimate_id = $('input[name="estimateid"]').val();
        estimate_pipeline_open(estimate_id);
    }

    if ($('body').hasClass('proposals-pipeline')) {
        var proposal_id = $('input[name="proposalid"]').val();
        proposal_pipeline_open(proposal_id);
    }

    // Remove the disabled attribute from the currency input becuase the form dont read it
    $('body').on('submit', '._transaction_form', function() {
        // On submit re-calculate total and reorder the items for all cases
        calculate_total();
        reorder_items();
        $('select[name="currency"]').prop('disabled', false);
        $('select[name="project_id"]').prop('disabled', false);
        return true;
    });

    $('body').on('click', '.invoice-form-submit', function() {
        var form = $('.invoice-form');
        if (form.valid()) {
            if ($(this).hasClass('save-as-draft')) {
                form.find('.additional').html(hidden_input('save_as_draft', 'true'));
            } else {
                form.find('.additional').html('');
            }
            form.submit();
        }
    });

    $('body').on('change', '[name="recurring"]', function() {
        var rec = $(this).val();
        if (rec != 0) {
            if (rec == 'custom') {
                $('.recurring_custom').removeClass('hide');
            } else {
                $('.recurring_custom').addClass('hide');
            }
            $('body').find('#recurring_ends_on').removeClass('hide');
        } else {
            $('body').find('#recurring_ends_on').addClass('hide');
            $('body').find('#recurring_ends_on input').val('');
            $('.recurring_custom').addClass('hide');
        }
    });

    // add estimate_note
    $('body').on('submit', '#estimate-notes', function() {
        var est_notes = $('#estimate-notes');
        if (est_notes.find('textarea[name="description"]').val() == '') {
            return;
        }
        var form = $(this);
        var data = $(form).serialize();
        $.post(form.attr('action'), data).done(function(estimate_id) {
            // Reload the notes
            get_estimate_notes(estimate_id);
            // Reset the note textarea value
            est_notes.find('textarea[name="description"]').val('');
        });
        return false;
    });
    // Show quantity as change we need to change on the table QTY heading for better user experience
    $('body').on('change', 'input[name="show_quantity_as"]', function() {
        $('body').find('th.qty').html($(this).data('text'));
    });

    $('body').on('change', 'div.estimate input[name="date"]', function() {
        do_prefix_year($(this).val());
    });

    $('body').on('change', 'div.invoice input[name="date"]', function() {

        var date = $(this).val();
        do_prefix_year(date);
        // This function not work on edit
        if ($('input[name="isedit"]').length > 0) {
            return;
        }
        if (date != '') {
            $.post(admin_url + 'invoices/get_due_date', {
                date: date
            }).done(function(formated) {
                $('input[name="duedate"]').val(formated);
            });
        } else {
            $('input[name="duedate"]').val('');
        }
    });

    $('#sales_attach_file').on('hidden.bs.modal', function(e) {
        $('#sales_uploaded_files_preview').empty();
        $('.dz-file-preview').empty();
    });


    if (typeof(Dropbox) != 'undefined') {
        if ($('#dropbox-chooser-sales').length > 0) {
            document.getElementById("dropbox-chooser-sales").appendChild(Dropbox.createChooseButton({
                success: function(files) {
                    var _data = {};
                    _data.rel_id = $('body').find('input[name="_attachment_sale_id"]').val();
                    _data.type = $('body').find('input[name="_attachment_sale_type"]').val();
                    _data.files = files;
                    _data.external = 'dropbox';
                    $.post(admin_url + 'misc/add_sales_external_attachment', _data).done(function() {
                        if (_data.type == 'invoice') {
                            init_invoice(_data.rel_id);
                        } else if (_data.type == 'estimate') {
                            if ($('body').hasClass('estimates-pipeline')) {
                                estimate_pipeline_open(_data.rel_id);
                            } else {
                                init_estimate(_data.rel_id);
                            }
                        } else if (_data.type == 'proposal') {
                            if ($('body').hasClass('proposals-pipeline')) {
                                proposal_pipeline_open(_data.rel_id);
                            } else {
                                init_proposal(_data.rel_id);
                            }
                        }
                        $('#sales_attach_file').modal('hide');
                    });
                },
                linkType: "preview",
                extensions: allowed_files.split(','),
            }));
        }
    }

    if ($('#sales-upload').length > 0) {
        new Dropzone('#sales-upload', {
            createImageThumbnails: false,
            dictFileTooBig: file_exceds_maxfile_size_in_form,
            sending: function(file, xhr, formData) {
                formData.append("rel_id", $('body').find('input[name="_attachment_sale_id"]').val());
                formData.append("type", $('body').find('input[name="_attachment_sale_type"]').val());
            },
            complete: function(file) {
                this.removeFile(file);
            },
            success: function(files, response) {
                response = JSON.parse(response);
                var type = $('body').find('input[name="_attachment_sale_type"]').val()
                var dl_url, delete_function;
                dl_url = 'download/file/sales_attachment/';
                delete_function = 'delete_' + type + '_attachment';
                if (type == 'invoice') {
                    init_invoice(response.rel_id);
                } else if (type == 'estimate') {
                    if ($('body').hasClass('estimates-pipeline')) {
                        estimate_pipeline_open(response.rel_id);
                    } else {
                        init_estimate(response.rel_id);
                    }
                } else if (type == 'proposal') {
                    if ($('body').hasClass('proposals-pipeline')) {
                        proposal_pipeline_open(response.rel_id);
                    } else {
                        init_proposal(response.rel_id);
                    }
                }

                var data = '';
                if (response.success == true) {

                    data += '<div class="display-block" data-attachment-id="' + response.attachment_id + '">';
                    data += '<div class="col-md-10">';
                    data += '<div class="pull-left"><i class="attachment-icon-preview fa fa-file-o"></i></div>'
                    data += '<a href="' + site_url + dl_url + response.key + '">' + response.file_name + '</a>';
                    data += '<p class="text-muted">' + response.filetype + '</p>';
                    data += '</div>';
                    data += '<div class="col-md-2 text-right">';
                    data += '<a href="#" class="text-danger" onclick="' + delete_function + '(' + response.attachment_id + '); return false;"><i class="fa fa-times"></i></a>';
                    data += '</div>';
                    data += '<div class="clearfix"></div><hr/>';
                    data += '</div>';
                    $('#sales_uploaded_files_preview').append(data);
                }
            },
            maxFilesize: max_php_ini_upload_size.replace(/\D/g, ''),
            acceptedFiles: allowed_files,
            error: function(file, response) {
                alert_float('danger', response);
            },

        });
    }

    // remove the preview in the modal after hide
    $('#invoice_attach').on('hidden.bs.modal', function(e) {
        $('.dz-preview').remove();
        $('.invoice-attach-dropzone-preview').remove();
    });

    // Items modal show action
    $('body').on('show.bs.modal', '#sales_item_modal', function(event) {
        // Set validation for invoice item form
        _validate_form($('#invoice_item_form'), {
            name: 'required',
            rate: {
                required: true,
            }
        }, manage_invoice_items);
        $('.affect-warning').addClass('hide');
        var button = $(event.relatedTarget)
        var id = button.data('id');
        $('#sales_item_modal input').val('');
        $('#sales_item_modal textarea').val('');
        $('select[name="tax"]').selectpicker('deselectAll');
        $('#sales_item_modal .add-title').removeClass('hide');
        $('#sales_item_modal .edit-title').addClass('hide');
        // If id found get the text from the datatable
        if (typeof(id) !== 'undefined') {
            $('.affect-warning').removeClass('hide');
            $('input[name="itemid"]').val(id);
            var description = $(button).parents('tr').find('td').eq(0).text();
            var long_description = $(button).parents('tr').find('td').eq(1).text();
            var rate = $(button).parents('tr').find('td').eq(2).text();
            var taxid = $(button).parents('tr').find('td').eq(3).find('span').data('taxid');
            $('#sales_item_modal .add-title').addClass('hide');
            $('#sales_item_modal .edit-title').removeClass('hide');
            $('#sales_item_modal input[name="description"]').val(description);
            $('#sales_item_modal input[name="rate"]').val(rate);
            $('#sales_item_modal textarea').val(long_description);
            $('select[name="tax"]').selectpicker('val', taxid);
        }
    });

    $('body').on('hidden.bs.modal', '#sales_item_modal', function(event) {
        $('#item_select').selectpicker('val', '');
    });

    // Show send to email invoice modal
    $('body').on('click', '.invoice-send-to-client', function(e) {
        e.preventDefault();
        $('#invoice_send_to_client_modal').modal('show');
    });
    // Show send to email estimate modal
    $('body').on('click', '.estimate-send-to-client', function(e) {
        e.preventDefault();
        $('#estimate_send_to_client_modal').modal('show');
    });
    // Send templaate modal custom close function causing problems if is on pipeline view
    $('body').on('click', '.close-send-template-modal', function() {
        $('#estimate_send_to_client_modal').modal('hide');
        $('#proposal_send_to_customer').modal('hide');
    });
    // Include shipping show/hide details
    $('body').on('change', '#include_shipping', function() {
        if ($(this).prop('checked') == true) {
            $('#shipping_details').removeClass('hide');
        } else {
            $('#shipping_details').addClass('hide');
        }
    });
    // Init the billing and shipping details in the field - estimates and invoices
    $('body').on('click', '.save-shipping-billing', function(e) {
        init_billing_and_shipping_details();
    });

    // On change currency recalculate price and change symbol
    $('body').on('change', 'select[name="currency"]', function() {
        init_currency_symbol();
    });
    // Dont allow NO TAX and other taxes to be selected together
    $('body').on('change', 'select.tax', function() {
        var value = $(this).val();
        if (value != null) {
            if (value.indexOf('') > -1) {
                if (value.length > 1) {
                    value.splice(0, 1);
                    $(this).selectpicker('val', value);
                }
            }
        }
    });
    // Recaulciate total on these changes
    $('body').on('change', 'input[name="adjustment"],select.tax', function() {
        calculate_total();
    });
    // Discount type for estimate/invoice
    $('body').on('change', 'select[name="discount_type"]', function() {
        // if discount_type == ''
        if ($(this).val() == '') {
            $('input[name="discount_percent"]').val(0);
        }
        // Recalculate the total
        calculate_total();
    });
    // In case user enter discount percent but there is no discount type set
    $('body').on('change', 'input[name="discount_percent"]', function() {
        console.log($(this).val())
        if ($('select[name="discount_type"]').val() == '' && $(this).val() != 0) {
            alert('Select discount type');
            $(this).val(0);
            $('html,body').animate({
                    scrollTop: 0
                },
                'slow');
            $('#wrapper').highlight($('label[for="discount_type"]').text());
            setTimeout(function() {
                $('#wrapper').unhighlight();
            }, 3000);
            return false;
        }
        if ($(this).valid() == true) {
            calculate_total();
        }
    });
    // Add item to preview from the dropdown for invoices estimates
    $('body').on('change', 'select[name="item_select"]', function() {

        var itemid = $(this).selectpicker('val');
        if (itemid != '' && itemid !== 'newitem') {
            add_item_to_preview(itemid);
        } else if (itemid == 'newitem') {
            // New item
            $('#sales_item_modal').modal('show');
        }
    });
    // Add task data to preview from the dropdown for invoiecs
    $('body').on('change', 'select[name="task_select"]', function() {
        var taskid = $(this).selectpicker('val');
        if (taskid != '') {
            add_task_to_preview_as_item(taskid);
        }
    });
    // When user record payment check if is online mode
    $('body').on('change', 'select[name="paymentmode"]', function() {
        !$.isNumeric($(this).val()) ? $('.do_not_redirect').removeClass('hide') : $('.do_not_redirect').addClass('hide');
    });

    $('body').on('change', '.f_client_id select[name="clientid"]', function() {
        var val = $(this).val();
        var s_project = $('select[name="project_id"]');
        s_project.empty();
        clear_billing_and_shipping_details();
        if (val == '') {
            $('#merge').empty();
            $('#expenses_to_bill').empty();
            s_project.selectpicker('refresh');
            $('.projects-wrapper').addClass('hide');
            return false;
        }
        var current_invoice = $('body').find('input[name="merge_current_invoice"]').val();
        $.get(admin_url + 'invoices/client_change_data/' + val + '/' + current_invoice, function(response) {
            $('#merge').html(response.merge_info);
            $('#expenses_to_bill').html(response.expenses_bill_info);

            if (response.merge_info != '' || response.expenses_bill_info != '') {
                $('#invoice_top_info').removeClass('hide');
            } else {
                $('#invoice_top_info').addClass('hide');
            }

            for (var f in bs_fields) {
                if (bs_fields[f].indexOf('billing') > -1) {
                    if (bs_fields[f].indexOf('country') > -1) {
                        $('select[name="' + bs_fields[f] + '"]').selectpicker('val', response['billing_shipping'][0][bs_fields[f]]);
                    } else {
                        $('input[name="' + bs_fields[f] + '"]').val(response['billing_shipping'][0][bs_fields[f]]);
                    }
                }
            }

            if (!empty(response['billing_shipping'][0]['shipping_street'])) {
                $('input[name="include_shipping"]').prop("checked", true);
                $('input[name="include_shipping"]').change();
            }

            for (var f in bs_fields) {
                if (bs_fields[f].indexOf('shipping') > -1) {
                    if (bs_fields[f].indexOf('country') > -1) {
                        $('select[name="' + bs_fields[f] + '"]').selectpicker('val', response['billing_shipping'][0][bs_fields[f]]);
                    } else {
                        $('input[name="' + bs_fields[f] + '"]').val(response['billing_shipping'][0][bs_fields[f]]);
                    }
                }
            }

            init_billing_and_shipping_details();

            var client_currency = response['client_currency'];
            var s_currency = $('body').find('.ei-template select[name="currency"]');
            client_currency = parseInt(client_currency);

            if (client_currency != 0) {
                s_currency.val(client_currency);
            } else {
                s_currency.val(s_currency.data('base'));
            }

            var billable_tasks_area = $('#task_select');
            if (billable_tasks_area.length > 0) {
                var option_data;
                billable_tasks_area.find('option').filter(function() {
                    return this.value || $.trim(this.value).length > 0 || $.trim(this.text).length > 0;
                }).remove();

                $.each(response['billable_tasks'], function(i, obj) {
                    option_data = ' ';
                    if (obj.started_timers == true) {
                        option_data += 'disabled class="text-danger important" data-subtext="' + invoice_task_billable_timers_found + '"';
                    } else {
                        option_data += 'data-subtext="' + obj.rel_name + '"';
                    }
                    billable_tasks_area.append('<option value="' + obj.id + '"' + option_data + '>' + obj.name + '</option>');
                });
                billable_tasks_area.selectpicker('refresh');
            }
            if (response.projects.length > 0) {
                $('.projects-wrapper').removeClass('hide');
                s_project.append('<option value=""></option>');
                $.each(response.projects, function(i, obj) {
                    s_project.append('<option value="' + obj.id + '">' + obj.name + '</option>');
                });
            } else {
                $('.projects-wrapper').addClass('hide');
            }
            s_project.selectpicker('refresh');
            s_currency.selectpicker('refresh');
            init_currency_symbol();
        }, 'json');
    });

    // When customer_id is passed init the data
    if ($('input[name="isedit"]').length == 0) {
        $('.f_client_id select[name="clientid"]').change();
    }

    $('body').on('click', '#get_shipping_from_customer_profile', function(e) {
        e.preventDefault();
        var include_shipping = $('#include_shipping');
        if (include_shipping.prop('checked') == false) {
            include_shipping.prop('checked', true);
            $('#shipping_details').removeClass('hide');
        }
        var clientid = $('select[name="clientid"]').val();
        if (clientid == '') {
            return;
        }
        $.get(admin_url + 'clients/get_customer_billing_and_shipping_details/' + clientid, function(response) {
            $('input[name="shipping_street"]').val(response[0]['shipping_street']);
            $('input[name="shipping_city"]').val(response[0]['shipping_city']);
            $('input[name="shipping_state"]').val(response[0]['shipping_state']);
            $('input[name="shipping_zip"]').val(response[0]['shipping_zip']);
            $('select[name="shipping_country"]').selectpicker('val', response[0]['shipping_country']);
        }, 'json');
    });
    if (typeof(accounting) != 'undefined') {
        // Used for formatting money
        accounting.settings.currency.decimal = decimal_separator;
        accounting.settings.currency.thousand = thousand_separator;
        // Used for numbers
        accounting.settings.number.thousand = thousand_separator;
        accounting.settings.number.decimal = decimal_separator;
        accounting.settings.number.precision = 2;
        calculate_total();
    }

    // Invoices to merge
    $('body').on('change', 'input[name="invoices_to_merge[]"]', function() {
        var checked = $(this).prop('checked');
        var _id = $(this).val();
        if (checked == true) {
            $.get(admin_url + 'invoices/get_merge_data/' + _id, function(response) {
                $.each(response.items, function(i, obj) {
                    if (obj.rel_type != '') {
                        if (obj.rel_type == 'task') {
                            $('input[name="task_id"]').val(obj.item_related_formated_for_input);
                        } else if (obj.rel_type == 'expense') {
                            $('input[name="expense_id"]').val(obj.item_related_formated_for_input);
                        }
                    }
                    add_item_to_table(obj, 'undefined', _id);
                });
            }, 'json');
        } else {
            // Remove the appended invoice to merge
            $('body').find('[data-merge-invoice="' + _id + '"]').remove();
        }
    });
    // Bill expenses to invooice on top
    $('body').on('change', 'input[name="bill_expenses[]"]', function() {
        var checked = $(this).prop('checked');
        var _id = $(this).val();
        if (checked == true) {
            $.get(admin_url + 'invoices/get_bill_expense_data/' + _id, function(response) {
                $('input[name="expense_id"]').val(_id);
                add_item_to_table(response, 'undefined', 'undefined', _id);
            }, 'json');
        } else {
            // Remove the appended expenses
            $('body').find('[data-bill-expense="' + _id + '"]').remove();
            $('body').find('#billed-expenses input[value="' + _id + '"]').remove();
        }
    });

    $('body').on('change', '.invoice_inc_expense_additional_info input', function() {
        var _data_content = $(this).attr('data-content'),
            new_desc_value,
            desc_selector = $('[data-bill-expense=' + $(this).attr('data-id') + '] .item_long_description');
        current_desc_val = desc_selector.val();
        current_desc_val = current_desc_val.trim();
        if (_data_content != '') {
            if ($(this).prop('checked') == true) {
                new_desc_value = current_desc_val + "\n" + _data_content;
                desc_selector.val(new_desc_value.trim());
            } else {
                desc_selector.val(current_desc_val.replace("\n" + _data_content, ''));
                // IN case there is no new line
                desc_selector.val(current_desc_val.replace(_data_content, ''));
            }
        }
    });

});

// Init single invoice
function init_invoice(id) {
    var _invoiceid = $('input[name="invoiceid"]').val();
    // Check if invoice passed from url, hash is prioritized becuase is last
    if (_invoiceid != '' && !window.location.hash) {
        id = _invoiceid;
        // Clear the current invoice value in case user click on the left sidebar invoices
        $('input[name="invoiceid"]').val('');
    } else {
        // check first if hash exists and not id is passed, becuase id is prioritized
        if (window.location.hash && !id) {
            id = window.location.hash.substring(1); //Puts hash in variable, and removes the # character
        }
    }
    if (typeof(id) == 'undefined' || id == '') {
        return;
    }
    if (!$('body').hasClass('small-table')) {
        toggle_small_view('.table-invoices', '#invoice');
    }
    $('input[name="invoiceid"]').val(id);
    do_hash_helper(id);
    $('#invoice').load(admin_url + 'invoices/get_invoice_data_ajax/' + id);
    if (is_mobile()) {
        $('html, body').animate({
            scrollTop: $('#invoice').offset().top + 150
        }, 600);
    }
}
// Init single Estimate
function init_estimate(id) {
    var _estimateid = $('input[name="estimateid"]').val();

    // Check if estimate passed from url, hash is prioritized becuase is last
    if (_estimateid != '' && !window.location.hash) {
        id = _estimateid;
        // Clear the current estimate value in case user click on the left sidebar invoices
        $('input[name="estimateid"]').val('');
    } else {
        // check first if hash exists and not id is passed, becuase id is prioritized
        if (window.location.hash && !id) {
            id = window.location.hash.substring(1); //Puts hash in variable, and removes the # character
        }
    }
    if (typeof(id) == 'undefined' || id == '') {
        return;
    }

    if (!$('body').hasClass('small-table')) {
        toggle_small_view('.table-estimates', '#estimate');
    }
    $('input[name="estimateid"]').val(id);
    do_hash_helper(id);
    $('#estimate').load(admin_url + 'estimates/get_estimate_data_ajax/' + id);

    if (is_mobile()) {
        $('html, body').animate({
            scrollTop: $('#estimate').offset().top + 150
        }, 600);
    }
}

// Init single Estimate
function init_proposal(id) {
    var _proposal_id = $('input[name="proposal_id"]').val();
    // Check if proposal passed from url, hash is prioritized becuase is last
    if (_proposal_id != '' && !window.location.hash) {
        id = _proposal_id;
        // Clear the current proposal value in case user click on the left sidebar invoices
        $('input[name="proposal_id"]').val('');
    } else {
        // check first if hash exists and not id is passed, becuase id is prioritized
        if (window.location.hash && !id) {
            id = window.location.hash.substring(1); //Puts hash in variable, and removes the # character
        }
    }
    if (typeof(id) == 'undefined' || id == '') {
        return;
    }
    if (!$('body').hasClass('small-table')) {
        toggle_small_view('.table-proposals', '#proposal');
    }
    $('input[name="proposal_id"]').val(id);
    do_hash_helper(id);
    $('#proposal').load(admin_url + 'proposals/get_proposal_data_ajax/' + id);

    if (is_mobile()) {
        $('html, body').animate({
            scrollTop: $('#proposal').offset().top + 150
        }, 600);
    }
}

function clear_billing_and_shipping_details() {
    for (var f in bs_fields) {
        if (bs_fields[f].indexOf('country') > -1) {
            $('select[name="' + bs_fields[f] + '"]').selectpicker('val', '');
        } else {
            $('input[name="' + bs_fields[f] + '"]').val('');
        }
        if (bs_fields[f] == 'billing_country') {
            $('input[name="include_shipping"]').prop("checked", false);
            $('input[name="include_shipping"]').change();
        }
    }

    init_billing_and_shipping_details();
}

function init_billing_and_shipping_details() {
    var _f;
    var include_shipping = $('input[name="include_shipping"]').prop('checked');
    for (var f in bs_fields) {
        _f = '';
        if (bs_fields[f].indexOf('country') > -1) {
            _f = $("#" + bs_fields[f] + " option:selected").data('subtext');
        } else {
            _f = $('input[name="' + bs_fields[f] + '"]').val();
        }
        if (bs_fields[f].indexOf('shipping') > -1) {
            if (!include_shipping) {
                _f = '';
            }
        }
        if (typeof(_f) == 'undefined') {
            _f = '';
        }
        _f = (_f != '' ? _f : '--');
        $('.' + bs_fields[f]).text(_f);
    }
    $('#billing_and_shipping_details').modal('hide');
}
// Record payment function
function record_payment(id) {
    if (typeof(id) == 'undefined' || id == '') {
        return;
    }
    $('#invoice').load(admin_url + 'invoices/record_invoice_payment_ajax/' + id);
}
// Add item to preview
function add_item_to_preview(itemid) {
    $.get(admin_url + 'invoice_items/get_item_by_id/' + itemid, function(response) {
        if (!response.taxname) {
            response.taxname = '';
        }
        $('textarea[name="description"]').val(response.description);
        $('textarea[name="long_description"]').val(response.long_description.replace(/(<|&lt;)br\s*\/*(>|&gt;)/g, " "));
        $('input[name="quantity"]').val(1);
        if (response.taxname && response.taxrate) {
            $('.main select.tax').selectpicker('val', response.taxname + '|' + response.taxrate);
        }
        $('input[name="rate"]').val(response.rate);
    }, 'json');
}
// Add task to preview
function add_task_to_preview_as_item(task_id) {
    $.get(admin_url + 'tasks/get_billable_task_data/' + task_id, function(response) {
        response.taxname = $('select.main-tax').selectpicker('val');
        $('textarea[name="description"]').val(response.name);
        $('textarea[name="long_description"]').val(response.description);
        $('input[name="quantity"]').val(response.total_hours);
        $('input[name="rate"]').val(response.hourly_rate);
        $('input[name="task_id"]').val(task_id);
    }, 'json');
}
// Clear the items added to preview
function clear_main_values(default_taxes) {
    // Get the last taxes applied to be available for the next item
    var last_taxes_applied = $('table.items tbody').find('tr:last-child').find('select').selectpicker('val');
    $('textarea[name="description"]').val('');
    $('textarea[name="long_description"]').val('');
    $('input[name="quantity"]').val(1);
    $('.main select.tax').selectpicker('val', last_taxes_applied);
    $('input[name="rate"]').val('');
    $('input[name="item-search"]').val('');
    $('.item-search .dropdown-menu').html('');
    $('input[name="task_id"]').val('');
}

// Append the added items to the preview to the table as items
function add_item_to_table(data, itemid, merge_invoice, bill_expense) {
    // If not custom data passed get from the preview
    if (typeof(data) == 'undefined' || data == 'undefined') {
        data = get_main_values();
    }
    var table_row = '';
    var item_key = $('body').find('tbody .item').length + 1;
    table_row += '<tr class="sortable item" data-merge-invoice="' + merge_invoice + '" data-bill-expense="' + bill_expense + '">';
    table_row += '<td class="dragger">';
    // Check if quantity is number
    if (isNaN(data.qty)) {
        data.qty = 1;
    }
    // Check if rate is number
    if (data.rate == '' || isNaN(data.rate)) {
        data.rate = 0;
    }
    var amount = data.rate * data.qty;
    amount = accounting.formatNumber(amount);
    var tax_name = 'newitems[' + item_key + '][taxname][]';
    $('body').append('<div class="dt-loader"></div>');
    var regex = /<br[^>]*>/gi;
    get_taxes_dropdown_template(tax_name, data.taxname).done(function(tax_dropdown) {
        // order input
        table_row += '<input type="hidden" class="order" name="newitems[' + item_key + '][order]">';
        table_row += '</td>';
        table_row += '<td class="bold description"><textarea name="newitems[' + item_key + '][description]" class="form-control" rows="5">' + data.description + '</textarea></td>';
        table_row += '<td><textarea name="newitems[' + item_key + '][long_description]" class="form-control item_long_description" rows="5">' + data.long_description.replace(regex, "\n") + '</textarea></td>';
        table_row += '<td><input type="number" min="0" onblur="calculate_total();" onchange="calculate_total();" data-quantity name="newitems[' + item_key + '][qty]" value="' + data.qty + '" class="form-control"></td>';
        table_row += '<td class="rate"><input type="text" data-toggle="tooltip" title="' + item_field_not_formated + '" onblur="calculate_total();" onchange="calculate_total();" name="newitems[' + item_key + '][rate]" value="' + data.rate + '" class="form-control"></td>';
        table_row += '<td class="taxrate">' + tax_dropdown + '</td>';
        table_row += '<td class="amount">' + amount + '</td>';
        table_row += '<td><a href="#" class="btn btn-danger pull-left" onclick="delete_item(this,' + itemid + '); return false;"><i class="fa fa-trash"></i></a></td>';
        table_row += '</tr>';
        $.when($('table.items tbody').append(table_row)).then(calculate_total);
        var billed_task = $('input[name="task_id"]').val();
        var billed_expense = $('input[name="expense_id"]').val();
        if (billed_task != '' && typeof(billed_task) != 'undefined') {
            billed_tasks = billed_task.split(',');
            $.each(billed_tasks, function(i, obj) {
                $('#billed-tasks').append(hidden_input('billed_tasks[' + item_key + '][]', obj));
            });
        }

        if (billed_expense != '' && typeof(billed_expense) != 'undefined') {

            billed_expenses = billed_expense.split(',');
            $.each(billed_expenses, function(i, obj) {
                $('#billed-expenses').append(hidden_input('billed_expenses[' + item_key + '][]', obj));
            });
        }
        init_selectpicker();
        clear_main_values();
        reorder_items();
        $('body').find('.dt-loader').remove();
        $('#item_select').selectpicker('val', '');
        return true;
    });
    return false;
}
// Get taxes dropdown selectpicker template / Causing problems with ajax becuase is fetching from server
function get_taxes_dropdown_template(name, taxname) {
    jQuery.ajaxSetup({
        async: false
    });

    var d = $.post(admin_url + 'misc/get_taxes_dropdown_template/', {
        name: name,
        taxname: taxname
    });

    jQuery.ajaxSetup({
        async: true
    });

    return d;
}
// Fix for reordering the items the tables to show the full width
function fixHelperTableHelperSortable(e, ui) {
    ui.children().each(function() {
        $(this).width($(this).width());
    });
    return ui;
}

function init_items_sortable(preview_table) {
    $("body").find('.items tbody').sortable({
        helper: fixHelperTableHelperSortable,
        handle: '.dragger',
        placeholder: 'ui-placeholder',
        itemPath: '> tbody',
        itemSelector: 'tr.sortable',
        items: "tr.sortable",
        update: function() {
            if (typeof(preview_table) == 'undefined') {
                reorder_items();
            } else {
                // If passed from the admin preview there is other function for re-ordering
                save_ei_items_order();
            }
        },
        sort: function(event, ui) {
            // Firefox fixer when dragging
            var $target = $(event.target);
            if (!/html|body/i.test($target.offsetParent()[0].tagName)) {
                var top = event.pageY - $target.offsetParent().offset().top - (ui.helper.outerHeight(true) / 2);
                ui.helper.css({
                    'top': top + 'px'
                });
            }
        }
    });
}
// Save the items from order from the admin preview
function save_ei_items_order() {
    var rows = $('.table.invoice-items-preview.items tbody tr,.table.estimate-items-preview.items tbody tr');
    var i = 1;
    var order = [];
    var _order_id, type;
    var item_id;
    if ($('.table.items').hasClass('invoice-items-preview')) {
        type = 'invoice';
    } else if ($('.table.items').hasClass('estimate-items-preview')) {
        type = 'estimate';
    } else {
        return false;
    }
    $.each(rows, function() {
        order.push([$(this).data('item-id'), i]);
        // update item number when reordering
        $(this).find('td.item_no').html(i);
        i++;
    });
    setTimeout(function() {
        $.post(admin_url + 'misc/update_ei_items_order/' + type, {
            data: order
        });
    }, 50);
}
// Reoder the items in table edit for estimate and invoices
function reorder_items() {
    var rows = $('.table.table-main-invoice-edit tbody tr.item,.table.table-main-estimate-edit tbody tr.item');
    var i = 1;
    $.each(rows, function() {
        $(this).find('input.order').val(i);
        i++;
    });
}
// Get the preview main values
function get_main_values() {
    var response = {};
    response.description = $('textarea[name="description"]').val();
    response.long_description = $('textarea[name="long_description"]').val();
    response.qty = $('input[name="quantity"]').val();
    response.taxname = $('.main select.tax').selectpicker('val');
    response.rate = $('input[name="rate"]').val();
    return response;
}
// Calculate invoice total - NOT RECOMENDING EDIT THIS FUNCTION BECUASE IS VERY SENSITIVE
function calculate_total() {

    var calculated_tax,
        taxrate,
        item_taxes,
        row,
        _amount,
        _tax_name,
        taxes = {},
        taxes_rows = [],
        subtotal = 0,
        total = 0,
        quantity = 1;
    total_discount_calculated = 0,
        rows = $('.table.table-main-invoice-edit tbody tr.item,.table.table-main-estimate-edit tbody tr.item'),
        adjustment = $('input[name="adjustment"]').val(),
        discount_area = $('tr#discount_percent'),
        discount_percent = $('input[name="discount_percent"]').val();
    discount_type = $('select[name="discount_type"]').val();

    $('.tax-area').remove();

    $.each(rows, function() {
        quantity = $(this).find('[data-quantity]').val();
        if (quantity == '') {
            quantity = 1;
            $(this).find('[data-quantity]').val(1);
        }
        _amount = parseFloat($(this).find('td.rate input').val()) * quantity;
        $(this).find('td.amount').html(accounting.formatNumber(_amount));
        subtotal += _amount;
        row = $(this);
        item_taxes = $(this).find('select.tax').selectpicker('val');

        if (item_taxes) {
            $.each(item_taxes, function(i, taxname) {
                taxrate = row.find('select.tax [value="' + taxname + '"]').data('taxrate');
                calculated_tax = (_amount / 100 * taxrate);
                if (!taxes.hasOwnProperty(taxname)) {
                    if (taxrate != 0) {
                        _tax_name = taxname.split('|');
                        tax_row = '<tr class="tax-area"><td>' + _tax_name[0] + '(' + taxrate + '%)</td><td id="tax_id_' + slugify(taxname) + '"></td></tr>';
                        $(discount_area).after(tax_row);
                        taxes[taxname] = calculated_tax;
                    }
                } else {
                    // Increment total from this tax
                    taxes[taxname] = taxes[taxname] += calculated_tax;
                }
            });
        }
    });

    if (discount_percent != '' && discount_type == 'before_tax') {
        // Calculate the discount total
        total_discount_calculated = (subtotal * discount_percent) / 100;
    }

    $.each(taxes, function(taxname, total_tax) {
        if (discount_percent != '' && discount_type == 'before_tax') {
            total_tax_calculated = (total_tax * discount_percent) / 100;
            total_tax = (total_tax - total_tax_calculated);
        }

        total += total_tax;
        total_tax = accounting.formatNumber(total_tax)
        $('#tax_id_' + slugify(taxname)).html(total_tax);

    });

    total = (total + subtotal);

    if (discount_percent != '' && discount_type == 'after_tax') {
        // Calculate the discount total
        total_discount_calculated = (total * discount_percent) / 100;
    }

    total = total - total_discount_calculated;
    adjustment = parseFloat(adjustment);

    // Check if adjustment not empty
    if (!isNaN(adjustment)) {
        total = total + adjustment;
    }

    // Append, format to html and display
    $('.discount_percent').html('-' + accounting.formatNumber(total_discount_calculated) + hidden_input('discount_percent', discount_percent) + hidden_input('discount_total', total_discount_calculated));
    $('.adjustment').html(accounting.formatNumber(adjustment) + hidden_input('adjustment', adjustment.toFixed(2)))
    $('.subtotal').html(subtotal = accounting.formatNumber(subtotal) + hidden_input('subtotal', subtotal.toFixed(2)));
    $('.total').html(format_money(total) + hidden_input('total', total.toFixed(2)));
}
// Deletes invoice items
function delete_item(row, itemid) {
    $(row).parents('tr').addClass('animated fadeOut', function() {
        setTimeout(function() {
            $(row).parents('tr').remove();
            calculate_total();
        }, 50)
    });
    // If is edit we need to add to input removed_items to track activity
    if ($('input[name="isedit"]').length > 0) {
        $('#removed-items').append(hidden_input('removed_items[]', itemid));
    }
}
// Format money functions
function format_money(total) {
    if (currency_placement === 'after') {
        return accounting.formatMoney(total, {
            format: "%v %s"
        });
    } else {
        return accounting.formatMoney(total);
    }
}

// Set the currency symbol for accounting
function init_currency_symbol() {
    if (typeof(accounting) != 'undefined') {
        accounting.settings.currency.symbol = $('body').find('.ei-template select[name="currency"]').find('option:selected').data('subtext');
        calculate_total();
    }
}

function delete_invoice_attachment(id) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'invoices/delete_attachment/' + id, function(success) {
            if (success == 1) {
                $('body').find('[data-attachment-id="' + id + '"]').remove();
                init_invoice($('body').find('input[name="_attachment_sale_id"]').val());
            }
        }).fail(function(error) {
            alert_float('danger', error.responseText);
        });
    }
}

function delete_estimate_attachment(id) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'estimates/delete_attachment/' + id, function(success) {
            if (success == 1) {
                $('body').find('[data-attachment-id="' + id + '"]').remove();
                var rel_id = $('body').find('input[name="_attachment_sale_id"]').val();
                if ($('body').hasClass('estimates-pipeline')) {
                    estimate_pipeline_open(rel_id)
                } else {
                    init_estimate(rel_id);
                }
            }
        }).fail(function(error) {
            alert_float('danger', error.responseText);
        });
    }
}

function delete_proposal_attachment(id) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'proposals/delete_attachment/' + id, function(success) {
            if (success == 1) {
                var rel_id = $('body').find('input[name="_attachment_sale_id"]').val();
                $('body').find('[data-attachment-id="' + id + '"]').remove();

                if ($('body').hasClass('proposals-pipeline')) {
                    proposal_pipeline_open(rel_id)
                } else {
                    init_proposal(rel_id);
                }
            }
        }).fail(function(error) {
            alert_float('danger', error.responseText);
        });
    }
}

function init_invoices_total(manual) {
    if ($('#invoices_total').length == 0) {
        return;
    }

    if ($('body').hasClass('invoices_total_manual') && typeof(manual) == 'undefined' && !$('.invoices-total').hasClass('initialized')) {
        return;
    }
    $('.invoices-total').addClass('initialized');
    var _years = $('._filters._hidden_inputs').find('input[name^="year"]');
    var years = [];
    $.each(_years, function() {
        var _y = $(this).val();
        if (_y != '') {
            years.push(_y);
        }
    });

    var _agents = $('._filters._hidden_inputs').find('input[name^="sale_agent"]');
    var agents = [];
    $.each(_agents, function() {
        var _a = $(this).val();
        if (_a != '') {
            agents.push(_a);
        }
    });

    var _modes = $('._filters._hidden_inputs').find('input[name^="invoice_payments_by_"]');
    var modes = [];
    $.each(_modes, function() {
        var _m = $(this).val();
        if (_m != '') {
            modes.push(_m);
        }
    });

    var currency = $('body').find('select[name="total_currency"]').val();
    var data = {
        currency: currency,
        years: years,
        agents: agents,
        payment_modes: modes,
        init_total: true,
    };

    var project_id = $('input[name="project_id"]').val();
    var customer_id = $('.customer_profile input[name="userid"]').val();
    if (typeof(project_id) != 'undefined') {
        data.project_id = project_id;
    } else if (typeof(customer_id) != 'undefined') {
        data.customer_id = customer_id;
    }
    $.post(admin_url + 'invoices/get_invoices_total', data).done(function(response) {
        $('#invoices_total').html(response);
    });
}

function init_estimates_total(manual) {
    if ($('#estimates_total').length == 0) {
        return;
    }

    if ($('body').hasClass('estimates_total_manual') && typeof(manual) == 'undefined' && !$('.estimates-total').hasClass('initialized')) {
        return;
    }
    $('.estimates-total').addClass('initialized');

    var currency = $('body').find('select[name="total_currency"]').val();
    var _years = $('._filters._hidden_inputs').find('input[name^="year"]');
    var years = [];
    $.each(_years, function() {
        var _y = $(this).val();
        if (_y != '') {
            years.push(_y);
        }
    });
    var _agents = $('._filters._hidden_inputs').find('input[name^="sale_agent"]');
    var agents = [];
    $.each(_agents, function() {
        var _a = $(this).val();
        if (_a != '') {
            agents.push(_a);
        }
    });

    var customer_id = '';
    var project_id = '';

    var _customer_id = $('.customer_profile input[name="userid"]').val();
    var _project_id = $('input[name="project_id"]').val();
    if (typeof(_customer_id) != 'undefined') {
        customer_id = _customer_id;
    } else if (typeof(_project_id) != 'undefined') {
        project_id = _project_id;
    }

    $.post(admin_url + 'estimates/get_estimates_total', {
        currency: currency,
        init_total: true,
        years: years,
        agents: agents,
        customer_id: customer_id,
        project_id: project_id,
    }).done(function(response) {
        $('#estimates_total').html(response);
    });
}

function init_expenses_total() {
    if ($('#expenses_total').length == 0) {
        return;
    }
    var _f
    var currency = $('select[name="expenses_total_currency"]').val();
    var _years = $('._filters._hidden_inputs').find('input[name^="year"]');
    var years = [];
    $.each(_years, function() {
        _f = $(this).val();
        if (_f != '') {
            years.push(_f);
        }
    });
    var _months = $('._filters._hidden_inputs').find('input[name^="expenses_by_month_"]');
    var months = [];
    $.each(_months, function() {
        _f = $(this).val();
        if (_f != '') {
            months.push(_f);
        }
    });
    var _categories = $('._filters._hidden_inputs').find('input[name^="expenses_by_category_"]');
    var categories = [];
    $.each(_categories, function() {
        _f = $(this).val();
        if (_f != '') {
            categories.push(_f);
        }
    });
    var customer_id = '';
    var _customer_id = $('.customer_profile input[name="userid"]').val();
    if (typeof(customer_id) != 'undefined') {
        customer_id = _customer_id;
    }

    var project_id = '';
    var _project_id = $('input[name="project_id"]').val();
    if (typeof(project_id) != 'undefined') {
        project_id = _project_id;
    }

    $.post(admin_url + 'expenses/get_expenses_total', {
        currency: currency,
        init_total: true,
        months: months,
        years: years,
        categories: categories,
        customer_id: customer_id,
        project_id: project_id,
    }).done(function(response) {
        $('#expenses_total').html(response);
    });
}

function validate_invoice_form(selector) {
    if (typeof(selector) == 'undefined') {
        selector = '#invoice-form';
    }
    _validate_form($(selector), {
        clientid: 'required',
        date: 'required',
        currency: 'required',
        number: {
            required: true,
        }
    });
    $('body').find('input[name="number"]').rules('add', {
        remote: {
            url: admin_url + "invoices/validate_invoice_number",
            type: 'post',
            data: {
                number: function() {
                    return $('input[name="number"]').val();
                },
                isedit: function() {
                    return $('input[name="number"]').data('isedit');
                },
                original_number: function() {
                    return $('input[name="number"]').data('original-number');
                },
                date: function() {
                    return $('input[name="date"]').val();
                },
            }
        },
        messages: {
            remote: invoice_number_exists,
        }
    });
}

function validate_estimate_form(selector) {
    if (typeof(selector) == 'undefined') {
        selector = '#estimate-form';
    }
    _validate_form($(selector), {
        clientid: 'required',
        date: 'required',
        currency: 'required',
        number: {
            required: true
        }
    });

    $('body').find('input[name="number"]').rules('add', {
        remote: {
            url: admin_url + "estimates/validate_estimate_number",
            type: 'post',
            data: {
                number: function() {
                    return $('input[name="number"]').val();
                },
                isedit: function() {
                    return $('input[name="number"]').data('isedit');
                },
                original_number: function() {
                    return $('input[name="number"]').data('original-number');
                }
            }
        },
        messages: {
            remote: estimate_number_exists,
        }
    });

}
// Sort estimates in the pipeline view / switching sort type by click
function estimates_pipeline_sort(type) {
    var sort = $('input[name="sort"]');
    $('input[name="sort_type"]').val(type);
    if (sort.val() == 'ASC') {
        sort.val('DESC');
    } else if (sort.val() == 'DESC') {
        sort.val('ASC');
    } else {
        sort.val('DESC');
    }
    estimate_pipeline();
}
// Sort proposals in the pipeline view / switching sort type by click
function proposal_pipeline_sort(type) {
    var sort = $('input[name="sort"]');
    $('input[name="sort_type"]').val(type);
    if (sort.val() == 'ASC') {
        sort.val('DESC');
    } else if (sort.val() == 'DESC') {
        sort.val('ASC');
    } else {
        sort.val('DESC');
    }
    proposals_pipeline();
}
// Init estimates pipeline
function estimate_pipeline() {
    init_kanban('estimates/get_pipeline', estimates_pipeline_update, '.pipeline-status', 310, 360);
}

function estimates_pipeline_update(ui, object) {
    if (object === ui.item.parent()[0]) {
        var data = {};
        data.estimateid = $(ui.item).data('estimate-id');
        data.status = $(ui.item.parent()[0]).data('status-id');
        var order = [];
        var status = $(ui.item).parents('.pipeline-status').find('li')
        var i = 1;
        $.each(status, function() {
            order.push([$(this).data('estimate-id'), i]);
            i++;
        });
        data.order = order;
        check_kanban_empty_col('[data-estimate-id]');
        $.post(admin_url + 'estimates/update_pipeline', data);
    }
}

function proposals_pipeline_update(ui, object) {
    if (object === ui.item.parent()[0]) {
        var data = {};
        data.proposalid = $(ui.item).data('proposal-id');
        data.status = $(ui.item.parent()[0]).data('status-id');
        var order = [];
        var status = $(ui.item).parents('.pipeline-status').find('li')
        var i = 1;
        $.each(status, function() {
            order.push([$(this).data('proposal-id'), i]);
            i++;
        });
        data.order = order;

        check_kanban_empty_col('[data-proposal-id]');
        $.post(admin_url + 'proposals/update_pipeline', data);
    }
}
// Init proposals pipeline
function proposals_pipeline() {
    init_kanban('proposals/get_pipeline', proposals_pipeline_update, '.pipeline-status', 310, 360);
}
// Open single proposal in pipeline
function proposal_pipeline_open(id) {
    if (id == '') {
        return;
    }
    $.get(admin_url + 'proposals/pipeline_open/' + id, function(response) {
        var visible = $('.proposal-pipeline-modal:visible').length;
        $('#proposal').html(response);
        if (visible == 0) {
            $('.proposal-pipeline-modal').modal({
                show: true,
                backdrop: 'static',
                keyboard: false
            });
        } else {
            $('#proposal').find('.modal.proposal-pipeline-modal').addClass('in').css('display', 'block');
        }

    });
}
// Estimate single open in pipeline
function estimate_pipeline_open(id) {
    if (id == '') {
        return;
    }
    $.get(admin_url + 'estimates/pipeline_open/' + id, function(response) {
        var visible = $('.estimate-pipeline:visible').length;
        $('#estimate').html(response);
        if (visible == 0) {
            $('.estimate-pipeline').modal({
                show: true,
                backdrop: 'static',
                keyboard: false
            });
        } else {
            $('#estimate').find('.modal.estimate-pipeline').addClass('in').css('display', 'block');
        }
    });
}
// Delete estimate note
function delete_estimate_note(wrapper, id) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'estimates/delete_note/' + id, function(response) {
            if (response.success == true) {
                $(wrapper).parents('.estimate-note').remove();
            }
        }, 'json');
    }
}
// Get all estimate notes
function get_estimate_notes(id) {
    $.get(admin_url + 'estimates/get_notes/' + id, function(response) {
        $('#estimate_notes_area').html(response);
    });
}
// Proposal merge field into the editor
function insert_proposal_merge_field(field) {
    var key = $(field).text();
    tinymce.activeEditor.execCommand('mceInsertContent', false, key);
}
// Toggle full view for small tables like proposals
function small_table_full_view() {
    $('#small-table').toggleClass('hide');
    $('.small-table-right-col').toggleClass('col-md-12');
    $('.small-table-right-col').toggleClass('col-md-7');
}

function manage_invoice_items(form) {
    var data = $(form).serialize();
    var url = form.action;
    $.post(url, data).done(function(response) {
        response = JSON.parse(response);
        if (response.success == true) {
            if ($('body').find('.ei-template').length > 0) {
                $('#item_select').find('option').eq(0).after('<option data-subtext="' + response.item.long_description + '" value="' + response.item.itemid + '">' + response.item.description + '</option>');
                $('body').find('#item_select').selectpicker('refresh');
                add_item_to_preview(response.item.itemid);
            } else {
                // Is general items view
                $('.table-invoice-items').DataTable().ajax.reload();
            }
            alert_float('success', response.message);
        }
        $('#sales_item_modal').modal('hide');
    }).fail(function(data) {
        alert_float('danger', data.responseText);
    });
    return false;
}

function save_sales_number_settings(e) {
    var data = {};
    data.prefix = $('body').find('input[name="s_prefix"]').val();
    if (data.prefix != '') {
        $.post($(e).data('url'), data).done(function(response) {
            response = JSON.parse(response);
            if (response.success && response.message) {
                alert_float('success', response.message);
                $('#prefix').html(data.prefix);
            }
        });
    }
}

function do_prefix_year(date) {
    var date_array;
    if (date.indexOf('.') > -1) {
        date_array = date.split('.');
    } else if (date.indexOf('-') > -1) {
        date_array = date.split('-');
    } else if (date.indexOf('/') > -1) {
        date_array = date.split('/');
    }
    if (typeof(date_array) != 'undefined') {
        $.each(date_array, function(i, string) {
            if (string.length == 4) {
                $('#prefix_year').html(string);
            }
        });
    }
}

function delete_sale_activity(id) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'misc/delete_sale_activity/' + id, function() {
            $('body').find('[data-sale-activity-id="' + id + '"]').remove();
        });
    }
}
