// Copyright (c) 2016, ESS LLP and contributors
// For license information, please see license.txt

frappe.ui.form.on('Patient Encounter', {
	setup: function(frm) {
		frm.get_field('drug_prescription').grid.editable_fields = [
			{fieldname: 'drug_code', columns: 2},
			{fieldname: 'drug_name', columns: 2},
			{fieldname: 'dosage', columns: 2},
			{fieldname: 'period', columns: 2}
		];
		frm.get_field('lab_test_prescription').grid.editable_fields = [
			{fieldname: 'lab_test_code', columns: 2},
			{fieldname: 'lab_test_name', columns: 4},
			{fieldname: 'lab_test_comment', columns: 4}
		];
	},

	refresh: function(frm) {
		refresh_field('drug_prescription');
		refresh_field('lab_test_prescription');
		if (!frm.doc.__islocal && frm.doc.docstatus == 1){
			frappe.call({
				method: 'frappe.client.get_value',
				args: {
					doctype: 'Patient',
					fieldname: 'inpatient_status',
					filters: {name: frm.doc.patient}
				},
				callback: function(data) {
					if(data.message && data.message.inpatient_status == "Admission Scheduled" || data.message.inpatient_status == "Admitted"){
						frm.add_custom_button(__('Order Discharge'), function() {
							schedule_discharge(frm);
						});
					}
					else if(data.message.inpatient_status != "Discharge Scheduled"){
						frm.add_custom_button(__('Order Admission'), function() {
							schedule_inpatient(frm);
						});
					}
				}
			});
		}
		frm.add_custom_button(__('Patient History'), function() {
			if (frm.doc.patient) {
				frappe.route_options = {"patient": frm.doc.patient};
				frappe.set_route("patient_history");
			} else {
				frappe.msgprint(__("Please select Patient"));
			}
		},"View");
		frm.add_custom_button(__('Vital Signs'), function() {
			btn_create_vital_signs(frm);
		},"Create");
		frm.add_custom_button(__('Medical Record'), function() {
			create_medical_record(frm);
		},"Create");

		frm.add_custom_button(__("Procedure"),function(){
			btn_create_procedure(frm);
		},"Create");

		frm.set_query("patient", function () {
			return {
				filters: {"disabled": 0}
			};
		});
		frm.set_query("drug_code", "drug_prescription", function() {
			return {
				filters: {
					is_stock_item:'1'
				}
			};
		});
		frm.set_query("lab_test_code", "lab_test_prescription", function() {
			return {
				filters: {
					is_billable:'1'
				}
			};
		});
		frm.set_query("medical_code", "codification_table", function() {
			return {
				filters: {
					medical_code_standard: frappe.defaults.get_default("default_medical_code_standard")
				}
			};
		});
		frm.set_query("appointment", function() {
			return {
				filters: {
					//	Scheduled filter for demo ...
					status:['in',["Open","Scheduled"]]
				}
			};
		});
		frm.set_df_property("appointment", "read_only", frm.doc.__islocal ? 0:1);
		frm.set_df_property("patient", "read_only", frm.doc.__islocal ? 0:1);
		frm.set_df_property("patient_age", "read_only", frm.doc.__islocal ? 0:1);
		frm.set_df_property("patient_sex", "read_only", frm.doc.__islocal ? 0:1);
		frm.set_df_property("type", "read_only", frm.doc.__islocal ? 0:1);
		frm.set_df_property("practitioner", "read_only", frm.doc.__islocal ? 0:1);
		frm.set_df_property("visit_department", "read_only", frm.doc.__islocal ? 0:1);
		frm.set_df_property("encounter_date", "read_only", frm.doc.__islocal ? 0:1);
		frm.set_df_property("encounter_time", "read_only", frm.doc.__islocal ? 0:1);
	}
});

var schedule_inpatient = function(frm) {
	var dialog = new frappe.ui.Dialog({
		title: 'Admission Order',
		fields: [
			{fieldtype: "Link", label: "Medical Department", fieldname: "medical_department", options: "Medical Department", reqd: 1},
			{fieldtype: "Link", label: "Healthcare Practitioner (Primary)", fieldname: "primary_practitioner", options: "Healthcare Practitioner", reqd: 1},
			{fieldtype: "Link", label: "Healthcare Practitioner (Secondary)", fieldname: "secondary_practitioner", options: "Healthcare Practitioner"},
			{fieldtype: "Small Text", label: "Diagnosis", fieldname: "diagnosis"},
			{fieldtype: 'Column Break'},
			{fieldtype: "Date", label: "Admission Ordered For", fieldname: "admission_ordered_for", default: "Today"},
			{fieldtype: "Link", label: "Service Unit Type", fieldname: "service_unit_type", options: "Healthcare Service Unit Type"},
			{fieldtype: "Int", label: "Expected Length of Stay", fieldname: "expected_length_of_stay"},
			{fieldtype: "Small Text", label: "Admission Instruction", fieldname: "admission_instruction"},
			{fieldtype: 'Section Break', label: "Procedure Orders"},
			{fieldtype: 'HTML', fieldname: 'procedure_prescriptions'}
		],
		primary_action_label: __("Order"),
		primary_action : function(){
			var args = {
				patient: frm.doc.patient,
				encounter_id: frm.doc.name,
				ref_practitioner: frm.doc.practitioner,
				medical_department: dialog.get_value('medical_department'),
				primary_practitioner: dialog.get_value('primary_practitioner'),
				secondary_practitioner: dialog.get_value('secondary_practitioner'),
				diagnosis: dialog.get_value('diagnosis'),
				admission_ordered_for: dialog.get_value('admission_ordered_for'),
				service_unit_type: dialog.get_value('service_unit_type'),
				expected_length_of_stay: dialog.get_value('expected_length_of_stay'),
				admission_instruction: dialog.get_value('admission_instruction'),
				chief_complaint: frm.doc.symptoms || ''
			}
			frappe.call({
				method: "erpnext.healthcare.doctype.inpatient_record.inpatient_record.schedule_inpatient",
				args: {
					args: args
				},
				callback: function(data) {
					if(!data.exc){
						frm.reload_doc();
					}
				},
				freeze: true,
				freeze_message: "Process Inpatient Scheduling"
			});
			frm.refresh_fields();
			dialog.hide();
		}
	});

	dialog.set_values({
		'medical_department': frm.doc.visit_department,
		'primary_practitioner': frm.doc.practitioner,
		'diagnosis': frm.doc.diagnosis
	});

	show_procedure_prescriptions(dialog)

	dialog.fields_dict["service_unit_type"].get_query = function(){
		return {
			filters: {
				"inpatient_occupancy": 1,
				"allow_appointments": 0
			}
		};
	};

	dialog.show();
	dialog.$wrapper.find('.modal-dialog').css("width", "800px");

	function show_procedure_prescriptions(dialog) {
		if(frm.doc.procedure_prescription.length > 0){
			var $wrapper = dialog.fields_dict.procedure_prescriptions.$wrapper;
			var procedure_prescriptions = "<div class='col-md-12 col-sm-12 text-muted'>";
			var procedure_rx_html = null;
			var table_head = null;
			var table_row = null;
			table_head = '<tr> \
				<th>Procedure</th> \
				<th>Practitioner</th> \
				<th>Date</th> \
				<th style="width:50%">Comments</th> \
			</tr>'
			$.each(frm.doc.procedure_prescription, function(index, data_object){
				var procedure_comment = "";
				if(data_object.comments){
					procedure_comment = data_object.comments
				}
				if(table_row == null){
					table_row = '<tr> \
						<td>'+data_object.procedure+'</td> \
						<td>'+data_object.practitioner+'</td> \
						<td>'+data_object.date+'</td> \
						<td>'+procedure_comment+'</td> \
					</tr>'
				}else{
					table_row = table_row + '<tr> \
						<td>'+data_object.procedure+'</td> \
						<td>'+data_object.practitioner+'</td> \
						<td>'+data_object.date+'</td> \
						<td>'+procedure_comment+'</td> \
					</tr>'
				}
			});
			procedure_rx_html = '<table class="table table-condensed \
				bordered">' + table_head +  table_row + '</table> <br/> <hr/>'

			procedure_prescriptions = procedure_prescriptions + procedure_rx_html + "</div>"
			$wrapper
				.css('margin-bottom', 0)
				.html(procedure_prescriptions);
		}
	}
};

var schedule_discharge = function(frm) {
	var dialog = new frappe.ui.Dialog({
		title: 'Discharge Order',
		fields: [
			{fieldtype: "Link", label: "Medical Department", fieldname: "medical_department", options: "Medical Department", read_only: 1},
			{fieldtype: "Link", label: "Healthcare Practitioner", fieldname: "discharge_practitioner", options: "Healthcare Practitioner", read_only: 1},
			{fieldtype: "Date", label: "Discharge Ordered", fieldname: "discharge_ordered", default: "Today"},
			{fieldtype: "Date", label: "Followup Date", fieldname: "followup_date"},
			{fieldtype: 'Column Break'},
			{fieldtype: "Small Text", label: "Discharge Instruction", fieldname: "discharge_instruction"},
			{fieldtype: 'Section Break'},
			{fieldtype: 'Column Break', label:'Discharge Summary Print'},
			{fieldtype: "Check", label: "Chief Complaint", fieldname: "include_chief_complaint"},
			{fieldtype: "Check", label: "Diagnosis", fieldname: "include_diagnosis"},
			{fieldtype: "Check", label: "Medication", fieldname: "include_medication"},
			{fieldtype: "Check", label: "Investigations", fieldname: "include_investigations"},
			{fieldtype: "Check", label: "Procedures", fieldname: "include_procedures"},
			{fieldtype: "Check", label: "Occupancy Details", fieldname: "include_occupancy_details"},
			{fieldtype: 'Column Break'},
			{fieldtype: "Long Text", label: "Discharge Note", fieldname: "discharge_note"},
		],
		primary_action_label: __("Order"),
		primary_action : function(){
			var args = {
				patient: frm.doc.patient,
				encounter_id: frm.doc.name,
				discharge_practitioner: frm.doc.practitioner,
				medical_department: frm.doc.visit_department,
				discharge_ordered: dialog.get_value('discharge_ordered'),
				followup_date: dialog.get_value('followup_date'),
				discharge_instruction: dialog.get_value('discharge_instruction'),
				discharge_note: dialog.get_value('discharge_note'),
				include_chief_complaint: dialog.get_value('include_chief_complaint'),
				include_diagnosis: dialog.get_value('include_diagnosis'),
				include_medication: dialog.get_value('include_medication'),
				include_investigations: dialog.get_value('include_investigations'),
				include_procedures: dialog.get_value('include_procedures'),
				include_occupancy_details: dialog.get_value('include_occupancy_details')
			}
			frappe.call({
				method: "erpnext.healthcare.doctype.inpatient_record.inpatient_record.schedule_discharge",
				args: {args},
				callback: function(data) {
					if(!data.exc){
						frm.reload_doc();
					}
				},
				freeze: true,
				freeze_message: "Process Discharge"
			});
			frm.refresh_fields();
			dialog.hide();
		}
	});

	dialog.set_values({
		'medical_department': frm.doc.visit_department,
		'discharge_practitioner': frm.doc.practitioner
	});

	dialog.show();
	dialog.$wrapper.find('.modal-dialog').css("width", "800px");
};

var create_medical_record = function (frm) {
	if(!frm.doc.patient){
		frappe.throw(__("Please select patient"));
	}
	frappe.route_options = {
		"patient": frm.doc.patient,
		"status": "Open",
		"reference_doctype": "Patient Medical Record",
		"reference_owner": frm.doc.owner
	};
	frappe.new_doc("Patient Medical Record");
};

var btn_create_vital_signs = function (frm) {
	if(!frm.doc.patient){
		frappe.throw(__("Please select patient"));
	}
	frappe.route_options = {
		"patient": frm.doc.patient,
		"appointment": frm.doc.appointment
	};
	frappe.new_doc("Vital Signs");
};

var btn_create_procedure = function (frm) {
	if(!frm.doc.patient){
		frappe.throw("Please select patient");
	}
	frappe.route_options = {
		"patient": frm.doc.patient,
		"medical_department": frm.doc.visit_department
	};
	frappe.new_doc("Clinical Procedure");
};

frappe.ui.form.on("Patient Encounter", "appointment", function(frm){
	if(frm.doc.appointment){
		frappe.call({
			"method": "frappe.client.get",
			args: {
				doctype: "Patient Appointment",
				name: frm.doc.appointment
			},
			callback: function (data) {
				frappe.model.set_value(frm.doctype,frm.docname, "patient", data.message.patient);
				frappe.model.set_value(frm.doctype,frm.docname, "type", data.message.appointment_type);
				frappe.model.set_value(frm.doctype,frm.docname, "practitioner", data.message.practitioner);
				frappe.model.set_value(frm.doctype,frm.docname, "invoiced", data.message.invoiced);
			}
		});
	}
	else{
		frappe.model.set_value(frm.doctype,frm.docname, "patient", "");
		frappe.model.set_value(frm.doctype,frm.docname, "type", "");
		frappe.model.set_value(frm.doctype,frm.docname, "practitioner", "");
		frappe.model.set_value(frm.doctype,frm.docname, "invoiced", 0);
	}
});

frappe.ui.form.on("Patient Encounter", "practitioner", function(frm) {
	if(frm.doc.practitioner){
		frappe.call({
			"method": "frappe.client.get",
			args: {
				doctype: "Healthcare Practitioner",
				name: frm.doc.practitioner
			},
			callback: function (data) {
				frappe.model.set_value(frm.doctype,frm.docname, "visit_department",data.message.department);
			}
		});
	}
});

frappe.ui.form.on("Patient Encounter", "symptoms_select", function(frm) {
	if(frm.doc.symptoms_select){
		var symptoms = null;
		if(frm.doc.symptoms)
			symptoms = frm.doc.symptoms + "\n" +frm.doc.symptoms_select;
		else
			symptoms = frm.doc.symptoms_select;
		frappe.model.set_value(frm.doctype,frm.docname, "symptoms", symptoms);
		frappe.model.set_value(frm.doctype,frm.docname, "symptoms_select", null);
	}
});
frappe.ui.form.on("Patient Encounter", "diagnosis_select", function(frm) {
	if(frm.doc.diagnosis_select){
		var diagnosis = null;
		if(frm.doc.diagnosis)
			diagnosis = frm.doc.diagnosis + "\n" +frm.doc.diagnosis_select;
		else
			diagnosis = frm.doc.diagnosis_select;
		frappe.model.set_value(frm.doctype,frm.docname, "diagnosis", diagnosis);
		frappe.model.set_value(frm.doctype,frm.docname, "diagnosis_select", null);
	}
});

frappe.ui.form.on("Patient Encounter", "patient", function(frm) {
	if(frm.doc.patient){
		frappe.call({
			"method": "erpnext.healthcare.doctype.patient.patient.get_patient_detail",
			args: {
				patient: frm.doc.patient
			},
			callback: function (data) {
				var age = "";
				if(data.message.dob){
					age = calculate_age(data.message.dob);
				}
				frappe.model.set_value(frm.doctype,frm.docname, "patient_age", age);
				frappe.model.set_value(frm.doctype,frm.docname, "patient_sex", data.message.sex);
			}
		});
	}
});

frappe.ui.form.on("Drug Prescription", {
	drug_code:  function(frm, cdt, cdn) {
		var child = locals[cdt][cdn];
		if(child.drug_code){
			frappe.call({
				"method": "frappe.client.get",
				args: {
					doctype: "Item",
					name: child.drug_code,
				},
				callback: function (data) {
					frappe.model.set_value(cdt, cdn, 'drug_name',data.message.item_name);
				}
			});
		}
	},
	dosage: function(frm, cdt, cdn){
		frappe.model.set_value(cdt, cdn, 'update_schedule', 1);
		var child = locals[cdt][cdn];
		if(child.dosage){
			frappe.model.set_value(cdt, cdn, 'in_every', 'Day');
			frappe.model.set_value(cdt, cdn, 'interval', 1);
		}
	},
	period: function(frm, cdt, cdn){
		frappe.model.set_value(cdt, cdn, 'update_schedule', 1);
	},
	in_every: function(frm, cdt, cdn){
		frappe.model.set_value(cdt, cdn, 'update_schedule', 1);
		var child = locals[cdt][cdn];
		if(child.in_every == "Hour"){
			frappe.model.set_value(cdt, cdn, 'dosage', null);
		}
	}
});

frappe.ui.form.on("Procedure Prescription", {
	procedure:  function(frm, cdt, cdn) {
		var child = locals[cdt][cdn];
		if(child.procedure){
			frappe.call({
				"method": "frappe.client.get_value",
				args: {
					doctype: "Clinical Procedure Template",
					fieldname: "medical_department",
					filters: {name: child.procedure}
				},
				callback: function (data) {
					frappe.model.set_value(cdt, cdn, 'department',data.message.medical_department);
				}
			});
		}
	}
});


var calculate_age = function(birth) {
	var ageMS = Date.parse(Date()) - Date.parse(birth);
	var age = new Date();
	age.setTime(ageMS);
	var years =  age.getFullYear() - 1970;
	return  years + " Year(s) " + age.getMonth() + " Month(s) " + age.getDate() + " Day(s)";
};
