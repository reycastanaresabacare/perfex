<?php init_head(); ?>
<div id="wrapper">
   <div class="content">
      <div class="row">
         <?php include_once(APPPATH . 'views/admin/includes/alerts.php'); ?>
         <div class="col-md-12">
            <div class="panel_s">
               <div class="panel-heading">
                  <?php echo _l('sales_report_heading'); ?>
               </div>
               <div class="panel-body">
                  <div class="row">
                     <div class="col-md-4 border-right">
                        <p><a href="#" class="font-medium" onclick="init_report(this,'total-income'); return false;"><i class="fa fa-angle-double-right" aria-hidden="true"></i> <?php echo _l('report_sales_type_income'); ?></a></p>
                        <p><a href="#" class="font-medium" onclick="init_report(this,'invoices-report'); return false;"><i class="fa fa-angle-double-right" aria-hidden="true"></i> <?php echo _l('invoice_report'); ?></a></p>
                        <p><a href="#" class="font-medium" onclick="init_report(this,'payments-received'); return false;"><i class="fa fa-angle-double-right" aria-hidden="true"></i> <?php echo _l('payments_received'); ?></a></p>
                        <p><a href="#" class="font-medium" onclick="init_report(this,'payment-modes'); return false;"><i class="fa fa-angle-double-right" aria-hidden="true"></i> <?php echo _l('payment_modes_report'); ?></a></p>
                        <p><a href="#" class="font-medium" onclick="init_report(this,'customers-report'); return false;"><i class="fa fa-angle-double-right" aria-hidden="true"></i> <?php echo _l('report_sales_type_customer'); ?></a></p>
                        <p><a href="#" class="font-medium" onclick="init_report(this,'estimates-report'); return false;"><i class="fa fa-angle-double-right" aria-hidden="true"></i> <?php echo _l('estimates_report'); ?></a></p>
                        <p><a href="#" class="font-medium" onclick="init_report(this,'customers-group'); return false;"><i class="fa fa-angle-double-right" aria-hidden="true"></i> <?php echo _l('report_by_customer_groups'); ?></a></p>
                        <?php if(total_rows('tblinvoices',array('status'=>5)) > 0){ ?>
                        <p class="text-danger">
                           <i class="fa fa-exclamation-circle" aria-hidden="true"></i> <?php echo _l('sales_report_cancelled_invoices_not_included'); ?>
                        </p>
                        <?php } ?>
                     </div>
                     <div class="col-md-8">
                        <?php if(isset($currencies)){ ?>
                        <div id="currency" class="form-group hide">
                           <label for="currency"><i class="fa fa-question-circle" data-toggle="tooltip" title="<?php echo _l('report_sales_base_currency_select_explanation'); ?>"></i> <?php echo _l('currency'); ?></label><br />
                           <select class="selectpicker" name="currency" data-width="50%" data-none-selected-text="<?php echo _l('dropdown_non_selected_tex'); ?>">
                              <?php foreach($currencies as $currency){
                                 $selected = '';
                                 if($currency['isdefault'] == 1){
                                    $selected = 'selected';
                                 }
                                 ?>
                              <option value="<?php echo $currency['id']; ?>" <?php echo $selected; ?>><?php echo $currency['name']; ?></option>
                              <?php } ?>
                           </select>
                        </div>
                        <?php } ?>
                        <div id="income-years" class="hide mbot15">
                           <label for="payments_years"><?php echo _l('year'); ?></label><br />
                           <select class="selectpicker" name="payments_years" data-width="50%" onchange="total_income_bar_report();" data-none-selected-text="<?php echo _l('dropdown_non_selected_tex'); ?>">
                              <?php foreach($payments_years as $year) { ?>
                              <option value="<?php echo $year['year']; ?>"<?php if($year['year'] == date('Y')){echo 'selected';} ?>>
                                 <?php echo $year['year']; ?>
                              </option>
                              <?php } ?>
                           </select>
                        </div>
                        <div class="form-group hide" id="report-time">
                           <label for="months-report"><?php echo _l('period_datepicker'); ?></label><br />
                           <select class="selectpicker" name="months-report" data-width="50%" data-none-selected-text="<?php echo _l('dropdown_non_selected_tex'); ?>">
                              <option value=""><?php echo _l('report_sales_months_all_time'); ?></option>
                              <option value="3"><?php echo _l('report_sales_months_three_months'); ?></option>
                              <option value="6"><?php echo _l('report_sales_months_six_months'); ?></option>
                              <option value="12"><?php echo _l('report_sales_months_twelve_months'); ?></option>
                              <option value="custom"><?php echo _l('report_sales_months_custom'); ?></option>
                           </select>
                        </div>
                        <div id="date-range" class="hide animated mbot15">
                           <div class="row">
                              <div class="col-md-6">
                                 <label for="report-from" class="control-label"><?php echo _l('report_sales_from_date'); ?></label>
                                 <div class="input-group date">
                                    <input type="text" class="form-control datepicker" id="report-from" name="report-from">
                                    <div class="input-group-addon">
                                       <i class="fa fa-calendar calendar-icon"></i>
                                    </div>
                                 </div>
                              </div>
                              <div class="col-md-6">
                                 <label for="report-to" class="control-label"><?php echo _l('report_sales_to_date'); ?></label>
                                 <div class="input-group date">
                                    <input type="text" class="form-control datepicker" disabled="disabled" id="report-to" name="report-to">
                                    <div class="input-group-addon">
                                       <i class="fa fa-calendar calendar-icon"></i>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         <div class="col-md-12">
            <div class="panel_s hide" id="report">
               <div class="panel-heading">
                  <?php echo _l('reports_sales_generated_report'); ?>
               </div>
               <div class="panel-body">
                  <canvas id="chart" class="animated fadeIn" height="100"></canvas>
                  <canvas id="chart-payment-modes" class="animated fadeIn" height="100"></canvas>
                  <div id="customers-report" class="hide">
                     <?php render_datatable(array(
                        _l('reports_sales_dt_customers_client'),
                        _l('reports_sales_dt_customers_total_invoices'),
                        _l('reports_sales_dt_items_customers_amount'),
                        _l('reports_sales_dt_items_customers_amount_with_tax'),
                        ),'customers-report'); ?>
                  </div>
                  <canvas id="customers-group-gen" class="animated fadeIn" height="100"></canvas>
                  <div id="invoices-report" class="hide">
                     <div class="row">
                        <div class="col-md-4">
                           <div class="form-group">
                              <label for="invoice_status"><?php echo _l('report_invoice_status'); ?></label>
                              <select name="invoice_status" class="selectpicker" multiple data-width="100%">
                                 <option value="" selected><?php echo _l('invoice_status_report_all'); ?></option>
                                 <?php foreach($invoice_statuses as $status){ if($status ==5){continue;} ?>
                                 <option value="<?php echo $status; ?>"><?php echo format_invoice_status($status,'',false) ?></option>
                                 <?php } ?>
                              </select>
                           </div>
                        </div>
                        <?php if(count($invoices_sale_agents) > 0 ) { ?>
                        <div class="col-md-4">
                           <div class="form-group">
                              <label for="sale_agent_invoices"><?php echo _l('sale_agent_string'); ?></label>
                              <select name="sale_agent_invoices" class="selectpicker" multiple data-width="100%">
                                 <option value="" selected><?php echo _l('invoice_status_report_all'); ?></option>
                                 <?php foreach($invoices_sale_agents as $agent){ ?>
                                 <option value="<?php echo $agent['sale_agent']; ?>"><?php echo get_staff_full_name($agent['sale_agent']); ?></option>
                                 <?php } ?>
                              </select>
                           </div>
                        </div>
                        <?php } ?>
                        <div class="clearfix"></div>
                     </div>
                     <table class="table table table-striped table-invoices-report">
                     <thead>
                        <tr>
                           <th><?php echo _l('report_invoice_number'); ?></th>
                           <th><?php echo _l('report_invoice_customer'); ?></th>
                           <th><?php echo _l('invoice_estimate_year'); ?></th>
                           <th><?php echo _l('report_invoice_date'); ?></th>
                           <th><?php echo _l('report_invoice_duedate'); ?></th>
                           <th><?php echo _l('report_invoice_amount'); ?></th>
                           <th><?php echo _l('report_invoice_amount_with_tax'); ?></th>
                           <th><?php echo _l('report_invoice_total_tax'); ?></th>
                           <th><?php echo _l('tax_breakdown'); ?></th>
                           <th><?php echo _l('invoice_discount'); ?></th>
                           <th><?php echo _l('invoice_adjustment'); ?></th>
                           <th><?php echo _l('report_invoice_amount_open'); ?></th>
                           <th><?php echo _l('report_invoice_status'); ?></th>
                        </tr>
                     </thead>
                     <tbody></tbody>
                     <tfoot>
                        <tr>
                           <td></td>
                           <td></td>
                           <td></td>
                           <td></td>
                           <td></td>
                           <td class="subtotal"></td>
                           <td class="total"></td>
                           <td class="total_tax"></td>
                           <td></td>
                           <td class="discount_total"></td>
                           <td class="adjustment"></td>
                           <td class="amount_open"></td>
                           <td></td>
                        </tr>
                     </tfoot>
                     </table>
                  </div>
                  <div id="estimates-report" class="hide">
                     <div class="row">
                        <div class="col-md-4">
                           <div class="form-group">
                              <label for="estimate_status"><?php echo _l('estimate_status'); ?></label>
                              <select name="estimate_status" class="selectpicker" multiple data-width="100%">
                                 <option value="" selected><?php echo _l('invoice_status_report_all'); ?></option>
                                 <?php foreach($estimate_statuses as $status){ ?>
                                 <option value="<?php echo $status; ?>"><?php echo format_estimate_status($status,'',false) ?></option>
                                 <?php } ?>
                              </select>
                           </div>
                        </div>
                        <?php if(count($estimates_sale_agents) > 0 ) { ?>
                        <div class="col-md-4">
                           <div class="form-group">
                              <label for="sale_agent_estimates"><?php echo _l('sale_agent_string'); ?></label>
                              <select name="sale_agent_estimates" class="selectpicker" multiple data-width="100%">
                                 <option value="" selected><?php echo _l('invoice_status_report_all'); ?></option>
                                 <?php foreach($estimates_sale_agents as $agent){ ?>
                                 <option value="<?php echo $agent['sale_agent']; ?>"><?php echo get_staff_full_name($agent['sale_agent']); ?></option>
                                 <?php } ?>
                              </select>
                           </div>
                        </div>
                        <?php } ?>
                     </div>
                     <div class="clearfix"></div>

                     <table class="table table table-striped table-estimates-report">
                           <thead>
                            <tr>
                              <th><?php echo _l('estimate_dt_table_heading_number'); ?></th>
                              <th><?php echo _l('estimate_dt_table_heading_client'); ?></th>
                              <th><?php echo _l('report_invoice_number'); ?></th>
                              <th><?php echo _l('invoice_estimate_year'); ?></th>
                              <th><?php echo _l('estimate_dt_table_heading_date'); ?></th>
                              <th><?php echo _l('estimate_dt_table_heading_expirydate'); ?></th>
                              <th><?php echo _l('estimate_dt_table_heading_amount'); ?></th>
                              <th><?php echo _l('report_invoice_amount_with_tax'); ?></th>
                              <th><?php echo _l('report_invoice_total_tax'); ?></th>
                              <th><?php echo _l('tax_breakdown'); ?></th>
                              <th><?php echo _l('estimate_discount'); ?></th>
                              <th><?php echo _l('estimate_adjustment'); ?></th>
                              <th><?php echo _l('reference_no'); ?></th>
                              <th><?php echo _l('estimate_dt_table_heading_status'); ?></th>
                            </tr>
                           </thead>
                           <tbody></tbody>
                           <tfoot>
                              <tr>
                                 <td></td>
                                 <td></td>
                                 <td></td>
                                 <td></td>
                                 <td></td>
                                 <td></td>
                                 <td class="subtotal"></td>
                                 <td class="total"></td>
                                 <td class="total_tax"></td>
                                 <td></td>
                                 <td class="discount_total"></td>
                                 <td class="adjustment"></td>
                                 <td></td>
                                 <td></td>
                              </tr>
                           </tfoot>
                     </table>

                  </div>
                  <div id="payments-received-report" class="hide">
                  <table class="table table table-striped table-payments-received-report">
                     <thead>
                        <tr>
                           <th><?php echo _l('payments_table_number_heading'); ?></th>
                           <th><?php echo _l('payments_table_date_heading'); ?></th>
                           <th><?php echo _l('payments_table_invoicenumber_heading'); ?></th>
                           <th><?php echo _l('payments_table_client_heading'); ?></th>
                           <th><?php echo _l('payments_table_mode_heading'); ?></th>
                           <th><?php echo _l('payment_transaction_id'); ?></th>
                           <th><?php echo _l('note'); ?></th>
                           <th><?php echo _l('payments_table_amount_heading'); ?></th>
                        </tr>
                     </thead>
                     <tbody></tbody>
                     <tfoot>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td class="total"></td>
                     </tfoot>
                  </table>
                  </div>
               </div>
            </div>
         </div>
      </div>
   </div>
</div>
<?php init_tail(); ?>
<?php $this->load->view('admin/reports/includes/sales_js'); ?>
</body>
</html>
