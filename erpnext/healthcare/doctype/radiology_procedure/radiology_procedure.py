# -*- coding: utf-8 -*-
# Copyright (c) 2019, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document
from erpnext.healthcare.utils import create_item_from_doc, update_item_from_doc, on_trash_doc_having_item_reference

class RadiologyProcedure(Document):
	def validate(self):
		update_item_from_doc(self, self.procedure_name)

	def after_insert(self):
		create_item_from_doc(self, self.procedure_name)

	def on_trash(self):
		on_trash_doc_having_item_reference(self)
@frappe.whitelist()
def replace_abbr(name, old, new):
	new = new.strip()
	if not new:
		frappe.throw(_("Abbr can not be blank or space"))

	frappe.only_for("System Manager")

	frappe.db.set_value("Radiology Procedure", name, "abbr", new)