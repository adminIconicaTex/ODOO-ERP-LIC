# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
import json
import sys
import datetime
from odoo.http import request

class payment_acquirer_culqi(models.Model):
    _inherit = 'payment.acquirer'    

    provider = fields.Selection(selection_add=[('culqi', 'Culqi')], ondelete={'culqi': 'cascade'})
    # custom
    culqi_public_key = fields.Char(string='Clave Publica')
    culqi_private_key = fields.Char(string='Clave Privada')

    culqi_public_key_produccion = fields.Char(string='Clave Publica')
    culqi_private_key_produccion = fields.Char(string='Clave Privada')

    autoconfirm_invoice = fields.Boolean(string='¿Autoconfirmar factura?', default=True)
    autoconfirm_payment = fields.Boolean(string='¿Autoconfirmar pago contable?', default=True)