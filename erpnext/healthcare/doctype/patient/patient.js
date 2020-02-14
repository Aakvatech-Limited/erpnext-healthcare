// Copyright (c) 2016, ESS LLP and contributors
// For license information, please see license.txt

frappe.ui.form.on('Patient', {
	refresh: function (frm) {
		frm.set_query("patient", "patient_relation", function () {
			return {
				filters: [
					["Patient", "name", "!=", frm.doc.name]
				]
			};
		});
		frm.set_query('account', 'receivable_account', function(doc, cdt, cdn) {
			var d  = locals[cdt][cdn];
			return {
				filters: {
					'account_type': 'Receivable',
					'company': d.company,
					'is_group': 0
				}
			};
		});
		frappe.dynamic_link = {doc: frm.doc, fieldname: 'name', doctype: 'Patient'};
		if(!frm.is_new()) {
			frappe.contacts.render_address_and_contact(frm);
		}
		if (frappe.defaults.get_default("patient_master_name") != "Naming Series") {
			frm.toggle_display("naming_series", false);
		} else {
			erpnext.toggle_naming_series();
		}
		if (frappe.defaults.get_default("collect_registration_fee") && frm.doc.disabled == 1) {
			frm.add_custom_button(__('Invoice Patient Registration'), function () {
				btn_invoice_registration(frm);
			});
		}
		if(!frm.doc.__islocal && frm.doc.inpatient_record){
			frm.add_custom_button(__("IP Record"), function(){
				if(frm.doc.inpatient_record){
					frappe.set_route("Form", "Inpatient Record", frm.doc.inpatient_record);
				}
			});
		}
		if (frm.doc.patient_name && frappe.user.has_role("Physician")) {
			frm.add_custom_button(__('Patient History'), function () {
				frappe.route_options = { "patient": frm.doc.name };
				frappe.set_route("patient_history");
			},"View");
		}
		if (!frm.doc.__islocal && (frappe.user.has_role("Nursing User") || frappe.user.has_role("Physician"))) {
			frm.add_custom_button(__('Vital Signs'), function () {
				btn_create_vital_signs(frm);
			}, "Create");
			frm.add_custom_button(__('Medical Record'), function () {
				create_medical_record(frm);
			}, "Create");
			frm.add_custom_button(__('Patient Encounter'), function () {
				btn_create_encounter(frm);
			}, "Create");
		}
		frappe.call({
			method: "get_billing_info",
			doc: frm.doc,
			callback: function(r) {
				frm.dashboard.add_indicator(__('Total Billing: {0}', [format_currency(r.message.total_billing)]), 'blue');
				frm.dashboard.add_indicator(__('Patient Balance: {0}', [format_currency(r.message.party_balance)]), 'orange');
			}
		});
	},
	onload: function (frm) {
		if(!frm.doc.dob){
			$(frm.fields_dict['age_html'].wrapper).html("");
		}
		if(frm.doc.dob){
			$(frm.fields_dict['age_html'].wrapper).html("AGE : " + get_age(frm.doc.dob));
		}
	},
	validate: function (frm) {
		set_barcode(frm);
	}
});

var set_barcode = function(frm) {
	var cur_doc = frm.doc;
	$(frm.fields_dict['barcode_image'].wrapper).html('<svg id="code128"></svg>');
	$.getScript("https://cdn.jsdelivr.net/npm/jsbarcode@3.9.0/dist/JsBarcode.all.min.js", function( data, textStatus, jqxhr ) {
		JsBarcode("#code128", cur_doc.name, {
					background: "#FFFFFF",
					height:"20",
					width:"1"
		});
		var svg = $('#code128').parent().html();
		frappe.model.set_value(cur_doc.doctype, cur_doc.name, "barcode_svg", svg);
	});
};

frappe.ui.form.on("Patient", "dob", function(frm) {
	if(frm.doc.dob) {
		var today = new Date();
		var birthDate = new Date(frm.doc.dob);
		if(today < birthDate){
			frappe.msgprint(__("Please select a valid Date"));
			frappe.model.set_value(frm.doctype,frm.docname, "dob", "");
		}
		else{
			var age_str = get_age(frm.doc.dob);
			$(frm.fields_dict['age_html'].wrapper).html("AGE : " + age_str);
		}
	}
	else {
		$(frm.fields_dict['age_html'].wrapper).html("");
	}
});

var create_medical_record = function (frm) {
	frappe.route_options = {
		"patient": frm.doc.name,
		"status": "Open",
		"reference_doctype": "Patient Medical Record",
		"reference_owner": frm.doc.owner
	};
	frappe.new_doc("Patient Medical Record");
};

var get_age = function (birth) {
	var ageMS = Date.parse(Date()) - Date.parse(birth);
	var age = new Date();
	age.setTime(ageMS);
	var years = age.getFullYear() - 1970;
	return years + " Year(s) " + age.getMonth() + " Month(s) " + age.getDate() + " Day(s)";
};

var btn_create_vital_signs = function (frm) {
	if (!frm.doc.name) {
		frappe.throw(__("Please save the patient first"));
	}
	frappe.route_options = {
		"patient": frm.doc.name,
	};
	frappe.new_doc("Vital Signs");
};

var btn_create_encounter = function (frm) {
	if (!frm.doc.name) {
		frappe.throw(__("Please save the patient first"));
	}
	frappe.route_options = {
		"patient": frm.doc.name,
	};
	frappe.new_doc("Patient Encounter");
};

var btn_invoice_registration = function (frm) {
	frappe.call({
		doc: frm.doc,
		method: "invoice_patient_registration",
		callback: function(data){
			if(!data.exc){
				if(data.message.invoice){
					/* frappe.show_alert(__('Sales Invoice {0} created',
					['<a href="#Form/Sales Invoice/'+data.message.invoice+'">' + data.message.invoice+ '</a>'])); */
					frappe.set_route("Form", "Sales Invoice", data.message.invoice);
				}
				cur_frm.reload_doc();
			}
		}
	});
};

frappe.ui.form.on('Patient Relation', {
	patient_relation_add: function(frm){
		frm.fields_dict['patient_relation'].grid.get_field('patient').get_query = function(doc){
			var patient_list = [];
			if(!doc.__islocal) patient_list.push(doc.name);
			$.each(doc.patient_relation, function(idx, val){
				if (val.patient) patient_list.push(val.patient);
			});
			return { filters: [['Patient', 'name', 'not in', patient_list]] };
		};
	}
});
