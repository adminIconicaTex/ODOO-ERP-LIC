# -*- coding: utf-8 -*-
from odoo import api, fields, models, _

class payment_transaction(models.Model):
    _inherit = 'payment.transaction'

    culqi_response = fields.Html( string="Culqi")
    id_culqi = fields.Char("Culqi Order ID")
    culqi_response = fields.Html( string="Culqi")
    culqi_type = fields.Char( string="Tipo")
    culqi_card_brand = fields.Char( string="Marca de Tarjeta")
    culqi_card_type = fields.Char( string="Tipo de Tarjeta")
    culqi_card_number = fields.Char( string="Número")
    culqi_card_category = fields.Char( string="Categoria")
    culqi_issuer_name =  fields.Char( string="Compañia emisora")
    culqi_outcome_merchant_type = fields.Char( string="Mensaje para el vendedor")
    culqi_outcome_merchant_message = fields.Char( string="Mensaje para el vendedor")    