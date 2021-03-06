# -*- coding: utf-8 -*-
from odoo import fields, models, _

class payment_acquirer_culqi(models.Model):
    _inherit = 'payment.acquirer'    

    provider = fields.Selection(selection_add=[('culqi', 'Culqi')], ondelete={'culqi': 'cascade'})

    culqi_public_key = fields.Char(string='Clave Publica para Pruebas')
    culqi_private_key = fields.Char(string='Clave Privada para Pruebas')

    culqi_public_key_produccion = fields.Char(string='Clave Publica para Producción')
    culqi_private_key_produccion = fields.Char(string='Clave Privada para Producción')

    autoconfirm_invoice = fields.Boolean(string='¿Autoconfirmar factura?', default=True)
    autoconfirm_payment = fields.Boolean(string='¿Autoconfirmar pago contable?', default=True)