# -*- coding: utf-8 -*-
from odoo import api, fields, models, _

class sale_order(models.Model):
    _inherit = 'sale.order'

    culqi_response = fields.Html( string="Culqi")
    culqi_json_response = fields.Text( string="JSON Culqi Response")
    id_culqi = fields.Char("Culqi Order ID")

    # Card Info
    culqi_response = fields.Html(string="Culqi")
    culqi_type = fields.Char(string="Tipo")
    culqi_card_brand = fields.Char(string="Marca de Tarjeta")
    culqi_card_type = fields.Char(string="Tipo de Tarjeta")
    culqi_card_number = fields.Char(string="Número")
    culqi_card_category = fields.Char(string="Categoria")

    # Issuer
    culqi_issuer_name =  fields.Char(string="Compañia emisora")
    culqi_outcome_merchant_type = fields.Char(string="Mensaje para el vendedor")
    culqi_outcome_merchant_message = fields.Char(string="Mensaje para el vendedor")

    def action_post(self):
        response = super(sale_order, self).action_post()
        