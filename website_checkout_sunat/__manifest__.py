# -*- coding: utf-8 -*-
{
    'name': "website_checkout_sunat",
    'summary': """Agrega campos para la Sunat y establece información del contribuyente quien compra como cliente empresa, particular o bien anonimo.""",
    'description':  """
                        
                    """,
    'author': "JAGR",
    'website': "https://api.whatsapp.com/send?phone=573128097090",
    'category': 'Uncategorized',
    'version': '15.0',
    'depends': [
                    'base',
                    'account',
                    'base_vat',
                    'l10n_pe',
                    'l10n_latam_base',
                    'web',
                    'point_of_sale',
                    'website',
               ],
    'data': [
                'views/l10n_latam_identification_type.xml',
                'views/contact/res_partner.xml',
                'views/website/address_checkout.xml',
                'views/account/journal.xml',
            ],
    'assets': {
                    'web.assets_frontend': [
                                            '/website_checkout_sunat/static/src/js/jquery.js',
                                            '/website_checkout_sunat/static/src/js/frontend.js',
                                            '/website_checkout_sunat/static/src/css/frontend.css'
                                           ]
              },
    'external_dependencies': {
                                'python' : ['requests'],
                             },
}