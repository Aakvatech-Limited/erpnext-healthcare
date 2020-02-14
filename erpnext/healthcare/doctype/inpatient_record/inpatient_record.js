// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Inpatient Record', {
	setup: function(frm) {
		frm.get_field('drug_prescription').grid.editable_fields = [
			{fieldname: 'drug_code', columns: 2},
			{fieldname: 'drug_name', columns: 2},
			{fieldname: 'dosage', columns: 2},
			{fieldname: 'period', columns: 2}
		];
	},
	onload:function(frm){
		if(frm.doc.source=="Direct"){
			frm.set_value("referring_practitioner", "");
			frm.set_df_property("referring_practitioner", "hidden", 1);
		}
		else if(frm.doc.source=="External Referral" || frm.doc.source=="Referral") {
			if(frm.doc.primary_practitioner){
				frm.set_df_property("referring_practitioner", "hidden", 0);
				if(frm.doc.source=="External Referral"){
					frappe.db.get_value("Healthcare Practitioner", frm.doc.practitioner, 'healthcare_practitioner_type', function(r) {
						if(r && r.healthcare_practitioner_type && r.healthcare_practitioner_type=="External"){
							frm.set_value("referring_practitioner", frm.doc.practitioner);
						}
						else{
							frm.set_value("referring_practitioner", "");
						}
					});
					frm.set_df_property("referring_practitioner", "read_only", 0);
				}
				else{
					frappe.db.get_value("Healthcare Practitioner", frm.doc.practitioner, 'healthcare_practitioner_type', function(r) {
						if(r && r.healthcare_practitioner_type && r.healthcare_practitioner_type=="Internal"){
							frm.set_value("referring_practitioner", frm.doc.practitioner);
							frm.set_df_property("referring_practitioner", "read_only", 1);
						}
						else{
							frm.set_value("referring_practitioner", "");
							frm.set_df_property("referring_practitioner", "read_only", 0);
						}
					});
				}
				frm.set_df_property("referring_practitioner", "reqd", 1);
			}
			else{
				frm.set_df_property("referring_practitioner", "read_only", 0);
				frm.set_df_property("referring_practitioner", "hidden", 0);
				frm.set_df_property("referring_practitioner", "reqd", 1);
			}
		}
	},
	source: function(frm){
		if(frm.doc.source=="Direct"){
			frm.set_value("referring_practitioner", "");
			frm.set_df_property("referring_practitioner", "hidden", 1);
		}
		else if(frm.doc.source=="External Referral" || frm.doc.source=="Referral") {
			if(frm.doc.primary_practitioner){
				frm.set_df_property("referring_practitioner", "hidden", 0);
				if(frm.doc.source=="External Referral"){
					frappe.db.get_value("Healthcare Practitioner", frm.doc.practitioner, 'healthcare_practitioner_type', function(r) {
						if(r && r.healthcare_practitioner_type && r.healthcare_practitioner_type=="External"){
							frm.set_value("referring_practitioner", frm.doc.practitioner);
						}
						else{
							frm.set_value("referring_practitioner", "");
						}
					});
					frm.set_df_property("referring_practitioner", "read_only", 0);
				}
				else{
					frappe.db.get_value("Healthcare Practitioner", frm.doc.practitioner, 'healthcare_practitioner_type', function(r) {
						if(r && r.healthcare_practitioner_type && r.healthcare_practitioner_type=="Internal"){
							frm.set_value("referring_practitioner", frm.doc.practitioner);
							frm.set_df_property("referring_practitioner", "read_only", 1);
						}
						else{
							frm.set_value("referring_practitioner", "");
							frm.set_df_property("referring_practitioner", "read_only", 0);
						}
					});
				}
				frm.set_df_property("referring_practitioner", "reqd", 1);
			}
			else{
				frm.set_df_property("referring_practitioner", "read_only", 0);
				frm.set_df_property("referring_practitioner", "hidden", 0);
				frm.set_df_property("referring_practitioner", "reqd", 1);
			}
		}
	},
	insurance: function(frm){
		if(frm.doc.insurance){
			frm.set_df_property("insurance_approval_number", "reqd", 1);
		}
	},
	refresh: function(frm) {
		if(frm.doc.__islocal ){
			frm.set_df_property("ordering_practitioner", "read_only", 0);
			frm.set_df_property("referring_encounter", "read_only", 0);
			frm.set_df_property("diagnosis	", "read_only", 0);
			frm.set_df_property("chief_complaint", "read_only", 0);
		}
		else{
			frm.set_df_property("ordering_practitioner", "read_only", 1);
			frm.set_df_property("referring_encounter", "read_only", 1);
			frm.set_df_property("diagnosis	", "read_only", 1);
			frm.set_df_property("chief_complaint", "read_only", 1);
			frm.set_df_property("allowed_total_credit_coverage", "read_only", 1);
			frm.set_df_property("source", "read_only", 1);
			frm.set_df_property("primary_practitioner", "read_only", 1);
			frm.set_df_property("secondary_practitioner", "read_only", 1);
			frm.set_df_property("admission_service_unit_type", "read_only", 1);
			frappe.call({
				method: "get_billing_info",
				doc: frm.doc,
				callback: function(r) {
					frm.dashboard.add_indicator(__('Total Billing: {0}', [format_currency(r.message.total_billing)]), 'blue');
					frm.dashboard.add_indicator(__('Total Unpaid: {0}', [format_currency(r.message.total_unpaid)]),
					r.message.total_unpaid>frm.doc.allowed_total_credit_coverage ? 'orange' : 'green');
				}
			})
		}
		frm.set_query("referring_encounter", function(){
			return {
				filters: {
					"patient": frm.doc.patient,
					"practitioner": frm.doc.ordering_practitioner
				}
			};
		});
		frm.set_query("admission_service_unit_type", function(){
			return {
				filters: {
					"inpatient_occupancy": 1,
					"allow_appointments": 0
				}
			};
		});
		frm.set_query("insurance", function(){
			return {
				filters: {
					"patient": frm.doc.patient,
					"docstatus": 1
				}
			};
		});
		frm.set_query("referring_practitioner", function() {
			if(frm.doc.source=="External Referral"){
				return {
					filters: {
						'healthcare_practitioner_type': "External"
					}
				};
			}
			else{
				return {
					filters: {
						'healthcare_practitioner_type': "Internal"
					}
				};
			}
		});
		if(!frm.doc.__islocal && frm.doc.status == "Discharged"){
			let db_btns = $('.form-dashboard-wrapper').find('.btn-new').find('.btn-new');
			$.each(db_btns.prevObject, function(i, d) {
				$(d).hide();
			});
		}
		if (!frm.doc.__islocal && frm.doc.docstatus == 0) {
			frm.add_custom_button(__("Payment"), function() {
				frm.events.make_payment_entry(frm);
			});
		}
		if(!frm.doc.__islocal && frm.doc.status == "Admission Scheduled"){
			frm.add_custom_button(__('Admit'), function() {
				admit_patient_dialog(frm);
			} );
			frm.set_df_property("btn_transfer", "hidden", 1);
		}
		if(!frm.doc.__islocal && (frm.doc.status == "Admitted" || frm.doc.status == "Discharge Scheduled")){
			if(frappe.defaults.get_default("auto_invoice_inpatient")){
				frm.add_custom_button(__('Submit Invoices'), function() {
					submit_all_ip_invoices(frm);
				});
			}
			frm.add_custom_button(__('Record Consumption'), function() {
				create_delivery_note(frm);
			});
		}
		if(!frm.doc.__islocal && frm.doc.status == "Discharge Scheduled"){
			frm.add_custom_button(__('Discharge'), function() {
				discharge_patient(frm);
			} );
			frm.set_df_property("btn_transfer", "hidden", 0);
		}
		if(!frm.doc.__islocal && (frm.doc.status == "Discharged" || frm.doc.status == "Discharge Scheduled")){
			frm.disable_save();
			frm.set_df_property("btn_transfer", "hidden", 1);
			frm.set_df_property("inpatient_record_procedure", 'read_only', 1);
			frm.set_df_property("insurance", 'read_only', 1);
		}
		if(!frm.doc.__islocal && frm.doc.drug_prescription){
			show_table_html(frm, frm.doc.drug_prescription, "drug_prescription", frm.fields_dict.drug_prescription_html)
		}
		if(!frm.doc.__islocal && frm.doc.lab_test_prescription){
			show_table_html(frm, frm.doc.lab_test_prescription, "lab_test_prescription", frm.fields_dict.lab_test_prescription_html)
		}
		if(!frm.doc.__islocal && frm.doc.procedure_prescription){
			show_table_html(frm, frm.doc.procedure_prescription, "procedure_prescription", frm.fields_dict.procedure_prescription_html)
		}
		if(!frm.doc.__islocal && frm.doc.status == "Admission Scheduled"){
			frm.add_custom_button(__('Book Appointments'), function() {
				book_appointment(frm);
			});
		}
	},
	btn_transfer: function(frm) {
		transfer_patient_dialog(frm);
	},
	make_payment_entry: function(frm) {
		return frappe.call({
			method: "create_payment_entry",
			doc: frm.doc,
			callback: function(r) {
				var doc = frappe.model.sync(r.message);
				frappe.set_route("Form", doc[0].doctype, doc[0].name);
			}
		});
	},
});

var submit_all_ip_invoices = function(frm) {
	frappe.call({
		doc: frm.doc,
		method: "submit_all_invoices",
		callback: function(data) {
			if(!data.exc){
				frm.reload_doc();
			}
		},
		freeze: true,
		freeze_message: "Submitting......!"
	});
}

var discharge_patient = function(frm) {
	frappe.call({
		doc: frm.doc,
		method: "discharge",
		callback: function(data) {
			if(!data.exc){
				frm.reload_doc();
			}
		},
		freeze: true,
		freeze_message: "Process Discharge"
	});
};

var create_delivery_note = function(frm){
	var items = []
	var dialog = new frappe.ui.Dialog({
		title: 'Record Consumption',
		width: 100,
		fields: [
			{fieldtype: "Link", label: "Healthcare Service Unit", fieldname: "service_unit", options: "Healthcare Service Unit"},
			{fieldtype: "Column Break"},
			{fieldtype: "Link", label: "Warehouse", fieldname: "warehouse", options: "Warehouse", reqd: 1},
			{fieldtype: "Section Break"},
			{fieldtype: "Link", label: "Item", fieldname: "item", options: "Item"},
			{fieldtype: "Float", label: "Quantity", fieldname: "qty", default:1},
			{fieldtype: "Column Break"},
			{fieldtype: "Link", label: "UOM", fieldname: "uom", options:"UOM"},
			{fieldtype: "Button", label: "Add to Items", fieldname: "add_to_delivery_note"},
			{fieldtype: "Section Break"},
			{fieldtype: "HTML", label: "Item Details", fieldname: "item_details"}
		],
		primary_action_label: __("Consume"),
		primary_action : function(){
			if(items && items.length > 0){
				frappe.call({
					method: 'erpnext.healthcare.doctype.inpatient_record.inpatient_record.create_delivery_note',
					args:{
						'ip_record': frm.doc.name,
						'items': items
					},
					callback: function(data) {
						if(!data.exc){
							frm.reload_doc();
						}
					},
					freeze: true,
					freeze_message: "Creating Delivery Note"
				});
				dialog.hide();
			}
			else {
				frappe.msgprint(__("Please select atleast one item to Consume"));
			}
		}
	});
	dialog.set_values({
		'service_unit': frm.doc.current_service_unit
	});
	dialog.fields_dict["item"].get_query = function(){
		return {
			filters: {
				"is_stock_item": 1,
				"disabled": ["!=", 1]
			}
		};
	};
	dialog.fields_dict["service_unit"].get_query = function(){
		return {
			filters: {
				"is_group": ["!=", 1]
			}
		};
	};
	dialog.fields_dict["warehouse"].get_query = function(){
		return {
			filters: {
				"is_group": ["!=", 1]
			}
		};
	};
	dialog.fields_dict["service_unit"].df.onchange = () => {
		frappe.call({
			method: 'frappe.client.get_value',
			args:{
				doctype: 'Healthcare Service Unit',
				fieldname: 'warehouse',
				filters:{
					'name': dialog.get_value('service_unit')
				}
			},
			callback: function(r) {
				if(r.message && r.message.warehouse){
					dialog.set_values({
						'warehouse': r.message.warehouse
					});
				}
			}
		});
	}
	dialog.fields_dict["item"].df.onchange = () => {
		if(dialog.get_value('item')){
			frappe.call({
				method: 'erpnext.healthcare.utils.sales_item_details_for_healthcare_doc',
				args:{
					item_code: dialog.get_value('item'),
					doc: frm.doc,
				},
				callback: function(r) {
					if(r.message){
						dialog.set_values({
							'uom': r.message.stock_uom
						});
					}
				}
			});
		}
	}
	dialog.fields_dict["add_to_delivery_note"].df.click = () => {
		items = update_items(items, {'service_unit': dialog.get_value('service_unit'),
		'item': dialog.get_value('item'),
		'qty': dialog.get_value('qty'),
		'warehouse': dialog.get_value('warehouse'),
		'uom': dialog.get_value('uom')});
		var $wrapper = dialog.fields_dict.item_details.$wrapper;
		$wrapper
			.html(consumssion_details_html(items));
		dialog.set_values({
			'item': '',
			'uom': '',
			'qty': 1
		});
	}
	dialog.show();
};

var update_items = function(items, new_item){
	if(new_item && new_item['item'] && new_item['qty'] && new_item['service_unit']){
		let item_exist_in_the_list = false;
		$.each(items, function(index, item){
			if(item['item'] == new_item['item']){
				item['qty'] = new_item['qty'];
				item['uom'] = new_item['uom'];
				item['service_unit'] = new_item['service_unit'];
				item['warehouse'] = new_item['warehouse'];
				item_exist_in_the_list = true;
			}
		});
		if(!item_exist_in_the_list){
			items.push(new_item);
		}
	}
	return items;
};

var consumssion_details_html = function(items) {
	var table_html = `<div class='col-md-12 col-sm-12 text-muted'><table class="table table-condensed bordered">
	<tr>
		<th>Item</th><th>Quantity</th><th>UOM</th><th>Warehouse</th><th>Healthcare Service Unit</th>
	</tr>`;

	$.each(items, function(index, item){
		table_html += `<tr>
			<td>${item['item']}</td>
			<td>${item['qty']}</td>
			<td>${item['uom']}</td>
			<td>${item['warehouse']}</td>
			<td>${item['service_unit']}</td>
		</tr>`;
	});

	table_html += `</table> <br/> <hr/> </div>`;
	return table_html;
};

var admit_patient_dialog = function(frm){
	var dialog = new frappe.ui.Dialog({
		title: 'Admit Patient',
		width: 100,
		fields: [
			{fieldtype: "Link", label: "Service Unit Type", fieldname: "service_unit_type", options: "Healthcare Service Unit Type"},
			{fieldtype: "Link", label: "Service Unit", fieldname: "service_unit", options: "Healthcare Service Unit", reqd: 1},
			{fieldtype: "Datetime", label: "Admission Datetime", fieldname: "check_in", reqd: 1},
			{fieldtype: "Date", label: "Expected Discharge", fieldname: "expected_discharge"}
		],
		primary_action_label: __("Admit"),
		primary_action : function(){
			var service_unit = dialog.get_value('service_unit');
			var check_in = dialog.get_value('check_in');
			var expected_discharge = null;
			if(dialog.get_value('expected_discharge')){
				expected_discharge = dialog.get_value('expected_discharge');
			}
			if(!service_unit && !check_in){
				return;
			}
			frappe.call({
				doc: frm.doc,
				method: 'admit',
				args:{
					'service_unit': service_unit,
					'check_in': check_in,
					'expected_discharge': expected_discharge
				},
				callback: function(data) {
					if(!data.exc){
						frm.reload_doc();
					}
				},
				freeze: true,
				freeze_message: "Process Admission"
			});
			frm.refresh_fields();
			dialog.hide();
		}
	});

	dialog.fields_dict["check_in"].df.onchange = () => {
		if(dialog.get_value('check_in')){
			if (frm.doc.expected_length_of_stay && frm.doc.expected_length_of_stay > 0){
				dialog.set_values({
					'expected_discharge': frappe.datetime.add_days(dialog.get_value('check_in'), frm.doc.expected_length_of_stay)
				});
			}
		}
		else{
			dialog.set_values({
				'expected_discharge': ""
			});
		}
	}

	dialog.fields_dict["service_unit_type"].get_query = function(){
		return {
			filters: {
				"inpatient_occupancy": 1,
				"allow_appointments": 0
			}
		};
	};
	dialog.fields_dict["service_unit"].get_query = function(){
		return {
			filters: {
				"is_group": 0,
				"service_unit_type": dialog.get_value("service_unit_type"),
				"status" : "Vacant"
			}
		};
	};

	var check_in_date_time = frappe.datetime.now_datetime();
	var expected_discharge_date = "";

	if(frm.doc.admission_ordered_for){
		check_in_date_time = frm.doc.admission_ordered_for+" "+frappe.datetime.now_time();
		if (frm.doc.expected_length_of_stay && frm.doc.expected_length_of_stay > 0){
			expected_discharge_date = frappe.datetime.add_days(frm.doc.admission_ordered_for, frm.doc.expected_length_of_stay);
		}
	}

	dialog.set_values({
		'service_unit_type': frm.doc.admission_service_unit_type,
		'check_in': check_in_date_time,
		'expected_discharge': expected_discharge_date
	});

	dialog.show();
};

var transfer_patient_dialog = function(frm){
	var dialog = new frappe.ui.Dialog({
		title: 'Transfer Patient',
		width: 100,
		fields: [
			{fieldtype: "Link", label: "Leave From", fieldname: "leave_from", options: "Healthcare Service Unit", reqd: 1, read_only:1},
			{fieldtype: "Link", label: "Service Unit Type", fieldname: "service_unit_type", options: "Healthcare Service Unit Type"},
			{fieldtype: "Link", label: "Transfer To", fieldname: "service_unit", options: "Healthcare Service Unit", reqd: 1},
			{fieldtype: "Datetime", label: "Check In", fieldname: "check_in", reqd: 1}
		],
		primary_action_label: __("Transfer"),
		primary_action : function(){
			var service_unit = null;
			var check_in = dialog.get_value('check_in');
			var leave_from = null;
			if(dialog.get_value('leave_from')){
				leave_from = dialog.get_value('leave_from');
			}
			if(dialog.get_value('service_unit')){
				service_unit = dialog.get_value('service_unit');
			}
			if(!check_in){
				return;
			}
			frappe.call({
				doc: frm.doc,
				method: 'transfer',
				args:{
					'service_unit': service_unit,
					'check_in': check_in,
					'leave_from': leave_from,
					'requested_transfer': frm.doc.transfer_requested
				},
				callback: function(data) {
					if(!data.exc){
						frm.reload_doc();
					}
				},
				freeze: true,
				freeze_message: "Process Transfer"
			});
			frm.refresh_fields();
			dialog.hide();
		}
	});

	dialog.fields_dict["leave_from"].get_query = function(){
		return {
			query : "erpnext.healthcare.doctype.inpatient_record.inpatient_record.get_leave_from",
			filters: {docname:frm.doc.name}
		};
	};
	dialog.fields_dict["service_unit_type"].get_query = function(){
		return {
			filters: {
				"inpatient_occupancy": 1,
				"allow_appointments": 0
			}
		};
	};
	dialog.fields_dict["service_unit"].get_query = function(){
		return {
			filters: {
				"is_group": 0,
				"service_unit_type": dialog.get_value("service_unit_type"),
				"status" : "Vacant"
			}
		};
	};

	dialog.show();

	var not_left_service_unit = null;
	for(let inpatient_occupancy in frm.doc.inpatient_occupancies){
		if(frm.doc.inpatient_occupancies[inpatient_occupancy].left != 1){
			not_left_service_unit = frm.doc.inpatient_occupancies[inpatient_occupancy].service_unit;
		}
	}
	dialog.set_values({
		'leave_from': not_left_service_unit
	});
	if(frm.doc.transfer_requested == 1){
		if(frm.doc.transfer_requested_unit_type){
			dialog.set_values({
				'service_unit_type': frm.doc.transfer_requested_unit_type
			});
		}
		if(frm.doc.transfer_requested_unit_type){
			dialog.set_values({
				'check_in': frm.doc.expected_transfer
			});
		}
	}
	else{
		if(not_left_service_unit){
			frappe.db.get_value("Healthcare Service Unit", not_left_service_unit, 'service_unit_type', function(r) {
				if(r && r.service_unit_type){
					dialog.set_values({
						'service_unit_type': r.service_unit_type
					});
				}
			});
		}
	}
};

var show_table_html = function(frm, child_table, child_table_name, html_field) {
	setTimeout(function() {
		var $wrapper = html_field.$wrapper;
		var table_html = "<div class='col-md-12 col-sm-12 text-muted'>";
		var table_head = null;
		var table_row = null;
		var table_fields = frm.get_field(child_table_name).grid.docfields;

		table_head = '<tr>'
		$.each(table_fields, function(i, table_field) {
			if(table_field.in_list_view == 1){
				table_head = table_head + '<th>' + table_field.label + '</th>'
			}
		});
		table_head = table_head + '</tr>'

		$.each(child_table, function(index, data_object){
			var procedure_comment = "";
			if(table_row == null){
				table_row = '<tr>'
			}
			else{
				table_row = table_row + '<tr>'
			}
			$.each(table_fields, function(i, table_field) {
				if(table_field.in_list_view == 1){
					table_row = table_row + '<td>'+data_object[table_field.fieldname]+'</td>'
				}
			});
			table_row = table_row + '</tr>'
		});

		table_html = table_html + '<table class="table table-condensed \
			bordered">' + table_head +  table_row + '</table> <br/> <hr/>' + "</div>"
		$wrapper
			.css('margin-bottom', 0)
			.html(table_html);
	}, 1000)
}

var book_appointment = function(frm) {
	var selected_slot = null;
	let selected_practitioner = '';
	let selected_department = '';
	var d = new frappe.ui.Dialog({
		title: __("Book Appointment"),
		fields: [
			{ fieldtype: 'Link', options: 'Medical Department',  reqd:1, fieldname: 'department', label: 'Medical Department'},
			{ fieldtype: 'Link', options: 'Healthcare Practitioner', reqd:1, fieldname: 'practitioner', label: 'Healthcare Practitioner'},
			{ fieldtype: 'Column Break'},
			{ fieldtype: 'Link', options: 'Clinical Procedure Template', fieldname: 'procedure_template', label: 'Procedure'},
			{ fieldtype: 'Link', options: 'Appointment Type', reqd:1, fieldname: 'appointment_type', label: 'Appointment Type'},
			{ fieldtype: 'Column Break'},
			{ fieldtype: 'Int',	fieldname: 'duration', label: 'Duration'},
			{ fieldtype: 'Date', reqd:1, fieldname: 'appointment_date', label: 'Date'},
			{ fieldtype: 'Data', fieldname: 'procedure_id', hidden: 1, label: 'Procedure ID'},
			{ fieldtype: 'Section Break'},
			{ fieldtype: 'HTML', fieldname: 'available_slots'}
		],
		primary_action_label: __("Book"),
		primary_action: function() {
			var appointments_table = [];
			if (d.get_value('duration') <= 0){
				frappe.throw(__("Duration must be geater than zero"));
			}
			appointments_table.push({
				"patient": frm.doc.patient,
				"department": d.get_value('department'),
				"practitioner": d.get_value('practitioner'),
				"appointment_date": d.get_value('appointment_date'),
				"appointment_time":selected_slot,
				"duration":	d.get_value('duration'),
				"procedure_template": d.get_value('procedure_template'),
				"appointment_type": '',
				"service_unit": '',
				"inpatient_record_procedure": d.get_value('procedure_id')
			});
			if(appointments_table){
				frappe.call({
					method: "erpnext.healthcare.doctype.inpatient_record.inpatient_record.book_all_appointments",
					args:{
						appointments_table: appointments_table,
						inpatient_record: frm.doc.name
					},
					callback: function(data) {
						if(!data.exc){
							d.hide();
							$(me.wrapper).empty();
							frm.refresh_fields();
						}
					},
					freeze: true,
					freeze_message: __("Booking Appointment......")
				});
			}
		}
		});
		var procedure_template = '';
		var inpatient_record_procedure = '';
		$.each(frm.doc.inpatient_record_procedure, function(i, ip_procedure) {
			if (ip_procedure.appointment_booked != 1){
				procedure_template = ip_procedure.procedure;
				inpatient_record_procedure = ip_procedure.name;
				return false
			}
		});
		d.set_values({
			'procedure_template': procedure_template,
			'procedure_id': inpatient_record_procedure,
			'department': frm.doc.medical_department,
			'practitioner': frm.doc.primary_practitioner
		});
		d.show();
		var fd = d.fields_dict;
		d.fields_dict["department"].df.onchange = () => {
			if(d.get_value('department') && d.get_value('department') != selected_department){
				d.set_values({
					'practitioner': ''
				});
				selected_department = d.get_value('department');
				if(selected_department){
					d.fields_dict.practitioner.get_query = function() {
						return {
							filters: {
								"department": selected_department
							}
						};
					};
				}
			}
		};
		d.fields_dict["appointment_date"].df.onchange = () => {
			if(d.get_value('appointment_date') && d.get_value('appointment_date') != selected_appointment_date){
				selected_appointment_date = d.get_value('appointment_date');
				var today = frappe.datetime.nowdate();
				if(today > selected_appointment_date){
					frappe.msgprint(__("you cannot book appointments for past date"));
					d.set_values({
						"appointment_date": ""
					});
				}
				else
				{
					show_slots(d, fd);
				}
			}
			else if(!d.get_value("appointment_date")){
				selected_appointment_date = '';
			}
		}
		d.fields_dict["appointment_type"].df.onchange = () => {
			frappe.db.get_value("Appointment Type", d.get_value('appointment_type'), 'default_duration', function(r) {
				if(r && r.default_duration){
					d.set_values({
						'duration': r.default_duration
					});
				}
			});
		}
		d.fields_dict["procedure_template"].df.onchange = () => {
			show_slots(d, fd, frm);
		}
		d.fields_dict["appointment_date"].df.onchange = () => {
			show_slots(d, fd, frm);
		}
	d.show()

function show_slots(d, fd, frm) {
	var duration = null;
	// If appointment_type is there in frm then dialoge shoud needs that appointment_type - Rescehduling
	// If appointment_type is NOT there in frm then dialoge shoud NOT need appointment_type - Booking
	if (d.get_value('appointment_date') && d.get_value('practitioner') && !(frm.doc.appointment_type && !d.get_value("appointment_type"))){
		fd.available_slots.html("");
		exists_appointment(frm.doc.patient, d.get_value('practitioner'), d.get_value('appointment_date'), (exists)=>{
			if(exists){
				fd.available_slots.html("");
				frappe.call({
					method: 'erpnext.healthcare.doctype.patient_appointment.patient_appointment.get_availability_data',
					args: {
						practitioner: d.get_value('practitioner'),
						date: d.get_value('appointment_date')
					},
					callback: (r) => {
						var data = r.message;
						if(data.slot_details.length > 0 || data.present_events.length > 0) {
							var $wrapper = d.fields_dict.available_slots.$wrapper;

							// make buttons for each slot
							var slot_details = data.slot_details;
							var slot_html = "";
							var have_atleast_one_schedule = false;
							var have_atleast_one_schedule_for_service_unit = false;
							for (let i = 0; i < slot_details.length; i++) {
								if(slot_details[i].appointment_type == d.get_value("appointment_type") || slot_details[i].appointment_type == null){
									have_atleast_one_schedule = true;
									if((frm.doc.service_unit && frm.doc.service_unit == slot_details[i].service_unit) || (!frm.doc.service_unit)){
										have_atleast_one_schedule_for_service_unit = true;
										slot_html = slot_html + `<label>${slot_details[i].slot_name}</label>`;
										slot_html = slot_html + `<br/>` + slot_details[i].avail_slot.map(slot => {
											let disabled = '';
											let background_color = "#cef6d1";
											let start_str = slot.from_time;
											let slot_start_time = moment(slot.from_time, 'HH:mm:ss');
											let slot_to_time = moment(slot.to_time, 'HH:mm:ss');
											let interval = (slot_to_time - slot_start_time)/60000 | 0;
											//iterate in all booked appointments, update the start time and duration
											slot_details[i].appointments.forEach(function(booked) {
												let booked_moment = moment(booked.appointment_time, 'HH:mm:ss');
												let end_time = booked_moment.clone().add(booked.duration, 'minutes');
												if(slot_details[i].fixed_duration != 1){
													if(end_time.isSame(slot_start_time) || end_time.isBetween(slot_start_time, slot_to_time)){
														start_str = end_time.format("HH:mm")+":00";
														interval = (slot_to_time - end_time)/60000 | 0;
														return false;
													}
												}
												// Check for overlaps considering appointment duration
												if(slot_start_time.isBefore(end_time) && slot_to_time.isAfter(booked_moment)){
													// There is an overlap
													disabled = 'disabled="disabled"';
													background_color = "#d2d2ff";
													return false;
												}
											});
											//iterate in all absent events and disable the slots
											slot_details[i].absent_events.forEach(function(event) {
												let event_from_time = moment(event.from_time, 'HH:mm:ss');
												let event_to_time = moment(event.to_time, 'HH:mm:ss');
												// Check for overlaps considering event start and end time
												if(slot_start_time.isBefore(event_to_time) && slot_to_time.isAfter(event_from_time)){
													// There is an overlap
													disabled = 'disabled="disabled"';
													background_color = "#ffd7d7";
													return false;
												}
											});
											return `<button class="btn btn-default"
											data-name=${start_str}
											data-duration=${interval}
											data-service-unit="${slot_details[i].service_unit || ''}"
											flag-fixed-duration=${slot_details[i].fixed_duration || 0}
											style="margin: 0 10px 10px 0; width: 72px; background-color:${background_color};" ${disabled}>
											${start_str.substring(0, start_str.length - 3)}
											</button>`;
										}).join("");
										slot_html = slot_html + `<br/>`;
									}
								}
							}

							if(!have_atleast_one_schedule && !data.present_events){
								slot_html = __("There are no schedules for appointment type {0}", [d.get_value("appointment_type")||'']).bold();
							}

							if(data.present_events && data.present_events.length > 0){
								slot_html = slot_html + `<br/>`;
								var present_events = data.present_events
								for (let i = 0; i < present_events.length; i++) {
										have_atleast_one_schedule_for_service_unit = true;
										slot_html = slot_html + `<label>${present_events[i].slot_name}</label>`;
										slot_html = slot_html + `<br/>` + present_events[i].avail_slot.map(slot => {
											let disabled = '';
											let background_color = "#cef6d1";
											let start_str = slot.from_time;
											let slot_start_time = moment(slot.from_time, 'HH:mm:ss');
											let slot_to_time = moment(slot.to_time, 'HH:mm:ss');
											let interval = (slot_to_time - slot_start_time)/60000 | 0;
											//iterate in all booked appointments, update the start time and duration
											present_events[i].appointments.forEach(function(booked) {
												let booked_moment = moment(booked.appointment_time, 'HH:mm:ss');
												let end_time = booked_moment.clone().add(booked.duration, 'minutes');
												// Check for overlaps considering appointment duration
												if(slot_start_time.isBefore(end_time) && slot_to_time.isAfter(booked_moment)){
													// There is an overlap
													disabled = 'disabled="disabled"';
													background_color = "#d2d2ff";
													return false;
												}
											});
											//iterate in all absent events and disable the slots
											present_events[i].absent_events.forEach(function(event) {
												let event_from_time = moment(event.from_time, 'HH:mm:ss');
												let event_to_time = moment(event.to_time, 'HH:mm:ss');
												// Check for overlaps considering event start and end time
												if(slot_start_time.isBefore(event_to_time) && slot_to_time.isAfter(event_from_time)){
													// There is an overlap
													disabled = 'disabled="disabled"';
													background_color = "#ffd7d7";
													return false;
												}
											});
											return `<button class="btn btn-default"
												data-name=${start_str}
												data-duration=${interval}
												flag-fixed-duration=${1}
												style="margin: 0 10px 10px 0; width: 72px; background-color:${background_color};" ${disabled}>
												${start_str.substring(0, start_str.length - 3)}
											</button>`;
										}).join("");
										slot_html = slot_html + `<br/>`;
								}
							}

							$wrapper
								.css('margin-bottom', 0)
								.addClass('text-center')
								.html(slot_html);

							// blue button when clicked
							$wrapper.on('click', 'button', function() {
								var $btn = $(this);
								$wrapper.find('button').removeClass('btn-primary');
								$btn.addClass('btn-primary');
								selected_slot = $btn.attr('data-name');
								// service_unit = $btn.attr('data-service-unit')
								duration = $btn.attr('data-duration')
								// enable dialog action
								d.get_primary_btn().attr('disabled', null);
								if($btn.attr('flag-fixed-duration') == 1){
									d.set_values({
										'duration': $btn.attr('data-duration')
									});
								}
							});

						}else {
								fd.available_slots.html("Please select a valid date.".bold())
							show_empty_state(d.get_value('practitioner'), d.get_value('appointment_date'));
						}
					},
					freeze: true,
					freeze_message: __("Fetching records......")
				});
			}
			else{
				fd.available_slots.html("");
			}
		});
	}
	else{
		fd.available_slots.html("Appointment date and Healthcare Practitioner are Mandatory".bold());
	}
}
function exists_appointment(patient, practitioner, appointment_date, callback) {
	frappe.call({
		method: "erpnext.healthcare.utils.exists_appointment",
		args:{
			appointment_date: appointment_date,
			practitioner: practitioner,
			patient: patient
		},
		callback: function(data) {
			if(data.message){
				var message  = __("Appointment is already booked on {0} for {1} with {2}, Do you want to book another appointment on this day?",
					[appointment_date.bold(), patient.bold(), practitioner.bold()]);
				frappe.confirm(
					message,
					function(){
						callback(true);
					},
					function(){
						frappe.show_alert({
							message:__("Select new date and slot to book appointment if you wish."),
							indicator:'yellow'
						});
						callback(false);
					}
				);
			}
			else{
				callback(true);
			}
		}
	});
}
}
frappe.ui.form.on('Inpatient Record Procedure',{
	procedure: function(frm, cdt, cdn){
		frappe.model.set_value(cdt, cdn, "source", frm.doc.source);
		frappe.model.set_value(cdt, cdn, "referring_practitioner", frm.doc.referring_practitioner);
		set_total_standard_selling_rate(frm)
	},
	standard_selling_rate:function(frm){
		set_total_standard_selling_rate(frm)
	},
});
var set_total_standard_selling_rate = function(frm){
	var total_amount=0
	for (var i in frm.doc.inpatient_record_procedure) {
		var item = frm.doc.inpatient_record_procedure[i];
		if(item.standard_selling_rate ){
			total_amount=total_amount+item.standard_selling_rate
		}
	}
	frm.set_value("total_standard_selling_rate", total_amount)
};

frappe.ui.form.on('Inpatient Record Procedure',{
	inpatient_record_procedure_add: function(frm, cdt, cdn){
		frappe.model.set_value(cdt, cdn, "practitioner", frm.doc.primary_practitioner);
		frappe.model.set_value(cdt, cdn, "secondary_practitioner", frm.doc.secondary_practitioner);
	}
});
