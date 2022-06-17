# -*- coding: utf-8 -*-

from odoo import models, fields, api

class l10n_latam_identification_type(models.Model):
    _inherit = "l10n_latam.identification.type"

    webcheckout_is_default = fields.Boolean(string="Por defecto en direcciones")