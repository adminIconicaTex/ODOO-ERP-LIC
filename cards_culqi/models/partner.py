# -*- coding: utf-8 -*-
from odoo import api, fields, models, _

class res_partner(models.Model):
    _inherit = 'res.partner'    

    id_culqi = fields.Char("Culqi Customer ID")