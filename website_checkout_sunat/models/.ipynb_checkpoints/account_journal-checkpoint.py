# -*- coding: utf-8 -*-

from odoo import models, fields, api

class account_journal(models.Model):
    _inherit = "account.journal"

    document_type = fields.Many2one("l10n_latam.identification.type", 'Tipo Documento')
    document_type_internal = fields.Many2one("l10n_latam.document.type", 'Tipo Documento Interno')