# -*- coding: utf-8 -*-

from odoo import models, fields, api
import logging
_logger = logging.getLogger(__name__)

class sale_order(models.Model):
    _inherit = "sale.order"

    def _create_invoices(self, grouped=False, final=False, date=None):
        moves =  super(sale_order, self)._create_invoices(grouped=grouped, final=final, date=date)
        if(moves):
            _type = str("DNI")
            if( str(self.partner_id.l10n_latam_identification_type_id.name) == str('RUC') ):
                _type = str("RUC")
            document_type = self.env['l10n_latam.identification.type'].sudo().search([['name','=',str(_type)]], limit=1)
            _logger.warning('_prepare_invoice document_type')
            _logger.warning(document_type.name)
            if(document_type):
                journal = self.env['account.journal'].sudo().search([['document_type','=',int(document_type.id)]], limit=1)
                _logger.warning('_prepare_invoice journal')
                _logger.warning(journal.name)
                if(journal):
                    for move in moves:
                        _logger.warning('_prepare_invoice move journal')
                        _logger.warning({'journal_id':int(journal.id)})
                        move.sudo().update({
                                                'journal_id':int(journal.id),
                                                'l10n_latam_document_type_id':int(journal.document_type_internal.id),
                                            })
                        _logger.warning('_prepare_invoice move read')
                        _logger.warning( move.read() )


    def _prepare_invoice(self):
        values =  super(sale_order, self)._prepare_invoice()
        _logger.warning('_prepare_invoice values')
        _logger.warning(values)
        partner = self.env['res.partner'].sudo().browse(int(values['partner_id']))
        _logger.warning('_prepare_invoice partner')
        _logger.warning(str(partner.l10n_latam_identification_type_id.name))
        if( str(partner.l10n_latam_identification_type_id.name) == str('RUC') ):
            document_type = self.env['l10n_latam.identification.type'].sudo().search([['name','=',str('RUC')]], limit=1)
            _logger.warning('_prepare_invoice document_type')
            _logger.warning(document_type.name)
            if(document_type):
                journal = self.env['account.journal'].sudo().search([['document_type','=',int(document_type.id)]], limit=1)
                _logger.warning('_prepare_invoice journal')
                _logger.warning(journal.name)
                if(journal):
                    values['journal_id'] = int(journal.id)
        if( str(partner.l10n_latam_identification_type_id.name) == str('DNI') ):
            document_type = self.env['l10n_latam.identification.type'].sudo().search([['name','=',str('DNI')]], limit=1)
            _logger.warning('_prepare_invoice document_type')
            _logger.warning(document_type.name)
            if(document_type):
                journal = self.env['account.journal'].sudo().search([['document_type','=',int(document_type.id)]], limit=1)
                _logger.warning('_prepare_invoice journal')
                _logger.warning(journal.name)
                if(journal):
                    values['journal_id'] = int(journal.id)
        _logger.warning('_prepare_invoice POST values')
        _logger.warning(values)
        return values


class ProductPricelist(models.Model):
    _inherit = "product.pricelist"

    def _check_website_pricelist(self):
        super(ProductPricelist, self)._check_website_pricelist()