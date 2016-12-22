// Set datatables error throw console log
$.fn.dataTable.ext.errMode = 'throw';
// Delay function
var delay = (function() {
    var timer = 0;
    return function(callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();

var leads_update_req;
window.onbeforeunload = function() {
    if (leads_update_req) {
        return 'Request in progress....are you sure you want to continue? If you have a lot of leads takes time to update all leads orders. If this still shows after couple of minutes refresh your page.';
    }
};

// Function to slug string
function slugify(string) {
    return string
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}
var original_top_search_val,
    tab_active = get_url_param('tab'),
    tab_group = get_url_param('group'),
    side_bar = $('#side-menu'),
    setup_menu = $('#setup-menu-wrapper'),
    menu_href_selector,
    activity_log_table = $('.table-activity-log'),
    alerts = $('#alerts'),
    total_new_post_files = 0,
    newsfeed_posts_page = 0,
    track_load_post_likes = 0,
    track_load_comment_likes = 0,
    post_likes_total_pages = 0,
    comment_likes_total_pages = 0,
    postid = 0,
    available_reminders_table = [
        '.table-reminders',
        '.table-invoices',
        '.table-reminders-leads',
        '.table-invoices',
        '.table-estimates',
        '.table-proposals',
        '.table-expenses',
    ];
Dropzone.options.newsFeedDropzone = false;
$(window).on("resize click", function() {
    // Add special class to minimalize page elements when screen is less than 768px
    setBodySmall();
    // Waint until metsiMenu, collapse and other effect finish and set wrapper height
    setTimeout(function() {
        mainWrapperHeightFix();
    }, 300);
});

$(function() {
    $(document).on('focusin', function(e) {
        if ($(e.target).closest(".mce-window").length) {
            e.stopImmediatePropagation();
        }
    });
    if (alerts.length > 0) {
        // Set timeout to remove php alerts added from flashdata
        setTimeout(function() {
            alerts.slideUp();
        }, 4000);
    }
    // Check for active tab if any found in url so we can set this tab to active - Tab active is defined on top
    if (tab_active) {
        $('body').find('.nav-tabs [href="#' + tab_active + '"]').click();
    }
    // Check for active tab groups (this is custom made) and not related to boostrap - tab_group is defined on top
    if (tab_group) {
        // Do not track bootstrap default tabs
        $('body').find('.nav-tabs li').not('[role="presentation"]').removeClass('active');
        // Add the class active to this group manualy so the tab can be highlighted
        $('body').find('.nav-tabs [data-group="' + tab_group + '"]').parents('li').addClass('active');
    }
    // Set datetimepicker locale
    jQuery.datetimepicker.setLocale(locale);
    // Set moment locale
    moment.locale(locale);
    // Set timezone locale
    moment().tz(timezone).format();
    // Init tinymce editors
    init_editor();
    // Dont close dropdown on timer top click
    $('body').on('click', 'li.timer a', function(e) {
        e.stopPropagation();
    });
    // Init all color pickers
    init_color_pickers();
    // Init tables offline (no serverside)
    initDataTableOffline();

    // Bootstrap switch active or inactive global function
    $('body').on('change', '.onoffswitch input', function(event, state) {
        var switch_url = $(this).data('switch-url');
        if (!switch_url) {
            return;
        }
        switch_field(this);
    });
    // Init lightboxes if found
    init_lightbox();
    // Init progress bars
    init_progress_bars();
    // Init datepickers
    init_datepicker();
    // Init bootstrap selectpicker
    init_selectpicker();
    // Optimize body
    setBodySmall();
    // Optimize wrapper height
    mainWrapperHeightFix();
    // Validate all form for reminders
    init_form_reminder();
    // On delete reminder reload the tables
    $('body').on('click', '.delete-reminder', function() {
        var r = confirm(confirm_action_prompt);
        if (r == false) {
            return false;
        } else {
            $.get($(this).attr('href'), function(response) {
                alert_float(response.alert_type, response.message);
                // Looop throug all availble reminders table to reload the data
                $.each(available_reminders_table, function(i, table) {
                    if ($.fn.DataTable.isDataTable(table)) {
                        $('body').find(table).DataTable().ajax.reload();
                    }
                });
            }, 'json');
        }
        return false;
    });


    $('body').on('shown.bs.modal','#sync_data_proposal_data',function(){
        if($('#sync_data_proposal_data').data('rel-type') == 'lead'){
            $('.lead-modal .modal-content').eq(0).css('height',( $('#sync_data_proposal_data .modal-content').height() + 80 )+'px').css('overflow-x','hidden');
        }
    });

    $('body').on('hidden.bs.modal','#sync_data_proposal_data',function(){
        if($('#sync_data_proposal_data').data('rel-type') == 'lead'){
            $('.lead-modal .modal-content').prop('style','');
        }
    });

    if (typeof(c_leadid) != 'undefined' && c_leadid != '') {
        init_lead(c_leadid);
    }
    // Status color change
    $('body').on('click', '.leads-kan-ban .cpicker', function() {
        var color = $(this).data('color');
        var status_id = $(this).parents('.panel-heading-bg').data('status-id');
        $.post(admin_url + 'leads/change_status_color', {
            color: color,
            status_id: status_id
        });
    });

    $('body').on('click', '[lead-edit]', function() {
        $('body .lead-view').toggleClass('hide');
        $('body .lead-edit').toggleClass('hide');
    });

    $('body').on('click', '.new-lead-from-status', function(e) {
        e.preventDefault();
        var status_id = $(this).parents('.kan-ban-col').data('col-status-id');
        init_lead_modal_data('undefined', admin_url + 'leads/lead?status_id=' + status_id);
    });

    $('body').on('change', 'input.include_leads_custom_fields', function() {
        var val = $(this).val();
        var fieldid = $(this).data('field-id');
        if (val == 2) {
            $('#merge_db_field_' + fieldid).removeClass('hide');
        } else {
            $('#merge_db_field_' + fieldid).addClass('hide');
        }
        if (val == 3) {
            $('#merge_db_contact_field_' + fieldid).removeClass('hide');
        } else {
            $('#merge_db_contact_field_' + fieldid).addClass('hide');
        }
    });

    // Auto focus the lead name if user is adding new lead
    $('body').on('shown.bs.modal', '.lead-modal', function(e) {
        if ($('body').find('.lead-modal input[name="leadid"]').length == 0) {
            $('body').find('.lead-modal input[name="name"]').focus();
        }
    });

    // On hidden lead modal some actions need to be operated here
    $('.lead-modal').on('hidden.bs.modal', function(event) {
        $(this).data('bs.modal', null);
        $('#lead_reminder_modal').html('');
        // clear the hash
        if (!$('.lead-modal').is(':visible')) {
            history.pushState("", document.title, window.location.pathname + window.location.search);
        }
    });

    $('body').on('hidden.bs.modal', '#convert_lead_to_client_modal', function(event) {
        $(this).data('bs.modal', null);
    });

    // Set hash on modal tab change
    $('body').on('click', '.lead-modal a[data-toggle="tab"]', function() {
        window.location.hash = this.hash;
    });

    // Submit notes on lead modal do ajax not the regular request
    $('body').on('submit', '.lead-modal #lead-notes', function() {
        var form = $(this);
        var data = $(form).serialize();
        $.post(form.attr('action'), data).done(function(lead_id) {
            init_lead_modal_data(lead_id);
        });
        return false;
    });

    // Add additional server params $_POST
    var LeadsServerParams = {
            "custom_view": "[name='custom_view']",
            "assigned": "[name='view_assigned']",
            "status": "[name='view_status']",
            "source": "[name='view_source']",
        }
        // Init the table
    var headers_leads = $('.table-leads').find('th');
    var not_sortable_leads = (headers_leads.length - 1);
    initDataTable('.table-leads', admin_url + 'leads?table_leads=true', [not_sortable_leads, 0], [not_sortable_leads, 0], LeadsServerParams, [10, 'DESC']);
    $.each(LeadsServerParams, function(i, obj) {
        $('select' + obj).on('change', function() {
            $('.table-leads').DataTable().ajax.reload();
        });
    });

    // When adding if lead is contacted today
    $('body').on('change', 'input[name="contacted_today"]', function() {
        var checked = $(this).prop('checked');
        if (checked == false) {
            $('.lead-select-date-contacted').removeClass('hide');
        } else {
            $('.lead-select-date-contacted').addClass('hide');
        }
    });

    $('body').on('change', 'input[name="contacted_indicator"]', function() {
        var val = $(this).val();
        if (val == 'yes') {
            $('.lead-select-date-contacted').removeClass('hide');
        } else {
            $('.lead-select-date-contacted').addClass('hide');
        }
    });

    // Show message for VIEW when checking unchecking permissions
    $('[data-can-create],[data-can-edit],[data-can-delete]').on('change', function() {
        if ($(this).prop('checked') == true && $(this).data('shortname') != 'tasks' && $(this).data('shortname') != 'projects') {
            var view_parent = $(this).parents('tr').find('td input').eq(0);
            if (view_parent.prop('checked') == false) {
                view_parent.prop('checked', true);
                alert_float('warning', view_permission_auto_checked);
            }
        }
    });

    // Fix for checkboxes ID duplicate when table goes responsive
    $('body').on('click', 'table.dataTable tbody td:first-child', function() {
        var tr = $(this).parents('tr');
        var row = $(this).parents('table').DataTable().row(tr);
        if (row.child.isShown()) {
            var switchBox = $(tr).next().find('input.onoffswitch-checkbox');
            if (switchBox.length > 0) {
                var switchBoxId = Math.random().toString(16).slice(2);
                switchBox.attr('id', switchBoxId);
                switchBox.next().attr('for', switchBoxId);
            }
        }
    });

    // Show please wait text on button where data-loading-text is added
    $('body').on('click', '[data-loading-text]', function() {
        var form = $(this).data('form');
        if (form != null) {
            if ($(form).valid()) {
                $(this).button('loading');
            }
        } else {
            $(this).button('loading');
        }
    });

    // Custom close function for reminder modals in case is modal in modal
    $('body').on('click', '.close-reminder-modal', function() {
        $(".reminder-modal-" + $(this).data('rel-type') + '-' + $(this).data('rel-id')).modal('hide');
    });
    // Recalculate responsive for hidden tables
    $('body').on('shown.bs.tab', 'a[data-toggle="tab"]', function(e) {
        $($.fn.dataTable.tables(true)).DataTable().responsive.recalc();
    });

    // Init are you sure on forms
    $('form').not('#single-ticket-form,#calendar-event-form,#proposal-form').areYouSure();

    // Check for active class in sidebar links
    $.each(side_bar.find('li > a'), function(i, data) {
        var href = $(data).attr('href');
        // Check if the url matches so we can add the active class
        if (location == href) {
            menu_href_selector = 'a[href="' + href + '"]';
            // Do not add on the top quick links
            side_bar.find(menu_href_selector).parents('li').not('.quick-links').addClass('active');
            // Set aria expanded to true
            side_bar.find(menu_href_selector).prop('aria-expanded', true);
            side_bar.find(menu_href_selector).parents('ul.nav-second-level').prop('aria-expanded', true);
            side_bar.find(menu_href_selector).parents('li').find('a:first-child').prop('aria-expanded', true);
        }
    });

    // For inline tinymce editors when content is blank a message is shown, on click this message should be hidden.
    $('body').on('click', '.editor-add-content-notice', function() {
        $(this).remove();
        tinymce.triggerSave();
    });

    // Check for customizer active class
    if (setup_menu.hasClass('display-block')) {
        $.each(setup_menu.find('li > a'), function(i, data) {
            var href = $(data).attr('href');
            if (location == href) {
                menu_href_selector = 'a[href="' + href + '"]';
                setup_menu.find(menu_href_selector).parents('li').addClass('active');
                setup_menu.find(menu_href_selector).prev('active');
                setup_menu.find(menu_href_selector).parents('ul.nav-second-level').prop('aria-expanded', true);
                setup_menu.find(menu_href_selector).parents('li').find('a:first-child').prop('aria-expanded', true);
            }
        });
    }
    // Init now metisMenu for the main admin sidebar
    side_bar.metisMenu();
    // Init setup menu
    setup_menu.metisMenu();
    // Handle minimalize sidebar menu
    $('.hide-menu').click(function(event) {
        event.preventDefault();
        if ($(window).width() < 769) {
            $("body").toggleClass("show-sidebar");
        } else {
            $("body").toggleClass("hide-sidebar");
        }
    });
    // Check if is mobile to clone the searchbar to the body so can be visible on mobile
    if (is_mobile()) {
        $('#wrapper').on('click', function() {
            if ($('body').hasClass('show-sidebar')) {
                $('body').removeClass('show-sidebar');
            }
            if (setup_menu.hasClass('display-block')) {
                $('.close-customizer').click();
            }
        });
    }
    // Top search input fetch results
    $('#search_input').on('keyup paste', function() {
        var q = $(this).val().trim();
        var wrapper = $('#wrapper');
        var search_results = $('#search_results');
        var top_search_button = $('#top_search_button button');
        if (q == '') {
            wrapper.unhighlight();
            search_results.html('');
            original_top_search_val = '';
            top_search_button.html('<i class="fa fa-search"></i>');
            top_search_button.removeClass('search_remove');
            return;
        }
        top_search_button.html('<i class="fa fa-remove"></i>');
        top_search_button.addClass('search_remove');
        delay(function() {
            if (q == original_top_search_val) {
                return;
            }
            $.post(admin_url + 'misc/search', {
                q: q
            }).done(function(results) {
                wrapper.unhighlight();
                search_results.html(results);
                wrapper.highlight(q);
                original_top_search_val = q;
            });
        }, 700);
    });
    // Global on change for mass delete to hide all other elements for bulk actions
    $('.bulk_actions').on('change', 'input[name="mass_delete"]', function() {
        if ($(this).prop('checked') == true) {
            $('#bulk_change').find('select').selectpicker('val', '');
        }
        $('#bulk_change').toggleClass('hide');
        $('.mass_delete_separator').toggleClass('hide');
    });
    // Clear todo modal values when modal is hidden
    $('body').on('hidden.bs.modal', '#__todo', function() {
        $('#__todo').find('input[name="todoid"]').val('');
        $('#__todo').find('textarea[name="description"]').val('');
        $('#__todo .add-title').addClass('hide');
        $('#__todo .edit-title').addClass('hide');
    });

    // Focus staff todo description
    $('body').on('shown.bs.modal', '#__todo', function() {
        $('#__todo').find('textarea[name="description"]').focus();
        if ($('#__todo').find('input[name="todoid"]').val() != '') {
            $('#__todo .add-title').addClass('hide');
            $('#__todo .edit-title').removeClass('hide');
        } else {
            $('#__todo .add-title').removeClass('hide');
            $('#__todo .edit-title').addClass('hide');
        }
    });

    // Focus search input on click
    $('#top_search_button button').on('click', function() {
        $('#search_input').focus();
        if ($(this).hasClass('search_remove')) {
            $(this).html('<i class="fa fa-search"></i>');
            $(this).removeClass('search_remove');
            original_top_search_val = '';
            $('#search_results').html('');
        }
    });

    // Fix for dropdown search to close if user click anyhere on html except on dropdown
    $("body").click(function(e) {
        if (!$(e.target).parents('#top_search_dropdown').hasClass('search-results')) {
            $('#top_search_dropdown').remove();
            $('#search_input').val('');
        }
    });

    // Init tooltips
    $('body').tooltip({
        selector: '[data-toggle="tooltip"]'
    });

    // Init popovers
    $('body').popover({
        selector: '[data-toggle="popover"]',
    });

    // Close all popovers if user click on body and the click is not inside the popover content area
    $('body').on('click', function(e) {
        $('[data-toggle="popover"],.manual-popover').each(function() {
            //the 'is' for buttons that trigger popups
            //the 'has' for icons within a button that triggers a popup
            if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                $(this).popover('hide');
            }
        });
    });

    // Do not close the dropdownmenu for filter when filtering
    $('body').on('click', '._filter_data ul.dropdown-menu li a', function(e) {
        e.stopPropagation();
        e.preventDefault();
    });

    // Remove tooltip fix on body click (in case user clicked link and tooltip stays open)
    $('body').on('click', function() {
        $('.tooltip').remove();
    });


    // Add are you sure on all delete links (onclick is not included here)
    $('body').on('click', '._delete', function(e) {
        var r = confirm(confirm_action_prompt);
        if (r == true) {
            return true;
        } else {
            return false;
        }
    });
    // Fix for all modals scroll..
    $('body').on('shown.bs.modal', '.modal', function() {
        $('body').addClass('modal-open');
    });

    $('body').on('hidden.bs.modal', '.modal', function(event) {
        $('.modal:visible').length && $(document.body).addClass('modal-open');
        $(this).data('bs.modal', null);
    });

    // Activity log tables filter by date / Currently used for system activity log and ticket pipe log
    if (activity_log_table.length > 0) {
        $('.datepicker.activity-log-date').on('change', function() {
            activity_log_table.DataTable().column($(this).attr('data-column')).search($(this).val()).draw();
        });
    }
    // For expenses and recurring tasks
    $('body').on('change', '[name="repeat_every"]', function() {
        var val = $(this).val();
        if (val == 'custom') {
            $('.recurring_custom').removeClass('hide');
        } else {
            $('.recurring_custom').addClass('hide');
        }
        if (val != '') {
            $('body').find('#recurring_ends_on').removeClass('hide');
        } else {
            $('body').find('#recurring_ends_on').addClass('hide');
            $('body').find('#recurring_ends_on input').val('');
        }
    });

    // On mass_select all select all the availble rows in the tables.
    $('body').on('change', '#mass_select_all', function() {
        var to, rows, checked;
        to = $(this).data('to-table');

        rows = $('.table-' + to).find('tbody tr');
        checked = $(this).prop('checked');
        $.each(rows, function() {
            var checkbox = $($(this).find('td').eq(0)).find('input').prop('checked', checked);
        });
    });
    // Init the editor for email templates where changing data is allowed
    $('body').on('show.bs.modal', '.modal.email-template', function() {
        init_editor($(this).data('editor-id'));
    });
    // Remove the editor inited for the email sending templates where changing the email template data is allowed
    $('body').on('hidden.bs.modal', '.modal.email-template', function() {
        tinymce.remove($(this).data('editor-id'));
    });

    // Customizer close and remove open from session
    $('.close-customizer').on('click', function(e) {
        e.preventDefault();

        setup_menu.addClass(isRTL == 'true' ? "fadeOutRight" : "fadeOutLeft");
        // Clear the session for setup menu so in reload wont be closed
        $.get(admin_url + 'misc/set_setup_menu_closed');
    });

    // Open customizer and add that is open to session
    $('.open-customizer').on('click', function(e) {
        e.preventDefault();

        if (setup_menu.hasClass(isRTL == 'true' ? "fadeOutRight" : "fadeOutLeft")) {
            setup_menu.removeClass(isRTL == 'true' ? "fadeOutRight" : "fadeOutLeft");
        }
        setup_menu.addClass(isRTL == 'true' ? "fadeInRight" : "fadeInLeft");
        setup_menu.addClass('display-block');
        // Set session that the setup menu is open in case of reload
        $.get(admin_url + 'misc/set_setup_menu_open');
    });
    // Change live the colors for colorpicker in kanban/pipeline
    $('body').on('click', '.cpicker', function() {
        var color = $(this).data('color');
        $(this).parents('.cpicker-wrapper').find('.cpicker-big').removeClass('cpicker-big').addClass('cpicker-small');
        $(this).removeClass('cpicker-small', 'fast').addClass('cpicker-big', 'fast');
        if ($(this).hasClass('kanban-cpicker')) {
            $(this).parents('.panel-heading-bg').css('background', color);
            $(this).parents('.panel-heading-bg').css('border', '1px solid ' + color);
        } else if ($(this).hasClass('calendar-cpicker')) {
            $('body').find('._event input[name="color"]').val(color);
        }
    });

    // Notification profile link click
    $('body').on('click', '.notification_link', function() {
        var link = $(this).data('link');
        var not_href;
        not_href = link.split('#');
        if (!not_href[1]) {
            window.location.href = link;
        }
    });

    /* Check if postid in notification url to open the newsfeed */
    $('body').on('click', '.notifications a,.notification_link', function(e) {
        var not_href, not_href_id;
        if ($(this).hasClass('notification_link')) {
            not_href = $(this).data('link');
        } else {
            not_href = e.currentTarget.href;
        }
        not_href = not_href.split('#');
        if (not_href[1] && not_href[1].indexOf('=') > -1) {
            e.preventDefault();
            var not_href_id = not_href[1].split('=')[1];
            if (not_href[1].indexOf('postid') > -1) {
                postid = not_href_id;
                $('.open_newsfeed').click();
            } else if (not_href[1].indexOf('taskid') > -1) {
                init_task_modal(not_href_id);
            } else if (not_href[1].indexOf('leadid') > -1) {
                init_lead(not_href_id);
            }
        }
    });

    // Set notifications to read when notifictions dropdown is opened
    $('.notifications-icon').on('click', function() {
        clearInterval(autocheck_notifications_timer_id);
        $.post(admin_url + 'misc/set_notifications_read').done(function(response) {
            response = JSON.parse(response);
            if (response.success == true) {
                $(".icon-notifications").addClass('hide');
                setTimeout(function() {
                    $('.notification-box.unread').removeClass('unread');
                }, 1000);
            }
        })
    });

    // Auto check for new notifications
    if (auto_check_for_new_notifications != 0) {
        var notifications_wrapper = $('#header li.notifications-wrapper');
        autocheck_notifications_timer_id = setInterval(function() {
            $.get(admin_url + 'misc/notifications_check', function(response) {
                notifications_wrapper.html(response);
            });
        }, auto_check_for_new_notifications * 1000); //time in milliseconds
    }

    // Tables

    init_table_tickets();
    init_table_announcements();
    init_table_staff_projects();

    // Ticket pipe log and system activity log
    initDataTable('.table-activity-log', window.location.href, 'undefined', 'undefined', 'undefined', [1, 'DESC']);
    // Invoices additional server params
    var Invoices_Estimates_ServerParams = {};
    $.each($('._hidden_inputs._filters input'), function() {
        Invoices_Estimates_ServerParams[$(this).attr('name')] = '[name="' + $(this).attr('name') + '"]';
    });

    // Invoices tables
    _table_api = initDataTable('.table-invoices', admin_url + 'invoices/list_invoices', 'undefined', 'undefined', Invoices_Estimates_ServerParams, [
        [3, 'DESC'],
        [0, 'DESC']
    ]);

    // Set year hidden for invoices
    if (_table_api) {
        _table_api.column(3).visible(false, false).columns.adjust();
    }

    var TasksServerParams = {};

    $.each($('._hidden_inputs._filters._tasks_filters input'), function() {
        TasksServerParams[$(this).attr('name')] = '[name="' + $(this).attr('name') + '"]';
    });

    _tns = [($('.table-tasks').find('th').length - 1)];
    var tasks_sort = 2;
    var _tasks_table_url = admin_url + 'tasks';
    if ($('body').hasClass('tasks_page')) {
        _tns.push(0);
        tasks_sort = 3;
        _tasks_table_url += '?bulk_actions=true';
    }

    _table_api = initDataTable('.table-tasks', _tasks_table_url, _tns, _tns, TasksServerParams, [tasks_sort, 'ASC']);

    if (_table_api && $('body').hasClass('home')) {
        _table_api.column(3).visible(false, false).columns.adjust();
        _table_api.column(4).visible(false, false).columns.adjust();
        _table_api.column(_tns[0]).visible(false, false).columns.adjust();
    }

    // Estimates table
    _table_api = initDataTable('.table-estimates', admin_url + 'estimates/list_estimates', 'undefined', 'undefined', Invoices_Estimates_ServerParams, [
        [3, 'DESC'],
        [0, 'DESC']
    ]);
    // Set year hidden for estimates
    if (_table_api) {
        _table_api.column(3).visible(false, false).columns.adjust();
    }

    // Send file modal populate the hidden files when is shown
    $('#send_file').on('show.bs.modal', function(e) {
        $('#send_file').find('input[name="filetype"]').val($($(e.relatedTarget)).data('filetype'));
        $('#send_file').find('input[name="file_path"]').val($($(e.relatedTarget)).data('path'));
        $('#send_file').find('input[name="file_name"]').val($($(e.relatedTarget)).data('file-name'));
        if ($('input[name="email"]').length > 0) {
            $('#send_file').find('input[name="send_file_email"]').val($('input[name="email"]').val());
        }
    });

    // Set password checkbox change
    $('body').on('change', 'input[name="send_set_password_email"]', function() {
        $('body').find('.client_password_set_wrapper').toggleClass('hide');
    });

    // Todo status change checkbox click
    $('body').on('change', '.todo input[type="checkbox"]', function() {
        var finished = $(this).prop('checked') === true ? 1 : 0;
        window.location.href = admin_url + 'todo/change_todo_status/' + $(this).val() + '/' + finished;
    });

    // Makes todos sortable
    var todos_sortable = $(".todos-sortable").sortable({
        connectWith: ".todo",
        items: "li",
        handle: '.dragger',
        appendTo: "body",
        update: function(event, ui) {
            if (this === ui.item.parent()[0]) {
                update_todo_items();
            }
        }
    });

    /* NEWSFEED JS */
    $('body').on('click', '.open_newsfeed,.close_newsfeed', function(e) {
        e.preventDefault();
        if (typeof($(this).data('close')) == 'undefined') {
            var url = admin_url + 'newsfeed/get_data';
            $.get(url, function(response) {
                $('#newsfeed').html(response);
                load_newsfeed(postid);
                init_newsfeed_form();
                init_selectpicker();
                if ($('#lightbox-css').length == 0 && $('#lightbox-js').length == 0) {
                    $('head').append('<link id="lightbox-css" href="' + site_url + 'assets/plugins/lightbox/css/lightbox.min.css" rel="stylesheet" />');
                    $('head').append('<script id="lightbox-js" src="' + site_url + 'assets/plugins/lightbox/js/lightbox.min.js"></script>');
                }
                init_lightbox();
            });
        } else if ($(this).data('close') === true) {
            newsFeedDropzone.destroy();
            $('#newsfeed').html('');
            total_new_post_files = 0;
            newsfeed_posts_page = 0;
            track_load_post_likes = 0;
            track_load_comment_likes = 0;
            postid = undefined;
        }
        $('#newsfeed').toggleClass('hide');
        $('body').toggleClass('noscroll');
    });


    if ($('[data-newsfeed-auto]').length > 0) {
        $('.open_newsfeed').click();
    }

    // When adding comment if user press enter to submit comment too
    $("body").on('keyup', '.comment-input input', function(event) {
        if (event.keyCode == 13) {
            add_comment(this);
        }
    });

    // Showing post likes modal
    $('#modal_post_likes').on('show.bs.modal', function(e) {
        track_load_post_likes = 0;
        $('#modal_post_likes_wrapper').empty();
        $('.likes_modal .modal-footer').removeClass('hide');
        var invoker = $(e.relatedTarget);
        var postid = $(invoker).data('postid')
        post_likes_total_pages = $(invoker).data('total-pages');
        $(".load_more_post_likes").attr('data-postid', postid);
        load_post_likes(postid);
    });

    // Showing comment likes modal
    $('#modal_post_comment_likes').on('show.bs.modal', function(e) {
        $('#modal_comment_likes_wrapper').empty();
        track_load_comment_likes = 0;
        $('.likes_modal .modal-footer').removeClass('hide');
        var invoker = $(e.relatedTarget);
        var commentid = $(invoker).data('commentid');
        comment_likes_total_pages = $(invoker).data('total-pages');
        $(".load_more_post_comment_likes").attr('data-commentid', commentid);
        load_comment_likes(commentid);
    });

    // Load more post likes from modal
    $('.load_more_post_likes').on('click', function(e) {
        e.preventDefault();
        load_post_likes($(this).data('postid'));
    });

    // Load more comment likes from modal
    $('.load_more_post_comment_likes').on('click', function(e) {
        e.preventDefault();
        load_comment_likes($(this).data('commentid'));
    });

    // Add post attachment used for dropzone
    $('.add-attachments').on('click', function(e) {
        e.preventDefault();
        $('#post-attachments').toggleClass('hide');
    });

    // Set post visibility on change select by department
    $('body').on('change', '#post-visibility', function() {
        var value = $(this).val();
        if (value != null) {
            if (value.indexOf('all') > -1) {
                if (value.length > 1) {
                    value.splice(0, 1);
                    $(this).selectpicker('val', value);
                }
            }
        }
    });

});

// Lightbox plugins for images
function init_lightbox() {
    if (typeof(lightbox) != 'undefined') {
        lightbox.option({
            'showImageNumberLabel': false,
            resizeDuration: 200,
        });
    }
}
// Progress bar animation load
function init_progress_bars() {
    $('.progress .progress-bar').each(function() {
        var bar = $(this);
        var perc = bar.attr("data-percent");
        bar.css('width', (perc) + '%');
        if (!bar.hasClass('no-percent-text')) {
            bar.text((perc) + '%');
        }
    });
}
// Get url params like $_GET
function get_url_param(param) {
    var vars = {};
    window.location.href.replace(location.hash, '').replace(
        /[?&]+([^=&]+)=?([^&]*)?/gi, // regexp
        function(m, key, value) { // callback
            vars[key] = value !== undefined ? value : '';
        }
    );

    if (param) {
        return vars[param] ? vars[param] : null;
    }
    return vars;
}
// Fix for height on the wrapper
function mainWrapperHeightFix() {
    // Get and set current height
    var headerH = 56;
    var navigationH = side_bar.height();
    var contentH = $(".content").height();
    var h = $(document).outerHeight(true) - headerH + 'px';
    setup_menu.css('min-height', h);
    $('#wrapper').css('min-height', $(document).outerHeight(true) - headerH + 'px');
    // Set new height when contnet height is less then navigation
    if (contentH < navigationH) {
        $("#wrapper").css("min-height", navigationH + 'px');
    }
    // Set new height when contnet height is less then navigation and navigation is less then window
    if (contentH < navigationH && navigationH < $(window).height()) {
        $("#wrapper").css("min-height", $(window).height() - headerH + 'px');
    }
    // Set new height when contnet is higher then navigation but less then window
    if (contentH > navigationH && contentH < $(window).height()) {
        $("#wrapper").css("min-height", $(window).height() - headerH + 'px');
    }
}

function setBodySmall() {
    if ($(this).width() < 769) {
        $('body').addClass('page-small');
    } else {
        $('body').removeClass('page-small');
        $('body').removeClass('show-sidebar');
    }
}
// Generate random password
function generatePassword(field) {
    var length = 12,
        charset = "abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        retVal = "";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    $(field).parents().find('input.password').val(retVal)
}
// Switch field make request
function switch_field(field) {
    var status, url, id;
    status = 0;
    if ($(field).prop('checked') == true) {
        status = 1;
    }
    url = $(field).data('switch-url');
    id = $(field).data('id');
    $.get(site_url + url + '/' + id + '/' + status);
}
// General validate form function
function _validate_form(form, form_rules, submithandler) {
    $.validator.setDefaults({
        highlight: function(element) {
            $(element).closest('.form-group').addClass('has-error');
        },
        unhighlight: function(element) {
            $(element).closest('.form-group').removeClass('has-error');
        },
        errorElement: 'p',
        errorClass: 'text-danger',
        errorPlacement: function(error, element) {
            if (element.parent('.input-group').length || element.parents('.chk').length) {
                if (!element.parents('.chk').length) {
                    error.insertAfter(element.parent());
                } else {
                    error.insertAfter(element.parents('.chk'));
                }
            } else {
                error.insertAfter(element);
            }
        },
    });

    var f = $(form).validate({
        rules: form_rules,
        messages: {
            email: {
                remote: email_exists,
            },
        },
        ignore: [],
        submitHandler: function(form) {
            if (typeof(submithandler) !== 'undefined') {
                submithandler(form);
            } else {
                return true;
            }
        }
    });

    var custom_required_fields = $(form).find('[data-custom-field-required]');
    if (custom_required_fields.length > 0) {
        $.each(custom_required_fields, function() {
            $(this).rules("add", {
                required: true
            });
            var name = $(this).attr('name');
            var label = $(this).parents('.form-group').find('[for="' + name + '"]');
            if (label.length > 0) {
                if (label.find('.req').length == 0) {
                    label.prepend(' <small class="req text-danger">* </small>');
                }
            }
        });
    }

    $.each(form_rules, function(name, rule) {
        if ((rule == 'required' && !jQuery.isPlainObject(rule)) || (jQuery.isPlainObject(rule) && rule.hasOwnProperty('required'))) {
            var label = $(form).find('[for="' + name + '"]');
            if (label.length > 0) {
                if (label.find('.req').length == 0) {
                    label.prepend(' <small class="req text-danger">* </small>');
                }
            }
        }
    });

    return false;
}
// Delete option from database AJAX
function delete_option(child, id) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'settings/delete_option/' + id, function(response) {
            if (response.success == true) {
                $(child).parents('.option').remove();
            }
        }, 'json');
    }
}
// Slide toggle any selector passed
function slideToggle(selector, callback) {
    if ($(selector).hasClass('hide')) {
        $(selector).removeClass('hide', 'slow');
    }
    $(selector).slideToggle();
    // Set all progress bar to 0 percent
    var progress_bars = $('.progress-bar').not('.not-dynamic');
    if (progress_bars.length > 0) {
        $('.progress .progress-bar').each(function() {
            $(this).css('width', 0 + '%');
            $(this).text(0 + '%');
        });
        // Init the progress bars again
        init_progress_bars();
    }
    // Possible callback after slide toggle
    if (typeof(callback) == 'function') {
        callback();
    }
}
// Generate float alert
function alert_float(type, message) {

    var aId, el;
    aId = $('body').find('float-alert').length;
    aId++;
    aId = 'alert_float_' + aId;
    el = $('<div id="' + aId + '" class="float-alert animated fadeInRight col-xs-11 col-sm-4 alert alert-' + type + '"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><span>' + message + '</span></div>');
    $('body').append(el);

    setTimeout(function() {
        $('#' + aId).remove();
    }, 3000);
}

function init_rel_tasks_table(rel_id, rel_type, selector) {
    if (typeof(selector) == 'undefined') {
        selector = '.table-rel-tasks';
    }
    var TasksServerParams = {};
    $.each($('._hidden_inputs._filters._tasks_filters input'), function() {
        TasksServerParams[$(this).attr('name')] = '[name="' + $(this).attr('name') + '"]';
    });
    var not_sortable_tasks = ($('body').find(selector).find('th').length - 1);
    initDataTable(selector, admin_url + 'tasks/init_relation_tasks/' + rel_id + '/' + rel_type, [not_sortable_tasks], [not_sortable_tasks], TasksServerParams, [2, 'ASC']);
}

function get_dt_export_buttons(table) {
    return [{
        extend: 'collection',
        text: dt_button_export,
        className: 'btn btn-default-dt-options',
        buttons: [{
            extend: 'excelHtml5',
            text: dt_button_excel,
            footer: true,
            exportOptions: {
                columns: [':visible'],
            }

        }, {
            extend: 'csvHtml5',
            text: dt_button_csv,
            footer: true,
            exportOptions: {
                columns: [':visible']
            }

        }, {
            extend: 'pdfHtml5',
            text: dt_button_pdf,
            footer: true,
            orientation: 'landscape',
            customize: function(doc) {
                // Fix for column widths
                var table_api = $(table).DataTable();
                var columns = table_api.columns().visible();
                var columns_total = columns.length;
                var pdf_widths = [];
                for (i = 0; i < columns_total; i++) {
                    // Is only visible column
                    if (columns[i] == true) {
                        pdf_widths.push('*');
                    }
                }
                doc.styles.tableHeader.alignment = 'left'
                doc.styles.tableHeader.margin = [5, 5, 5, 5]
                doc.content[1].table.widths = pdf_widths;
                doc.pageMargins = [12, 12, 12, 12];

            },
            exportOptions: {
                columns: [':visible'],
            }
        }, {
            extend: 'print',
            text: dt_button_print,
            footer: true,
            exportOptions: {
                columns: [':visible'],
            }
        }],
    }, {
        extend: 'colvis',
        postfixButtons: ['colvisRestore'],
        className: 'btn btn-default-dt-options dt-column-visibility',
        text: dt_button_column_visibility
    }, {
        text: dt_button_reload,
        className: 'btn btn-default-dt-options',
        action: function(e, dt, node, config) {
            dt.ajax.reload();
        }
    }, ];
}

function initDataTableOffline(dt_table) {
    var selector = '.dt-table';

    if (typeof(dt_table) !== 'undefined') {
        selector = dt_table;
    }

    var order_col, order_type, options, _buttons;
    var _options = {
        "language": dt_lang,
        "processing": true,
        'paginate': true,
        "responsive": true,
        "autoWidth": false,
        "order": [0, 'DESC'],
        dom: "<'mbot25'B><'row'><'row'<'col-md-6'l><'col-md-6'f>r>t<'row'<'col-md-4'i>><'row'<'#colvis'>p>",
    }

    var order_col = $($(this)).data('order-col');
    var order_type = $($(this)).data('order-type');
    var tables = $(selector);
    $.each(tables, function() {
        options = _options;
        order_col = $(this).data('order-col');
        order_type = $(this).data('order-type');
        if (order_col && order_type) {
            options.order = [
                [order_col, order_type]
            ]
        }
        _buttons = get_dt_export_buttons(this);
        // Remove the reload button here because its not ajax request
        delete _buttons[2];
        options.buttons = _buttons;
        $(this).dataTable(options);
    });
}
// General function for all datatables serverside
function initDataTable(table, url, notsearchable, notsortable, fnserverparams, defaultorder) {

    var _table_name = table;
    if ($(table).length == 0) {
        return;
    }
    if (fnserverparams == 'undefined' || typeof(fnserverparams) == 'undefined') {
        fnserverparams = []
    }

    // If not order is passed order by the first column
    if (typeof(defaultorder) == 'undefined') {
        defaultorder = [
            [0, 'ASC']
        ];
    } else {
        if (defaultorder.length == 1) {
            defaultorder = [defaultorder]
        }
    }

    var length_options = [10, 25, 50, 100];
    var length_options_names = [10, 25, 50, 100];

    tables_pagination_limit = parseFloat(tables_pagination_limit);

    if ($.inArray(tables_pagination_limit, length_options) == -1) {
        length_options.push(tables_pagination_limit)
        length_options_names.push(tables_pagination_limit)
    }

    length_options.sort(function(a, b) {
        return a - b;
    });
    length_options_names.sort(function(a, b) {
        return a - b;
    });

    length_options.push(-1);
    length_options_names.push(dt_length_menu_all);

    var table = $('body').find(table).dataTable({
        "language": dt_lang,
        "processing": true,
        "retrieve": true,
        "serverSide": true,
        'paginate': true,
        'searchDelay': 400,
        "bDeferRender": true,
        "responsive": true,
        "autoWidth": false,
        dom: "<'mbot25'B><'row'><'row'<'col-md-6'l><'col-md-6'f>r>t<'row'<'col-md-4'i>><'row'<'#colvis'>p>",
        "pageLength": tables_pagination_limit,
        "lengthMenu": [length_options, length_options_names],
        "columnDefs": [{
            "searchable": false,
            "targets": notsearchable,
        }, {
            "sortable": false,
            "targets": notsortable
        }],
        "fnCreatedRow": function(nRow, aData, iDataIndex) {
            // If tooltips found
            $(nRow).attr('data-title', aData.Data_Title)
            $(nRow).attr('data-toggle', aData.Data_Toggle)
        },
        "order": defaultorder,
        "ajax": {
            "url": url,
            "type": "POST",
            "data": function(d) {
                for (var key in fnserverparams) {
                    d[key] = $(fnserverparams[key]).val();
                }
            }
        },
        buttons: get_dt_export_buttons(table),
    });

    var tableApi = table.DataTable();

    // Fix for hidden tables colspan not correct if the table is empty
    if ($(_table_name).is(':hidden')) {
        $(_table_name).find('.dataTables_empty').attr('colspan', $(_table_name).find('thead th').length);
    }

    return tableApi;
}

// Update todo items when drop happen
function update_todo_items() {
    var unfinished_items = $('.unfinished-todos li:not(.no-todos)');
    var finished = $('.finished-todos li:not(.no-todos)');
    var i = 1;
    // Refresh orders
    $.each(unfinished_items, function() {
        $(this).find('input[name="todo_order"]').val(i);
        $(this).find('input[name="finished"]').val(0);
        i++;
    });
    if (unfinished_items.length == 0) {
        $('.nav-total-todos').addClass('hide');
        $('.unfinished-todos li.no-todos').removeClass('hide');
    } else if (unfinished_items.length > 0) {
        if (!$('.unfinished-todos li.no-todos').hasClass('hide')) {
            $('.unfinished-todos li.no-todos').addClass('hide');
        }
        $('.nav-total-todos').removeClass('hide');
        $('.nav-total-todos').html(unfinished_items.length);
    }
    x = 1;
    $.each(finished, function() {
        $(this).find('input[name="todo_order"]').val(x);
        $(this).find('input[name="finished"]').val(1);
        $(this).find('input[type="checkbox"]').prop('checked', true);
        i++;
        x++;
    });
    if (finished.length == 0) {
        $('.finished-todos li.no-todos').removeClass('hide');
    } else if (finished.length > 0) {
        if (!$('.finished-todos li.no-todos').hasClass('hide')) {
            $('.finished-todos li.no-todos').addClass('hide');
        }
    }
    var update = [];
    $.each(unfinished_items, function() {
        var todo_id = $(this).find('input[name="todo_id"]').val();
        var order = $(this).find('input[name="todo_order"]').val();
        var finished = $(this).find('input[name="finished"]').val();
        var description = $(this).find('.todo-description');
        if (description.hasClass('line-throught')) {
            description.removeClass('line-throught')
        }
        $(this).find('input[type="checkbox"]').prop('checked', false);
        update.push([todo_id, order, finished])
    });
    $.each(finished, function() {
        var todo_id = $(this).find('input[name="todo_id"]').val();
        var order = $(this).find('input[name="todo_order"]').val();
        var finished = $(this).find('input[name="finished"]').val();
        var description = $(this).find('.todo-description');
        if (!description.hasClass('line-throught')) {
            description.addClass('line-throught')
        }
        update.push([todo_id, order, finished])
    });
    data = {};
    data.data = update;
    $.post(admin_url + 'todo/update_todo_items_order', data);
}
// Delete single todo item
function delete_todo_item(list, id) {
    $.get(admin_url + 'todo/delete_todo_item/' + id, function(response) {
        if (response.success == true) {
            $(list).parents('li').remove();
            update_todo_items();
        }
    }, 'json');
}
// Edit todo item
function edit_todo_item(id) {
    $.get(admin_url + 'todo/get_by_id/' + id, function(response) {
        $('#__todo').find('input[name="todoid"]').val(response.todoid);
        $('#__todo').find('textarea[name="description"]').val(response.description);
        $('#__todo').modal('show');
    }, 'json');
}
// Date picker init with selected timeformat from settings
function init_datepicker() {
    var datepickers = $('.datepicker');
    var datetimepickers = $('.datetimepicker');
    var opt;
    // Datepicker without time
    $.each(datepickers, function() {
        var opt = {
            format: date_format,
            timepicker: false,
            lazyInit: true,
            dayOfWeekStart: calendar_first_day,
        };
        // Check in case the input have date-end-date or date-min-date
        var max_date = $(this).data('date-end-date');
        var min_date = $(this).data('date-min-date');
        if (max_date) {
            opt.maxDate = max_date;
        }
        if (min_date) {
            opt.minDate = min_date;
        }
        // Init the picker
        $(this).datetimepicker(opt);
    });
    var opt_time;
    // Datepicker with time
    $.each(datetimepickers, function() {
        opt_time = {
            format: date_format + ' H:i',
            lazyInit: true,
            dayOfWeekStart: calendar_first_day,
        };
        // Check in case the input have date-end-date or date-min-date
        var max_date = $(this).data('date-end-date');
        var min_date = $(this).data('date-min-date');
        if (max_date) {
            opt_time.maxDate = max_date;
        }
        if (min_date) {
            opt_time.minDate = min_date;
        }
        // Init the picker
        $(this).datetimepicker(opt_time);
    });
    // Option of user click on the icon calendar the datepicker to be shown
    $('.calendar-icon').on('click', function() {
        $(this).parents('.date').find('.datepicker').datetimepicker('show');
        $(this).parents('.date').find('.datetimepicker').datetimepicker('show');
    });
}
// Init color pickers
function init_color_pickers() {
    $('body').find('.colorpicker-input').colorpicker({
        format: "hex"
    });
}
// Init bootstrap select picker
function init_selectpicker() {
    $('body').find('.selectpicker').selectpicker({
        showSubtext: true,
        noneResultsText: no_results_text_search_dropdown + ' {0}',
    });
    $('.selectpicker.auto-toggle').not('.toggled').selectpicker('toggle').addClass('toggled');
}
// Datatables custom view will fill input with the value
function dt_custom_view(value, table, custom_input_name, clear_other_filters) {
    var name;
    if (typeof(custom_input_name) == 'undefined') {
        name = 'custom_view';
    } else {
        name = custom_input_name;
    }
    if (typeof(clear_other_filters) != 'undefined') {
        $('._filters input').val('');
        $('._filter_data li.active').removeClass('active');
    }
    var _original_val = value;
    var _cinput = do_filter_active(name);
    if (_cinput != name) {
        value = "";
    }
    $('input[name="' + name + '"]').val(value);
    $(table).DataTable().ajax.reload();
}

function do_filter_active(value, parent_selector) {
    if (value != '' && typeof(value) != 'undefined') {
        $('[data-cview="all"]').parents('li').removeClass('active');
        var selector = $('[data-cview="' + value + '"]');
        if (typeof(parent_selector) != 'undefined') {
            selector = $(parent_selector + ' [data-cview="' + value + '"]');
        }
        if (!selector.parents('li').not('.dropdown-submenu').hasClass('active')) {
            selector.parents('li').addClass('active');
        } else {
            selector.parents('li').not('.dropdown-submenu').removeClass('active');
            // Remove active class from the parent dropdown if nothing selected in the child dropdown
            var parents_sub = selector.parents('li.dropdown-submenu');
            if (parents_sub.length > 0) {
                if (parents_sub.find('li.active').length == 0) {
                    parents_sub.removeClass('active');
                }
            }
            value = "";
        }
        return value;
    } else {
        $('._filters input').val('');
        $('._filter_data li.active').removeClass('active');
        $('[data-cview="all"]').parents('li').addClass('active');
        return "";
    }
}
// Called when editing member profile
function init_roles_permissions(roleid, user_changed) {
    if (typeof(roleid) == 'undefined') {
        roleid = $('select[name="role"]').val();
    }
    var isedit = $('.member > input[name="isedit"]');
    // Check if user is edit view and user has changed the dropdown permission if not only return
    if (isedit.length > 0 && typeof(roleid) !== 'undefined' && typeof(user_changed) == 'undefined') {
        return;
    }
    // Last if the roleid is blank return
    if (roleid == '') {
        return;
    }
    // Get all permissions
    var permissions = $('table.roles').find('tr');
    $.get(admin_url + 'misc/get_role_permissions_ajax/' + roleid).done(function(response) {
        response = JSON.parse(response);
        $.each(permissions, function() {
            var permissionid = $(this).data('id');
            var row = $(this);
            $.each(response, function(i, obj) {
                if (permissionid == obj.permissionid) {
                    if (obj.can_view == 1) {
                        row.find('[data-can-view]').prop('checked', true);
                    } else {
                        row.find('[data-can-view]').prop('checked', false);
                    }
                    if (obj.can_edit == 1) {
                        row.find('[data-can-edit]').prop('checked', true);
                    } else {
                        row.find('[data-can-edit]').prop('checked', false);
                    }
                    if (obj.can_create == 1) {
                        row.find('[data-can-create]').prop('checked', true);
                    } else {
                        row.find('[data-can-create]').prop('checked', false);
                    }
                    if (obj.can_delete == 1) {
                        row.find('[data-can-delete]').prop('checked', true);
                    } else {
                        row.find('[data-can-delete]').prop('checked', false);
                    }
                }
            });
        });
    });
}

// Generate hidden input field
function hidden_input(name, val) {
    return '<input type="hidden" name="' + name + '" value="' + val + '">';
}
// Show/hide full table
function toggle_small_view(table, main_data) {
    $('body').toggleClass('small-table');
    var tablewrap = $('#small-table');
    var _visible = false;
    if (tablewrap.hasClass('col-md-5')) {
        tablewrap.removeClass('col-md-5');
        tablewrap.addClass('col-md-12');
        _visible = true;
        $('.toggle-small-view').find('i').removeClass('fa fa-angle-double-right').addClass('fa fa-angle-double-left');
    } else {
        tablewrap.addClass('col-md-5');
        tablewrap.removeClass('col-md-12');
        $('.toggle-small-view').find('i').removeClass('fa fa-angle-double-left').addClass('fa fa-angle-double-right');
    }
    var _table = $(table).DataTable();
    // Show hide hidden columns
    _table.columns(hidden_columns).visible(_visible, false);
    _table.columns.adjust();
    $(main_data).toggleClass('hide')
}

function stripTags(html) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}
// Check if field is empty
function empty(data) {
    if (typeof(data) == 'number' || typeof(data) == 'boolean') {
        return false;
    }
    if (typeof(data) == 'undefined' || data === null) {
        return true;
    }
    if (typeof(data.length) != 'undefined') {
        return data.length == 0;
    }
    var count = 0;
    for (var i in data) {
        if (data.hasOwnProperty(i)) {
            count++;
        }
    }
    return count == 0;
}
// Is mobile checker javascript
function is_mobile() {
    return _is_mobile;
}
// Main logout function check if timers found to show the warning
function logout() {
    var started_timers = $('.started-timers-top').find('li.timer').length;
    if (started_timers > 0) {
        // Timers found return false and show the modal
        $('.timers-modal-logout').modal('show');
        return false;
    } else {
        // No timer logout free
        window.location.href = site_url + 'authentication/logout';
    }
}
// Generate color rgb
function color(r, g, b) {
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}
// Url builder function with parameteres
function buildUrl(url, parameters) {
    var qs = "";
    for (var key in parameters) {
        var value = parameters[key];
        qs += encodeURIComponent(key) + "=" + encodeURIComponent(value) + "&";
    }
    if (qs.length > 0) {
        qs = qs.substring(0, qs.length - 1); //chop off last "&"
        url = url + "?" + qs;
    }
    return url;
}
// Init the media elfinder for tinymce browser
function elFinderBrowser(field_name, url, type, win) {
    tinymce.activeEditor.windowManager.open({
        file: admin_url + 'misc/tinymce_file_browser', // use an absolute path!
        title: media_files,
        width: 900,
        height: 450,
        resizable: 'yes'
    }, {
        setUrl: function(url) {
            win.document.getElementById(field_name).value = url;
        }
    });
    return false;
}
// Function to init the tinymce editor
function init_editor(selector, settings) {
    if (typeof(selector) == 'undefined') {
        selector = '.tinymce';
    }
    // Original settings
    var _settings = {
        selector: selector,
        height: 400,
        theme: 'modern',
        skin: 'perfex',
        language: tinymce_lang,
        relative_urls: false,
        remove_script_host: false,
        removed_menuitems: 'newdocument',
        forced_root_block: false,
        fontsize_formats: '8pt 10pt 12pt 14pt 18pt 24pt 36pt',
        setup: function(ed) {
            // Default fontsize is 14
            ed.on('init', function() {
                this.getDoc().body.style.fontSize = '14px';
            });
        },
        table_default_styles: {
            // Default all tables width 100%
            width: '100%',
        },
        table_class_list: [{
            title: 'Table Bordered',
            value: 'table table-bordered'
        }, {
            title: 'Flat',
            value: 'table'
        }, ],
        plugins: [
            'advlist autoresize autolink lists link image charmap print preview hr anchor codesample',
            'searchreplace wordcount visualblocks visualchars code fullscreen',
            'media nonbreaking save table contextmenu directionality',
            'paste textcolor colorpicker textpattern imagetools'
        ],
        toolbar1: 'fontselect fontsizeselect  insertfile | bold italic | alignleft aligncenter alignright alignjustify | rtl media image | forecolor backcolor link outdent indent bullist numlist | codesample',
        file_browser_callback: elFinderBrowser,
    };
    // Add the rtl to the settings if is true
    isRTL == 'true' ? _settings.directionality = 'rtl' : ''

    // Possible settings passed to be overwrited or added
    if (typeof(settings) != 'undefined') {
        for (var key in settings) {
            _settings[key] = settings[key];
        }
    }
    // Init the editor
    var editor = tinymce.init(_settings);
    return editor;
}
// Function used to add custom bootstrap menu for setup and main menu and to add fa on front like fa fa-question
function _formatMenuIconInput(e) {
    if (typeof(e) == 'undefined') {
        return;
    }
    var _input = $(e.target);
    if (!_input.val().match(/^fa /)) {
        _input.val(
            'fa ' + _input.val()
        );
    }
}
jQuery.extend({
    highlight: function(node, re, nodeName, className) {
        if (node.nodeType === 3) {
            var match = node.data.match(re);
            if (match) {
                var highlight = document.createElement(nodeName || 'span');
                highlight.className = className || 'highlight';
                var wordNode = node.splitText(match.index);
                wordNode.splitText(match[0].length);
                var wordClone = wordNode.cloneNode(true);
                highlight.appendChild(wordClone);
                wordNode.parentNode.replaceChild(highlight, wordNode);
                return 1; //skip added node in parent
            }
        } else if ((node.nodeType === 1 && node.childNodes) && // only element nodes that have children
            !/(script|style)/i.test(node.tagName) && // ignore script and style nodes
            !(node.tagName === nodeName.toUpperCase() && node.className === className)) { // skip if already highlighted
            for (var i = 0; i < node.childNodes.length; i++) {
                i += jQuery.highlight(node.childNodes[i], re, nodeName, className);
            }
        }
        return 0;
    }
});

jQuery.fn.highlight = function(words, options) {
    var settings = {
        className: 'highlight animated flash',
        element: 'span',
        caseSensitive: false,
        wordsOnly: false
    };
    jQuery.extend(settings, options);

    if (words.constructor === String) {
        words = [words];
    }
    words = jQuery.grep(words, function(word, i) {
        return word != '';
    });
    words = jQuery.map(words, function(word, i) {
        return word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    });
    if (words.length == 0) {
        return this;
    };
    var flag = settings.caseSensitive ? "" : "i";
    var pattern = "(" + words.join("|") + ")";
    if (settings.wordsOnly) {
        pattern = "\\b" + pattern + "\\b";
    }
    var re = new RegExp(pattern, flag);

    return this.each(function() {
        jQuery.highlight(this, re, settings.element, settings.className);
    });
};

// Mass delete function for, parameter is table name like table-name the name only should be passed
function mass_delete(to) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        var ids = [];
        var rows = $('.table-' + to).find('tbody tr');
        $.each(rows, function() {
            var checkbox = $($(this).find('td').eq(0)).find('input');
            if (checkbox.prop('checked') == true) {
                ids.push(checkbox.val());
            }
        });
        var data = {};
        data.ids = ids;
        $.post(admin_url + to + '/mass_delete', data).done(function() {
            window.location.reload();
        });
    }
}
// Show password on hidden input field
function showPassword(name) {
    var target = $('input[name="' + name + '"]');
    if ($(target).attr('type') == 'password' && $(target).val() != '') {
        $(target)
            .queue(function() {
                $(target).attr('type', 'text').dequeue();
            });
    } else {
        $(target).queue(function() {
            $(target).attr('type', 'password').dequeue();
        });
    }
}
// This is used for mobile where tooltip on _buttons class wrapper is found
// Will show all buttons tooltips as regular button with text
function init_btn_with_tooltips() {
    if (is_mobile()) {
        var tooltips_href_btn = $('._buttons').find('.btn-with-tooltip');
        $.each(tooltips_href_btn, function() {
            var title = $(this).attr('title');
            if (typeof(title) == 'undefined') {
                title = $(this).attr('data-title');
            }
            if (typeof(title) != 'undefined') {
                $(this).append(' ' + title);
                $(this).removeClass('btn-with-tooltip');
            }
        });
        var tooltips_group = $('._buttons').find('.btn-with-tooltip-group');
        $.each(tooltips_group, function() {
            var title = $(this).attr('title');
            if (typeof(title) == 'undefined') {
                title = $(this).attr('data-title');
            }
            if (typeof(title) != 'undefined') {
                $(this).find('.btn').eq(0).append(' ' + title);
                $(this).removeClass('btn-with-tooltip-group');
            }
        });
    }
}
// Helper hash id for estimates,invoices,proposals,expenses
function do_hash_helper(hash) {
    if (typeof(history.pushState) != "undefined") {
        var url = window.location.href;
        var obj = {
            Url: url
        };
        history.pushState(obj, '', obj.Url);
        window.location.hash = hash;
    }
}
// Knowledge base groups
$(function() {
    // Validating the knowledge group form
    _validate_form($('#kb_group_form'), {
        name: 'required'
    }, manage_kb_groups);
    // On hidden modal reset the values
    $('#kb_group_modal').on('hidden.bs.modal', function(event) {
        $('#additional').html('');
        $('#kb_group_modal input').val('');
        $('.add-title').removeClass('hide');
        $('.edit-title').removeClass('hide');
        $('#kb_group_modal input[name="group_order"]').val($('table tbody tr').length + 1);
    });
});
// Form handler function for knowledgebase group
function manage_kb_groups(form) {
    var data = $(form).serialize();
    var url = form.action;
    $.post(url, data).done(function(response) {
        window.location.reload();
    });
    return false;
}
// New knowledgebase group, opens modal
function new_kb_group() {
    $('#kb_group_modal').modal('show');
    $('.edit-title').addClass('hide');
}
// Edit KB group, 2 places groups view or articles view directly click on kanban
function edit_kb_group(invoker, id) {
    $('#additional').append(hidden_input('id', id));
    $('#kb_group_modal input[name="name"]').val($(invoker).data('name'));
    $('#kb_group_modal textarea[name="description"]').val($(invoker).data('description'));
    $('#kb_group_modal .colorpicker-input').colorpicker('setValue', $(invoker).data('color'));
    $('#kb_group_modal input[name="group_order"]').val($(invoker).data('order'));
    var active = $(invoker).data('active');
    if (active == 0) {
        $('input[name="disabled"]').prop('checked', true);
    } else {
        $('input[name="disabled"]').prop('checked', false);
    }
    $('#kb_group_modal').modal('show');
    $('.add-title').addClass('hide');
}
// Validate the form reminder
function init_form_reminder() {
    _validate_form($('#form-reminder'), {
        date: 'required',
        staff: 'required'
    }, reminderFormHandler);
}
// Handles reminder modal form
function reminderFormHandler(form) {
    form = $(form);
    var data = form.serialize();
    var serializeArray = $(form).serializeArray();
    $.post(form.attr('action'), data).done(function(data) {
        data = JSON.parse(data);
        alert_float(data.alert_type, data.message);
        $.each(available_reminders_table, function(i, table) {
            if ($.fn.DataTable.isDataTable(table)) {
                $('body').find(table).DataTable().ajax.reload();
            }
        });
    });
    $('.reminder-modal-' + serializeArray[1]['value'] + '-' + serializeArray[0]['value']).modal('hide');
    return false;
}
// Function to close modal manualy... needed in some modals where the data is flexible.
function close_modal_manualy(modal) {
    if($(modal).length == 0){
        modal = $('body').find(modal);
    } else {
        modal = $(modal);
    }
    modal.fadeOut('fast', function() {
        modal.remove();
        if (!$('body').find('.modal').is(':visible')) {
            $('.modal-backdrop').remove();
            $('body').removeClass('modal-open');
        }
    });
}
/* Global function for editing notes */
function toggle_edit_note(id) {
    $('body').find('[data-note-edit-textarea="' + id + '"]').toggleClass('hide');
    $('body').find('[data-note-description="' + id + '"]').toggleClass('hide');
}

function edit_note(id) {
    var description = $('body').find('[data-note-edit-textarea="' + id + '"] textarea').val();
    if (description != '') {
        $.post(admin_url + 'misc/edit_note/' + id, {
            description: description
        }).done(function(response) {
            response = JSON.parse(response);
            if (response.success == true) {
                alert_float('success', response.message);
                $('body').find('[data-note-description="' + id + '"]').html(nl2br(description));
            }
        });
        toggle_edit_note(id);
    }

}

function toggle_file_visibility(attachment_id, rel_id, invoker) {
    $.get(admin_url + 'misc/toggle_file_visibility/' + attachment_id, function(response) {
        if (response == 1) {
            $(invoker).find('i').removeClass('fa fa-toggle-off').addClass('fa fa-toggle-on');
        } else {
            $(invoker).find('i').removeClass('fa fa-toggle-on').addClass('fa fa-toggle-off');
        }
    });
}

function nl2br(str, is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

jQuery.fn.unhighlight = function(options) {
    var settings = {
        className: 'highlight',
        element: 'span'
    };
    jQuery.extend(settings, options);
    return this.find(settings.element + "." + settings.className).each(function() {
        var parent = this.parentNode;
        parent.replaceChild(this.firstChild, this);
        parent.normalize();
    }).end();
};

function fix_kanban_height(col_px, container_px) {
    // Set the width of the kanban container
    $('body').find('div.dt-loader').remove();
    var kanbanCol = $('.kan-ban-content-wrapper');
    kanbanCol.css('max-height', (window.innerHeight - col_px) + 'px');
    $('.kan-ban-content').css('min-height', (window.innerHeight - col_px) + 'px');
    var kanbanColCount = parseInt(kanbanCol.length);
    $('.container-fluid').css('min-width', (kanbanColCount * container_px) + 'px');
}

function kanban_load_more(status_id, e, url, column_px, container_px) {
    var LoadMoreParameters = new Array();
    var search = $('input[name="search"]').val();
    var _kanban_param_val;
    var page = $(e).attr('data-page');
    var total_pages = $('[data-col-status-id="' + status_id + '"]').data('total-pages');
    if (page <= total_pages) {

        var sort_type = $('input[name="sort_type"]');
        var sort = $('input[name="sort"]').val();
        if (sort_type.length != 0 && sort_type.val() != '') {
            LoadMoreParameters['sort_by'] = sort_type.val();
            LoadMoreParameters['sort'] = sort;
        }

        if (search != '') {
            LoadMoreParameters['search'] = search;
        }

        $.each($('#kanban-params input'), function() {
            _kanban_param_val = $(this).val();
            if (_kanban_param_val != '') {
                LoadMoreParameters[$(this).attr('name')] = _kanban_param_val;
            }
        });

        LoadMoreParameters['status'] = status_id;
        LoadMoreParameters['page'] = page;
        LoadMoreParameters['page']++;

        $.get(buildUrl(admin_url + url, LoadMoreParameters), function(response) {
            page++;
            $('[data-load-status="' + status_id + '"]').before(response);
            $(e).attr('data-page', page);
            fix_kanban_height(column_px, container_px);
        });

        if (page >= total_pages - 1) {
            $(e).addClass("disabled");
        }
    }
}

function check_kanban_empty_col(selector) {
    var statuses = $('[data-col-status-id]');
    $.each(statuses, function(i, obj) {
        var total = $(obj).find(selector).length;
        if (total == 0) {
            $(obj).find('.kanban-empty').removeClass('hide');
            $(obj).find('.kanban-load-more').addClass('hide');
        } else {
            $(obj).find('.kanban-empty').addClass('hide');
        }
    });
}

function init_kanban(url, callbackUpdate, connect_with, column_px, container_px, callback_after_load) {

    if ($('#kan-ban').length == 0) {
        return;
    }

    var parameters = new Array();
    var _kanban_param_val;

    $.each($('#kanban-params input'), function() {
        _kanban_param_val = $(this).val();
        if (_kanban_param_val != '') {
            parameters[$(this).attr('name')] = _kanban_param_val;
        }
    });

    var search = $('input[name="search"]').val();
    if (search !== '') {
        parameters['search'] = search;
    }

    var sort_type = $('input[name="sort_type"]');
    var sort = $('input[name="sort"]').val();
    if (sort_type.length != 0 && sort_type.val() != '') {
        parameters['sort_by'] = sort_type.val();
        parameters['sort'] = sort;
    }

    parameters['kanban'] = true;
    var url = admin_url + url;
    url = buildUrl(url, parameters);
    delay(function() {
        $('body').append('<div class="dt-loader"></div>');
        $('#kan-ban').load(url, function() {
            fix_kanban_height(column_px, container_px);

            if (typeof(callback_after_load) != 'undefined') {
                callback_after_load();
            }

            $(".status").sortable({
                connectWith: connect_with,
                helper: 'clone',
                appendTo: '#kan-ban',
                placeholder: "ui-state-highlight-card",
                revert: 'invalid',
                scroll: true,
                scrollSensitivity: 50,
                scrollSpeed: 70,
                drag: function(event, ui) {
                    var st = parseInt($(this).data("startingScrollTop"));
                    ui.position.top -= $(this).parent().scrollTop() - st;
                },
                start: function(event, ui) {
                    $(ui.helper).addClass('tilt');
                    $(ui.helper).find('.panel-body').css('background', '#fbfbfb');
                    // Start monitoring tilt direction
                    tilt_direction($(ui.helper));
                },
                stop: function(event, ui) {
                    $(ui.helper).removeClass("tilt");
                    // Unbind temporary handlers and excess data
                    $("html").unbind('mousemove', $(ui.helper).data("move_handler"));
                    $(ui.helper).removeData("move_handler");
                },
                update: function(event, ui) {
                    callbackUpdate(ui, this);
                }
            });

            $('.status').sortable({
                cancel: '.not-sortable'
            });
        });

    }, 200);
}

function tilt_direction(item) {
    setTimeout(function() {
        var left_pos = item.position().left,
            move_handler = function(e) {
                if (e.pageX >= left_pos) {
                    item.addClass("right");
                    item.removeClass("left");
                } else {
                    item.addClass("left");
                    item.removeClass("right");
                }
                left_pos = e.pageX;
            };
        $("html").bind("mousemove", move_handler);
        item.data("move_handler", move_handler);
    }, 1000);
}
/* jQuery are you sure plugin fix for safari */

$(function() {

    if (!navigator.userAgent.toLowerCase().match(/iphone|ipad|ipod|opera/)) {
        return;
    }
    $('a').bind('click', function(evt) {
        var href = $(evt.target).closest('a').attr('href');
        if (href !== undefined && !(href.match(/^#/) || href.trim() == '')) {
            var response = $(window).triggerHandler('beforeunload', response);
            if (response && response != "") {
                var msg = response + "\n\n" +
                    "Press OK to leave this page or Cancel to stay.";
                if (!confirm(msg)) {
                    return false;
                }
            }
            window.location.href = href;
            return false;
        }
    });
});


/* NEWSFEED FUNCTIONS */

// When window scroll to down load more posts
$('#newsfeed').scroll(function(e) {
    var elem = $(e.currentTarget);
    if (elem[0].scrollHeight - elem.scrollTop() == elem.outerHeight()) {
        load_newsfeed();
    }
    $('#newsfeed .close_newsfeed').css('top', ($(this).scrollTop() + 20) + "px");
});

function init_newsfeed_form() {
    // Configure dropzone

    if (typeof(newsFeedDropzone) == 'undefined') {
        // Init new post form
        $('body').on('submit', '#new-post-form', function() {
            $.post(this.action, $(this).serialize()).done(function(response) {
                response = JSON.parse(response);
                if (response.postid) {
                    if (newsFeedDropzone.getQueuedFiles().length > 0) {
                        newsFeedDropzone.options.url = admin_url + 'newsfeed/add_post_attachments/' + response.postid;
                        newsFeedDropzone.processQueue();
                        return;
                    }
                    newsfeed_new_post(response.postid);
                    clear_newsfeed_post_area();
                }
            });
            return false;
        });
    }


    newsFeedDropzone = new Dropzone("#new-post-form", {
        clickable: '.add-post-attachments',
        autoProcessQueue: false,
        addRemoveLinks: true,
        parallelUploads: newsfeed_maximum_files_upload,
        maxFiles: newsfeed_maximum_files_upload,
        maxFilesize: newsfeed_maximum_file_size,
        acceptedFiles: allowed_files,
        dictDefaultMessage: drop_files_here_to_upload,
        dictFallbackMessage: browser_not_support_drag_and_drop,
        dictRemoveFile: remove_file,
        dictMaxFilesExceeded: you_can_not_upload_any_more_files,
    });


    // On post added success
    newsFeedDropzone.on('success', function(files, response) {
        total_new_post_files--;
        if (total_new_post_files == 0) {
            response = JSON.parse(response);
            newsfeed_new_post(response.postid);
            clear_newsfeed_post_area();
            newsFeedDropzone.removeAllFiles();
        }
    });
    // When drag finished
    newsFeedDropzone.on("dragover", function(file) {
        $('#new-post-form').addClass('dropzone-active')
    });

    newsFeedDropzone.on("drop", function(file) {
        $('#new-post-form').removeClass('dropzone-active')
    });
    // On error files decrement total files
    newsFeedDropzone.on("error", function(file, response) {
        total_new_post_files--;
        alert_float('danger', response);
    });
    // When user click on remove files decrement total files
    newsFeedDropzone.on('removedfile', function(file) {
        total_new_post_files--;
    });
    // On added new file increment total files variable
    newsFeedDropzone.on("addedfile", function(file) {
        // Refresh total files to zero if no files are found becuase removedFile goes to --;
        if (this.getQueuedFiles().length == 0) {
            total_new_post_files = 0;
        }
        total_new_post_files++;
    });

}
// Clear newsfeed new post area
function clear_newsfeed_post_area() {
    $('#new-post-form textarea').val('');
    $('#post-visibility').selectpicker('val', 'all');
}
// Load post likes modal
function load_post_likes(postid) {

    if (track_load_post_likes <= post_likes_total_pages) {
        $.post(admin_url + 'newsfeed/load_likes_modal', {
            page: track_load_post_likes,
            postid: postid
        }).done(function(response) {
            track_load_post_likes++
            $('#modal_post_likes_wrapper').append(response);
        });

        if (track_load_post_likes >= post_likes_total_pages - 1) {
            $('.likes_modal .modal-footer').addClass('hide');
        }
    }
}
// Load comment likes modal
function load_comment_likes(commentid) {

    if (track_load_comment_likes <= comment_likes_total_pages) {
        $.post(admin_url + 'newsfeed/load_comment_likes_model', {
            page: track_load_comment_likes,
            commentid: commentid
        }).done(function(response) {
            track_load_comment_likes++
            $('#modal_comment_likes_wrapper').append(response);
        });

        if (track_load_comment_likes >= comment_likes_total_pages - 1) {
            $('.likes_modal .modal-footer').addClass('hide');
        }
    }
}
// On click href load more comments from single post
function load_more_comments(link) {
    var postid = $(link).data('postid');
    var page = $(link).find('input[name="page"]').val();
    var total_pages = $(link).data('total-pages');

    if (page <= total_pages) {
        $.post(admin_url + 'newsfeed/init_post_comments/' + postid, {
            page: page
        }).done(function(response) {
            $(link).data('track-load-comments', page);
            $('[data-comments-postid="' + postid + '"] .load-more-comments').before(response);
        });
        page++;
        $(link).find('input[name="page"]').val(page);
        if (page >= total_pages - 1) {
            $(link).addClass('hide');
            $(link).removeClass('display-block');
        }
    }
}
// new post added append data
function newsfeed_new_post(postid) {
    var data = {};
    data.postid = postid;
    $.post(admin_url + 'newsfeed/load_newsfeed', data).done(function(response) {
        var pinned = $('#newsfeed_data').find('.pinned');
        var pinned_length = pinned.length
        if (pinned_length == 0) {
            $('#newsfeed_data').prepend(response);
        } else {
            var last_pinned = $('#newsfeed_data').find('.pinned').eq(pinned_length - 1);
            $(last_pinned).after(response);
        }
    });
}
// Init newsfeed data
function load_newsfeed(postid) {

    var data = {};
    data.page = newsfeed_posts_page;
    if (typeof(postid) != 'undefined' && postid != 0) {
        data.postid = postid;
    }
    var total_pages = $('input[name="total_pages_newsfeed"]').val();
    if (newsfeed_posts_page <= total_pages) {
        $.post(admin_url + 'newsfeed/load_newsfeed', data).done(function(response) {
            newsfeed_posts_page++
            $('#newsfeed_data').append(response);
        });
        if (newsfeed_posts_page >= total_pages - 1) {
            return;
        }
    }
}
// When user click heart button
function like_post(postid) {
    $.get(admin_url + 'newsfeed/like_post/' + postid, function(response) {
        if (response.success == true) {
            refresh_post_likes(postid);
        }
    }, 'json');
}
// Unlikes post
function unlike_post(postid) {
    $.get(admin_url + 'newsfeed/unlike_post/' + postid, function(response) {
        if (response.success == true) {
            refresh_post_likes(postid);
        }
    }, 'json');
}
// Like post comment
function like_comment(commentid, postid) {
    $.get(admin_url + 'newsfeed/like_comment/' + commentid + '/' + postid, function(response) {
        if (response.success == true) {
            $('[data-commentid="' + commentid + '"]').replaceWith(response.comment);
        }
    }, 'json');
}
// Unlike post comment
function unlike_comment(commentid, postid) {
    $.get(admin_url + 'newsfeed/unlike_comment/' + commentid + '/' + postid, function(response) {
        if (response.success == true) {
            $('[data-commentid="' + commentid + '"]').replaceWith(response.comment);
        }
    }, 'json');
}
// Add new comment to post
function add_comment(input) {
    var postid = $(input).data('postid');
    $.post(admin_url + 'newsfeed/add_comment', {
        content: $(input).val(),
        postid: postid
    }).done(function(response) {
        response = JSON.parse(response);
        if (response.success == true) {
            $(input).val('');
            if ($('body').find('[data-comments-postid="' + postid + '"] .post-comment').length > 0) {
                $('body').find('[data-comments-postid="' + postid + '"] .post-comment').prepend(response.comment);
            } else {
                refresh_post_comments(postid);
            }
        }
    });
}
// Removes post comment
function remove_post_comment(id, postid) {
    $.get(admin_url + 'newsfeed/remove_post_comment/' + id + '/' + postid, function(response) {
        if (response.success == true) {
            $('.comment[data-commentid="' + id + '"]').remove();
        }
    }, 'json');
}
// Refreshing only post likes
function refresh_post_likes(postid) {
    $.get(admin_url + 'newsfeed/init_post_likes/' + postid + '?refresh_post_likes=true', function(response) {
        $('[data-likes-postid="' + postid + '"]').html(response);
    });
}
// Refreshing only post comments
function refresh_post_comments(postid) {
    $.post(admin_url + 'newsfeed/init_post_comments/' + postid + '?refresh_post_comments=true').done(function(response) {
        $('[data-comments-postid="' + postid + '"]').html(response);
    });
}
// Delete post from database
function delete_post(postid) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.post(admin_url + 'newsfeed/delete_post/' + postid, function(response) {
            if (response.success == true) {
                $('[data-main-postid="' + postid + '"]').remove();
            }
        }, 'json');
    }
}
// Ping post to top
function pin_post(id) {
    $.get(admin_url + 'newsfeed/pin_newsfeed_post/' + id, function(response) {
        if (response.success == true) {
            window.location.reload();
        }
    }, 'json');
}
// Unpin post from top
function unpin_post(id) {
    $.get(admin_url + 'newsfeed/unpin_newsfeed_post/' + id, function(response) {
        if (response.success == true) {
            window.location.reload();
        }
    }, 'json');
}

/* LEADS JS */

function init_lead(id) {
    // In case header error
    if (init_lead_modal_data(id)) {
        $('.lead-modal').modal('show');
    }
}

function validate_lead_form(formHandler) {
    _validate_form($('#lead_form'), {
        name: 'required',
        status: {
            required: {
                depends: function(element) {
                    if ($('[lead-is-junk-or-lost]').length > 0) {
                        return false;
                    } else {
                        return true;
                    }
                }
            }
        },
        source: 'required',
        email: {
            email: true,
            remote: {
                url: admin_url + "leads/email_exists",
                type: 'post',
                data: {
                    email: function() {
                        return $('input[name="email"]').val();
                    },
                    leadid: function() {
                        return $('input[name="leadid"]').val();
                    }
                }
            }
        }
    }, formHandler);
}

function validate_lead_convert_to_client_form() {
    _validate_form($('#lead_to_client_form'), {
        company: 'required',
        firstname: 'required',
        lastname: 'required',
        password: {
            required: {
                depends: function(element) {
                    var sent_set_password = $('input[name="send_set_password_email"]');
                    if (sent_set_password.prop('checked') == false) {
                        return true;
                    }
                }
            }
        },
        email: {
            required: true,
            email: true,
            remote: {
                url: site_url + "admin/misc/contact_email_exists",
                type: 'post',
                data: {
                    email: function() {
                        return $('#lead_to_client_form input[name="email"]').val();
                    },
                    userid: ''
                }
            }
        }

    });
}
// Lead profile data function form handler
function lead_profile_form_handler(form) {
    form = $(form);
    var data = form.serialize();
    var serializeArray = $(form).serializeArray();
    var leadid = $('.lead-modal').find('input[name="leadid"]').val();
    $.post(form.attr('action'), data).done(function(response) {
        response = JSON.parse(response);
        if (response.id) {
            leadid = response.id;
        }
        if (response.message != '') {
            alert_float('success', response.message);
        }
        if (response.proposal_warning && response.proposal_warning != false) {
            $('body').find('#lead_proposal_warning').removeClass('hide');
            $('body').find('.lead-modal').animate({
                scrollTop: 0
            }, 800);
        } else {
            init_lead_modal_data(leadid);
        }

        // If is from kanban reload the list tables
        if ($.fn.DataTable.isDataTable('.table-leads')) {
            $('.table-leads').DataTable().ajax.reload();
        }
    }).fail(function(data) {
        alert_float('danger', data.responseText);
        return false;
    });
    return false;
}

function update_all_proposal_emails_linked_to_lead(id) {
    $.post(admin_url + 'leads/update_all_proposal_emails_linked_to_lead/' + id, {
        update: true
    }).done(function(response) {
        response = JSON.parse(response);
        if (response.success) {
            alert_float('success', response.message);
        }
        init_lead_modal_data(id);
    });
}

function init_lead_modal_data(id, url) {
    if (typeof(id) == 'undefined') {
        id = '';
    }
    var _url = admin_url + 'leads/lead/' + id;
    if (typeof(url) != 'undefined') {
        _url = url;
    }
    // get the current hash
    var hash = window.location.hash;
    // clean the modal
    // $('.lead-modal .modal-content').html('');
    $.get(_url, function(response) {
        $('.lead-modal .modal-content').html(response.data);
        $('#lead_reminder_modal').html(response.reminder_data);
        $('.lead-modal').modal({
            show: true,
            backdrop: 'static'
        });
        init_selectpicker();
        init_form_reminder();
        init_datepicker();
        window.location.hash = hash;
    }, 'json').fail(function(data) {
        $('.lead-modal').modal('hide');
        alert_float('danger', data.responseText);
    });
}
// Kanban lead sort
function leads_kanban_sort(type) {
    var sort_type = $('input[name="sort_type"]');
    var sort = $('input[name="sort"]');
    sort_type.val(type);
    if (sort.val() == 'ASC') {
        sort.val('DESC');
    } else if (sort.val() == 'DESC') {
        sort.val('ASC');
    } else {
        sort.val('DESC');
    }

    leads_kanban();
}

function leads_kanban_update(ui, object) {
    if (object === ui.item.parent()[0]) {
        var data = {};
        data.status = $(ui.item.parent()[0]).data('lead-status-id');
        data.leadid = $(ui.item).data('lead-id');

        var order = [];
        var status = $(ui.item).parents('.leads-status').find('li')
        var i = 1;
        $.each(status, function() {
            order.push([$(this).data('lead-id'), i]);
            i++;
        });
        data.order = order;
        setTimeout(function() {
            leads_update_req = $.post(admin_url + 'leads/update_kan_ban_lead_status', data).done(function(response) {
                leads_update_req = null;
                check_kanban_empty_col('[data-lead-id]');
            });
        }, 200);


    }
}

function init_leads_status_sortable() {
    $("#kan-ban").sortable({
        helper: 'clone',
        item: '.kan-ban-col',
        update: function(event, ui) {
            var order = [];
            var status = $('.kan-ban-col');
            var i = 0;
            $.each(status, function() {
                order.push([$(this).data('col-status-id'), i]);
                i++;
            });
            var data = {}
            data.order = order;
            $.post(admin_url + 'leads/update_status_order', data);
        }
    });
}
// Init the leads kanban
function leads_kanban(search) {
    init_kanban('leads', leads_kanban_update, '.leads-status', 290, 360, init_leads_status_sortable);
}
// Deleting lead attachments
function delete_lead_attachment(wrapper, id) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'leads/delete_attachment/' + id, function(response) {
            if (response.success == true) {
                $(wrapper).parents('.lead-attachment-wrapper').remove();
            }
        }, 'json');
    }
}
// Deleting lead note
function delete_lead_note(wrapper, id) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        $.get(admin_url + 'leads/delete_note/' + id, function(response) {
            if (response.success == true) {
                $(wrapper).parents('.lead-note').remove();
            }
        }, 'json');
    }
}
// Mark lead as lost function
function lead_mark_as_lost(lead_id) {
    $.get(admin_url + 'leads/mark_as_lost/' + lead_id, function(response) {
        if (response.success == true) {
            alert_float('success', response.message);
        }
        init_lead_modal_data(lead_id);
    }, 'json');
}
// Unmark lead as lost function
function lead_unmark_as_lost(lead_id) {
    $.get(admin_url + 'leads/unmark_as_lost/' + lead_id, function(response) {
        if (response.success == true) {
            alert_float('success', response.message);
        }
        init_lead_modal_data(lead_id);
    }, 'json');
}
// Mark lead as junk function
function lead_mark_as_junk(lead_id) {
    $.get(admin_url + 'leads/mark_as_junk/' + lead_id, function(response) {
        if (response.success == true) {
            alert_float('success', response.message);
        }
        init_lead_modal_data(lead_id);
    }, 'json');
}
// Unmark lead as junk function
function lead_unmark_as_junk(lead_id) {
    $.get(admin_url + 'leads/unmark_as_junk/' + lead_id, function(response) {
        if (response.success == true) {
            alert_float('success', response.message);
        }
        init_lead_modal_data(lead_id);
    }, 'json');
}
// Statuses function for add/edit becuase there is ability to edit the status directly from the lead kanban
$(function() {
    _validate_form($('body').find('#leads-status-form'), {
        name: 'required'
    }, manage_leads_statuses);
    $('#status').on('hidden.bs.modal', function(event) {
        $('#additional').html('');
        $('#status input').val('');
        $('.add-title').removeClass('hide');
        $('.edit-title').removeClass('hide');
        $('#status input[name="statusorder"]').val($('table tbody tr').length + 1);
    });
});
// Form handler function for leads status
function manage_leads_statuses(form) {
    var data = $(form).serialize();
    var url = form.action;
    $.post(url, data).done(function(response) {
        window.location.reload();
    });
    return false;
}
// Convert lead to customer
function convert_lead_to_customer(id) {
    $('.lead-modal').modal('hide');
    $.get(admin_url + 'leads/get_convert_data/' + id, function(response) {
        $('#lead_convert_to_customer').html(response);
        $('#convert_lead_to_client_modal').modal({
            show: true,
            backdrop: 'static',
            keyboard: false
        });
    });
}
// Create lead new status
function new_status() {
    $('#status').modal('show');
    $('.edit-title').addClass('hide');
}
// Edit status function which init the data to the modal
function edit_status(invoker, id) {
    $('#additional').append(hidden_input('id', id));
    $('#status input[name="name"]').val($(invoker).data('name'));
    $('#status .colorpicker-input').colorpicker('setValue', $(invoker).data('color'));
    $('#status input[name="statusorder"]').val($(invoker).data('order'));
    $('#status').modal('show');
    $('.add-title').addClass('hide');
}

function leads_bulk_action(event) {
    var r = confirm(confirm_action_prompt);
    if (r == false) {
        return false;
    } else {
        var mass_delete = $('#mass_delete').prop('checked');
        var ids = [];
        var data = {};
        if (mass_delete == false || typeof(mass_delete) == 'undefined') {
            data.status = $('#move_to_status_leads_bulk').val();
            data.assigned = $('#assign_to_leads_bulk').val();
            data.source = $('#move_to_source_leads_bulk').val();
            if (typeof(data.assigned) == 'undefined') {
                data.assigned = '';
            }
            if (data.status == '' && data.assigned == '' && data.source == '') {
                return;
            }
        } else {
            data.mass_delete = true;
        }

        var rows = $('.table-leads').find('tbody tr');
        $.each(rows, function() {
            var checkbox = $($(this).find('td').eq(0)).find('input');
            if (checkbox.prop('checked') == true) {
                ids.push(checkbox.val());
            }
        });
        data.ids = ids;
        $(event).addClass('disabled');
        setTimeout(function() {
            $.post(admin_url + 'leads/bulk_action', data).done(function() {
                window.location.reload();
            });
        }, 50);
    }
}
function sync_proposals_data(rel_id,rel_type){
    var data = {};
    var modal_sync = $('#sync_data_proposal_data');
    data.country = modal_sync.find('select[name="country"]').val();
    data.zip = modal_sync.find('input[name="zip"]').val();
    data.state = modal_sync.find('input[name="state"]').val();
    data.city = modal_sync.find('input[name="city"]').val();
    data.address = modal_sync.find('input[name="address"]').val();
    data.phone = modal_sync.find('input[name="phone"]').val();
    data.rel_id = rel_id;
    data.rel_type = rel_type;
    $.post(admin_url+'proposals/sync_data',data).done(function(response){
        response = JSON.parse(response);
        alert_float('success',response.message);
        modal_sync.modal('hide');
    });
}
function init_table_announcements(manual){
    if(typeof(manual) == 'undefined' && $('body').hasClass('home')){
            return false;
    }
    initDataTable('.table-announcements', admin_url + 'announcements', [2], [2], 'undefined', [1, 'DESC']);
}
function init_table_tickets(manual){

    if(typeof(manual) == 'undefined' && $('body').hasClass('home')){
            return false;
    }

    var tickets_not_sortable = $('.tickets-table').find('th').length - 1;
    var TicketServerParams = {};

    $.each($('._hidden_inputs._filters.tickets_filters input'), function() {
        TicketServerParams[$(this).attr('name')] = '[name="' + $(this).attr('name') + '"]';
    });

    TicketServerParams['project_id'] = '[name="project_id"]';
    var _tns = [tickets_not_sortable];
    var _tickets_table_url = admin_url + 'tickets';
    if ($('body').hasClass('tickets_page')) {
        _tns.push(0);
        _tickets_table_url += '?bulk_actions=true';
    }

    _table_api = initDataTable('.tickets-table', _tickets_table_url, _tns, _tns, TicketServerParams, [$('table thead .ticket_created_column').index(), 'DESC']);

    if (_table_api && $('body').hasClass('home')) {
        _table_api.column(tickets_not_sortable).visible(false, false).columns.adjust();
    }
}
function init_table_staff_projects(manual){
    if(typeof(manual) == 'undefined' && $('body').hasClass('home')){
        return false;
    }
    var staffProjectsParams = {};
    $.each($('._hidden_inputs._filters.staff_projects_filter input'), function() {
        staffProjectsParams[$(this).attr('name')] = '[name="' + $(this).attr('name') + '"]';
    });

    initDataTable('.table-staff-projects', admin_url + 'projects/staff_projects', 'undefined', 'undefined', staffProjectsParams, [2, 'ASC']);
}
