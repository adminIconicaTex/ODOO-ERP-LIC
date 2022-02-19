# -*- coding: utf-8 -*-
# from odoo import http


# class CardsCulqi(http.Controller):
#     @http.route('/cards_culqi/cards_culqi/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/cards_culqi/cards_culqi/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('cards_culqi.listing', {
#             'root': '/cards_culqi/cards_culqi',
#             'objects': http.request.env['cards_culqi.cards_culqi'].search([]),
#         })

#     @http.route('/cards_culqi/cards_culqi/objects/<model("cards_culqi.cards_culqi"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('cards_culqi.object', {
#             'object': obj
#         })
