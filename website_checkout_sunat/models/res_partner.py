# -*- coding: utf-8 -*-

from odoo import models, fields, api

class res_partner(models.Model):
    _inherit = "res.partner"

    @api.constrains('vat', 'country_id')
    def check_vat(self):
        if( str(self.country_id.code) == str('PE') ):
            return
        else:
            return super(res_partner, self).check_vat()