// Copyright (c) 2019, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Insurance Assignment', {
	refresh: function(frm) {
	},
	insurance_company: function(frm){
		if(frm.doc.insurance_company){
			frappe.call({
				"method": "frappe.client.get_value",
				args: {
					doctype: "Insurance Contract",
					filters: {
						'insurance_company': frm.doc.insurance_company,
						'is_active':1,
						'end_date':[">=", frappe.datetime.nowdate()],
						'docstatus':1
					},
					fieldname: ['name']
				},
				callback: function (data) {
					if(!data.message){
						frappe.msgprint(__("There is no valid contract with this Insurance Company {0}",[frm.doc.insurance_company]));
						frm.set_value("insurance_company", "");
						frm.set_value("insurance_company_name", "");
					}
				}
			});
		}
	},
	patient: function(frm){
		if(frm.doc.patient){
			frappe.call({
				"method": "frappe.client.get",
				args: {
					doctype: "Patient",
					name: frm.doc.patient
				},
				callback: function (data) {
					frm.set_value("patient_name", data.message.patient_name);
					frm.set_value("gender", data.message.sex);
					frm.set_value("mobile_number", data.message.mobile);
					if(data.message.dob){
						$(frm.fields_dict['age_html'].wrapper).html("AGE : " + get_age(data.message.dob));
					}
					frm.refresh_fields()
				}
			});
		}
	},
	plan_name: function(frm){
		if(frm.doc.plan_name){
			frappe.call({
				"method": "frappe.client.get",
				args: {
					doctype: "Insurance plan",
					name: frm.doc.plan_name
				},
				callback: function (data) {
					frm.set_value("coverage", data.message.coverage);
					if(data.message.ip_coverage){
						frm.set_value("ip_coverage", data.message.ip_coverage);
					}
					frm.refresh_fields()
				}
			});
		}
	}
});
var get_age = function (birth) {
	var ageMS = Date.parse(Date()) - Date.parse(birth);
	var age = new Date();
	age.setTime(ageMS);
	var years = age.getFullYear() - 1970;
	return years + " Year(s) " + age.getMonth() + " Month(s) " + age.getDate() + " Day(s)";
};
