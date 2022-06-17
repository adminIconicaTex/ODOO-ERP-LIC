# -*- coding: utf-8 -*-

from odoo import models, fields, api
import logging
_logger = logging.getLogger(__name__)

class pos_order(models.Model):
    _inherit = "pos.order"

    def _create_invoice(self, move_vals):        

        _logger.warning('_create_invoice move_vals')
        _logger.warning(move_vals)

        _type = str("DNI")
        if( str(self.partner_id.l10n_latam_identification_type_id.name) == str('RUC') ):
            _type = str("RUC")

        _logger.warning('_create_invoice _type')
        _logger.warning(_type)

        document_type = self.env['l10n_latam.identification.type'].sudo().search([['name','=',str(_type)]], limit=1)       

        _logger.warning('_create_invoice document_type')
        _logger.warning(document_type)

        if(document_type):
            journal = self.env['account.journal'].sudo().search([['document_type','=',int(document_type.id)]], limit=1)    

            _logger.warning('_create_invoice journal')
            _logger.warning(journal)

            if(journal):
                move_vals['journal_id'] = int(journal.id)

        new_move = super(pos_order, self)._create_invoice(move_vals)

        _type = str("DNI")
        if( str(self.partner_id.l10n_latam_identification_type_id.name) == str('RUC') ):
            _type = str("RUC")

        _logger.warning('_create_invoice _type')
        _logger.warning(_type)

        document_type = self.env['l10n_latam.identification.type'].sudo().search([['name','=',str(_type)]], limit=1)       

        _logger.warning('_create_invoice document_type')
        _logger.warning(document_type)

        if(document_type):
            journal = self.env['account.journal'].sudo().search([['document_type','=',int(document_type.id)]], limit=1)    

            _logger.warning('_create_invoice journal')
            _logger.warning(journal)

            if(journal):
                document_type = self.env['l10n_latam.identification.type'].sudo().search([['name','=',str(_type)]], limit=1)       
                new_move.sudo().update({
                                                        'l10n_latam_document_type_id':int(journal.document_type_internal.id),
                                                    })

        _logger.warning('_create_invoice document_type 002')
        _logger.warning(document_type)

        return new_move