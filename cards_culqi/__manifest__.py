# -*- coding: utf-8 -*-
{
    'name': 'Culqi Tarjetas - Website Checkout',
    'description': "Recibe pagos con tarjetas a través del sitio web de comercio electrónico en divisa PEN & USD",
    'author': "ROCKSCRIPTS",
    'website': "http://instagram.com/rockscripts",
    'summary': "Culqi para sitio web de comercio electrónico",
    'version': '0.1',
    "license": "OPL-1",
    'price':'100',
    'currency':'USD',
    'support': 'rockscripts@gmail.com',
    'category': 'Website',
    "images": ["images/banner.png"],
    'depends': [    
                    'base',
                    'account',
                    'sale', 
                    'sale_management',
                    'web',
                    'website',
                    'website_sale',
                    'payment'
                ],
    'data': [
                'views/payment_acquirer.xml',
                'views/sale_order.xml',
                'views/payment_transaction.xml',
                'views/partner.xml',
                'data/culqi.xml',
            ],
    'assets':  {
                    'web.assets_frontend': [                                                
                                                '/cards_culqi/static/src/js/culqi.js',
                                                '/cards_culqi/static/src/css/culqi.css'
                                            ],
                    'web.assets_common': [
                                            '/cards_culqi/static/src/js/jquery.js',
                                            '/cards_culqi/static/src/js/swal.js'
                                         ]
                },
    'qweb': [
              
            ],
    'external_dependencies': {
                                'python' : ['culqi'],
                             },
    'installable': True,
}