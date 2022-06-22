# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request
from odoo.addons.website_checkout_sunat.models.peruvian_document_validator import peruvian_document_validator

import logging
_logger = logging.getLogger(__name__)


class peruvian_document(http.Controller):

    @http.route(['/validators/document_type'], type='json', auth='public', methods=['POST'], website=True)
    def get_document_type(self, **post):
        _type = post.get('document_type')
        _number = post.get('document_number')
        validator = peruvian_document_validator()
        entity = None
        _logger.warning('************************')
        _logger.warning('get_document_type')
        _logger.warning(_type)
        _logger.warning(_number)
        _logger.warning('************************')
        if(_type=="ruc"):
            entity = validator.get_by_ruc(_number)
        elif(_type=="dni"):
            entity = validator.get_by_dni(_number)
        else:
            entity = None
        return entity