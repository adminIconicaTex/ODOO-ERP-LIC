# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request

import logging
_logger = logging.getLogger(__name__)

class address_checkout(http.Controller):

    @http.route(['/selections/partner_document_types'], type='json', auth='public', methods=['POST'], website=True)
    def partner_document_types(self, fields, domain, partner_id=None):
        can_create = request.env['l10n_latam.identification.type'].sudo().check_access_rights('create', raise_exception=False)
        read_results = request.env['l10n_latam.identification.type'].sudo().search_read(domain, fields)
        response = {
                    'read_results': read_results,
                    
                    'can_create': can_create,
                   }
        if(partner_id):
            default_partner = request.env['res.partner'].browse(int(partner_id))            
            try:
                _logger.warning('default_partner')
                _logger.warning(default_partner.read())
                response['default_type'] = {'id': default_partner.l10n_latam_identification_type_id.id, 'name':default_partner.l10n_latam_identification_type_id.name},
            except:
                pass
            
        return  response

    @http.route(['/selections/get_countries'], type='json', auth='public', methods=['POST'], website=True)
    def get_countries(self, fields, domain):
        can_create = request.env['res.country'].sudo().check_access_rights('create', raise_exception=False)
        read_results = request.env['res.country'].sudo().search_read(domain, fields)
        return  {
                    'read_results': read_results,
                    'can_create': can_create,
                }

    @http.route(['/selections/location/cities'], type='json', auth='public', methods=['POST'], website=True)
    def get_location_cities(self, fields, domain):
        can_create = request.env['res.city'].sudo().check_access_rights('create', raise_exception=False)
        read_results = request.env['res.city'].sudo().search_read(domain, fields)
        return  {
                    'read_results': read_results,
                    'can_create': can_create,
                }

    @http.route(['/selections/location/districts'], type='json', auth='public', methods=['POST'], website=True)
    def get_location_districts(self, fields, domain):
        can_create = request.env['l10n_pe.res.city.district'].sudo().check_access_rights('create', raise_exception=False)
        read_results = request.env['l10n_pe.res.city.district'].sudo().search_read(domain, fields)
        return  {
                    'read_results': read_results,
                    'can_create': can_create,
                }
    
    @http.route(['/selections/partner/get'], type='json', auth='public', methods=['POST'], website=True)
    def get_partner(self, fields, domain):
        can_create = request.env['res.partner'].sudo().check_access_rights('create', raise_exception=False)
        _logger.warning("get_partner domain")
        _logger.warning(domain)
        read_results = request.env['res.partner'].sudo().search_read(domain, fields)
        _logger.warning(read_results)
        return  {
                    'read_results': read_results,
                    'can_create': can_create,
                }

    @http.route(['/selections/any_default'], type='json', auth='public', methods=['POST'], website=True)
    def get_any_default(self, fields, domain, _model=None, _limit=1):
        return  request.env[str(_model)].sudo().search_read(domain, fields, limit=_limit)