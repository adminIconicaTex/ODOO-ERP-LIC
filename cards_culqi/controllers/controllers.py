"""
Copyright 2020 Jhon Alexander Grisales Rivera
@ Colombia
@ +57 3128097090
@ rockscripts@gmail.com
git config --global user.email "rockscripts@gmail.com"
git config --global user.name "Alex Grisales"
"""
# -*- coding: utf-8 -*-

from odoo import http
from odoo.http import request
import werkzeug
from werkzeug import urls
from culqi.client import Culqi
from culqi.resources import Charge
from culqi.resources import Customer
from uuid import uuid4
import logging
_logger = logging.getLogger(__name__)

import os, hashlib, decimal, datetime, re, json, math, sys, re, time


class culqi_controller(http.Controller):
    formsPath = str(os.path.dirname(os.path.abspath(__file__))).replace("controllers","")

    def get_partner_relation_culqi_id(self, id_odoo):
        partner = http.request.env['res.partner'].sudo().browse(int(id_odoo))
        return partner.id_culqi

    def add_partner_relation(self, id_odoo, id_culqi):
        partner = http.request.env['res.partner'].sudo().browse(int(id_odoo))
        query = "update res_partner set id_culqi = '"+str(id_culqi)+"' where id = " + str(partner.id)
        request.cr.execute(query) 
        #partner.sudo().update({'id_culqi':id_culqi})
    
    def get_order_relation_culqi_id(self, id_odoo):
        order = http.request.env['sale.order'].sudo().browse(int(id_odoo))
        return order.id_culqi
    
    def add_order_relation(self, id_odoo, id_culqi):
        order = http.request.env['sale.order'].sudo().browse(int(id_odoo))
        query = "update sale_order set id_culqi = '"+str(id_culqi)+"' where id = " + str(order.id)
        request.cr.execute(query) 
        #order.sudo().update({'id_culqi':id_culqi})
    
    def get_partner_relation_email_id_culqi(self, email):
        _logger.warning("PARTNER")
        partners = http.request.env['res.partner'].sudo().search([("email","=",email)])
        for _partner in partners:
            if(_partner.id_culqi):
                return _partner
        return False


    @http.route('/culqi/process_culqi_payment/',  methods=['POST'], type='json', auth="public", website=True)    
    def process_culqi_payment(self, **kw):
        _response = {}
        params = {}
        params['culqi_preference'] = kw.get('culqi_preference')
        params['checkout_items'] = kw.get('checkout_items')
        
        params['token'] = kw.get('token')
        params['customer'] = kw.get('customer')
        params['enviroment'] = kw.get('enviroment')
        params['odoo_order_id'] = kw.get('odoo_order_id')
        params['acquirer_id'] = kw.get('acquirer_id')
        params['amount_total'] = kw.get('amount_total')
        base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')

        query = "select autoconfirm_invoice, autoconfirm_payment, name, website_id,company_id, state,  provider, culqi_public_key, culqi_public_key_produccion, culqi_private_key, culqi_private_key_produccion from payment_acquirer where provider = 'culqi' limit 1"
        request.cr.execute(query)
        acquirer = request.cr.dictfetchone()
        
        if('website_id' in acquirer):
            if(acquirer['website_id']):        
                query = "select id, domain from website where id = " + str(acquirer['website_id'])
                request.cr.execute(query)
                _website = request.cr.dictfetchone()
                if(_website):
                    if(len(_website['domain'])>0):
                        base_url = _website['domain']
                
        if(_website):
            if(int(_website['id'])>0):                       
                _website = request.env['website'].sudo().browse(int())        

        culqi = None

        if(acquirer['state']=='enabled'):            
            culqi = Culqi(str(acquirer['culqi_public_key_produccion']), str(acquirer['culqi_private_key_produccion']))
        if(acquirer['state']=='test'):
            culqi = Culqi(str(acquirer['culqi_public_key']), str(acquirer['culqi_private_key']))
        
        charge = Charge(client=culqi)
        customer = Customer(client=culqi)
        
        order_number = str(params['culqi_preference']['title']).format(uuid4().hex[:4])

        customer_name = re.sub("[^a-zA-Z]+", "", str(params['customer']['name']))

        millis = int(round(time.time() * 1000)) + int(604800000)

        odoo_order = request.env['sale.order'].sudo().browse(params['odoo_order_id'])

        _codes = []
        _currency_code = None
        for _line in odoo_order.order_line:
            _currency_code = _line.currency_id.name  
            if(len(_codes)>0):
                if(_currency_code in _codes):
                    pass
                else:
                    _codes.append(_currency_code)
                    response = {}
                    response['url_send'] = str(base_url) + str("/shop/payment?state=fail") + str("&message=") + str("La divisa debe ser unica para lineas del pedido ")
                    return response

        state_name = "no definida"
        if(params['customer']['state_name']):
            state_name = params['customer']['state_name']
        else:
            params['customer']['state_name'] = state_name

        _logger.warning("PARAMS CHARGE")
        _logger.warning(params)

        params_customer = {
                    "address":str(params['customer']['street'])[:99],
                    "address_city": state_name,
                    "country_code": params['customer']['country_code'],
                    "email": params['customer']['email'],
                    "first_name": str(customer_name)[:50],
                    "last_name": "not defined",
                    "phone_number": params['customer']['mobile'] if (params['customer']['mobile']) else params['customer']['phone'],
                 }
        
        numeric_filter = filter(str.isdigit, params_customer["phone_number"])
        params_customer["phone_number"] = "".join(numeric_filter)

        _logger.warning("process_culqi_payment params")
        _logger.warning(params_customer)

        res_customer = customer.create(params_customer)

        _logger.warning(str('CUSTOMER'))
        _logger.warning(res_customer)
        if('error' in res_customer['data']["object"]):
                response = {}
                response['url_send'] = str(base_url) + str("/shop/payment?state=fail") + str("&message=") + str(res_customer['data']['merchant_message'])
                if('Un cliente esta registrado actualmente con este email.' in str(res_customer['data']['merchant_message'])):
                    _partner = self.get_partner_relation_email_id_culqi(params['customer']['email'])
                    _logger.warning("GOT PARTNER AFTER EMAIL ERROR")
                    _logger.warning(_partner)
                    if(_partner):
                        self.add_partner_relation(params['customer']['id'], _partner.id_culqi)
                    pass
                else:
                    return response
                
        _customer = None
        
        try:
            # add culqi id to odoo customer 
                                      #@id:  odoo customer id   #@ culqi customer id 
            self.add_partner_relation(params['customer']['id'], res_customer['data']['id'])  
        except:
            _logger.warning(str('122 ERROR'))
            pass

        if(int(res_customer['status']) == 400):                                          
            culqi_customer_id = self.get_partner_relation_culqi_id(params['customer']['id'])
            #if(not culqi_customer_id):
                #if(_partner):
                #    culqi_customer_id = _partner.id_culqi
            if(culqi_customer_id):
                if(len(culqi_customer_id)>0):
                    res_customer = customer.read(culqi_customer_id) 
                else:
                    culqi_customer_id = self.get_partner_relation_culqi_id(params['customer']['id'])                 
            else:                    
                culqi_customer_id = self.get_partner_relation_culqi_id(params['customer']['id'])
            
            try:
                _customer = res_customer['data']
                _customer_id = res_customer['data']['id']
            except:
                culqi_customer_id = self.get_partner_relation_culqi_id(params['customer']['id'])
                _customer_id = culqi_customer_id
                pass

        else:
            try:
                _customer = res_customer['data']
                _customer_id = res_customer['data']['id']
            except:
                pass

        try:  
            metadatada = {
                            "metadata": {
                                            "order_name":str(order_number),
                                            "customer_id": str(_customer_id),
                                            "customer_name":str(customer_name)[:50],
                                            "indentification":str(params['customer']['vat'])
                                        }
                        }

            customer.update(id_=_customer_id, data=metadatada)
        except:
                pass
        
        params['culqi_preference'] = kw.get('culqi_preference')
        params['customer'] = kw.get('customer')
        params['token'] = kw.get('token')
        params['enviroment'] = kw.get('enviroment')
        params['odoo_order_id'] = kw.get('odoo_order_id')
        params['acquirer_id'] = kw.get('acquirer_id')
        
        # validate with id stored in odoo to optimize algorithm 
        new_charge = {
                        "title": str(order_number),
                        "order_number": str(order_number),                                        
                        "amount": params['culqi_preference']['amount'],
                        "capture": True,
                        "currency_code": _currency_code,
                        "description": params['culqi_preference']['description'],
                        "email":  params['customer']['email'],
                        "first_name": customer_name,
                        "address": params['customer']['street'],
                        "address_city": state_name,
                        "phone_number": params['customer']['mobile'] if (params['customer']['mobile']) else params['customer']['phone'],
                        "country_code": params['customer']['country_code'],
                        "installments": 0,
                        "source_id": params['token'],
                        "metadata": {
                                        "order_name":str(order_number),
                                        "customer_id": str(_customer_id),
                                        "customer_name":str(customer_name)[:50],
                                        "indentification":str(params['customer']['vat'])
                                    }
                    }
        
        res_charge = charge.create(new_charge)
          
        if(res_charge['data']["object"] == "error"):
                response = {}
                response['url_send'] = str(base_url) + str("/shop/payment?state=fail" + str("&message=") + str(res_charge['data']['merchant_message']))   
                return response

        if(int(res_charge['status']) == 400):
            
            pass
        else:
            charge.update(id_=res_charge['data']['id'], data=new_charge['metadata']) 
            #sale_order_transaction_rel = request.env['sale.order.transaction.rel'].sudo().search(['sale_order_id','=',params['odoo_order_id']])
            query = "select transaction_id from sale_order_transaction_rel where sale_order_id = " + str(params['odoo_order_id']) + " order by transaction_id desc limit 1"
            request.cr.execute(query)
            sale_order_transaction_rel = request.cr.dictfetchall()
            if(sale_order_transaction_rel):
                for rel in sale_order_transaction_rel:
                    odoo_transaction = request.env['payment.transaction'].sudo().browse(rel['transaction_id'])
                    _logger.warning("++++++++++++++++++++++++++++++++++++")
                    _logger.warning(params['acquirer_id'])
                    _logger.warning(odoo_transaction.acquirer_id)
                    _logger.warning("++++++++++++++++++++++++++++++++++++")
                    if (int(odoo_transaction.acquirer_id) == int(params['acquirer_id'])):
                        odoo_payment_transaction = odoo_transaction.sudo().update({     'state_message':str(res_charge['data']['outcome']['merchant_message']),
                                                                                        'culqi_response':str(res_charge['data']),
                                                                                        'culqi_type':str(res_charge['data']['source']['type']),
                                                                                        'culqi_card_number':str(res_charge['data']['source']['card_number']),
                                                                                        'culqi_card_category':str(res_charge['data']['source']['iin']['card_category']),
                                                                                        'culqi_card_brand':str(res_charge['data']['source']['iin']['card_brand']),
                                                                                        'culqi_card_type':str(res_charge['data']['source']['iin']['card_type']),
                                                                                        'culqi_outcome_merchant_type':str(res_charge['data']['outcome']['type']),
                                                                                        'culqi_outcome_merchant_message':str(res_charge['data']['outcome']['merchant_message']),
                                                                                        'id_culqi':str(res_charge['data']['id']),
                                                                                    })

                        if(str(res_charge['data']['outcome']['type'])=="venta_exitosa"):
                            query = "update payment_transaction set state = '"+str('done')+"' where id = " + str(odoo_transaction.id)
                            request.cr.execute(query) 
                    
            else:    
                odoo_payment_transaction = request.env['payment.transaction'].sudo().create({
                                                                                                'partner_id':params['customer']['id'],
                                                                                                'partner_name':str(customer_name)[:50],
                                                                                                'date':datetime.datetime.now(),
                                                                                                'acquirer_id':int(params['acquirer_id']),
                                                                                                'type':'form',
                                                                                                'state':'done',
                                                                                                'amount':params['amount_total'],
                                                                                                'reference':str(order_number) + str("/") + str(uuid4())[:5],
                                                                                                'currency_id':params['checkout_items'][0]['currency_id_id'],
                                                                                                'culqi_response':str(res_charge['data']),
                                                                                                'culqi_type':str(res_charge['data']['source']['type']),
                                                                                                'culqi_card_number':str(res_charge['data']['source']['card_number']),
                                                                                                'culqi_card_category':str(res_charge['data']['source']['iin']['card_category']),
                                                                                                'culqi_card_brand':str(res_charge['data']['source']['iin']['card_brand']),
                                                                                                'culqi_card_type':str(res_charge['data']['source']['iin']['card_type']),
                                                                                                'culqi_outcome_merchant_type':str(res_charge['data']['outcome']['type']),
                                                                                                'culqi_outcome_merchant_message':str(res_charge['data']['outcome']['merchant_message']),
                                                                                                'state_message':str(res_charge['data']['outcome']['merchant_message']),   
                                                                                                'id_culqi':str(res_charge['data']['id']),                                                                                             
                                                                                            })
                                                                                            
                query = "insert into  sale_order_transaction_rel (transaction_id, sale_order_id) values ("+ str(odoo_payment_transaction.id) +", "+ str(params['odoo_order_id']) +")"
                request.cr.execute(query)
                #request.env['sale.order.transaction.rel'].sudo().create({'sale_order_id':params['odoo_order_id'],'transaction_id':odoo_payment_transaction.id})

                if(str(res_charge['data']['outcome']['type'])=="venta_exitosa"):
                    query = "update payment_transaction set state = '"+str('done')+"' where id = " + str(odoo_payment_transaction.id)
                    request.cr.execute(query) 
                
        odoo_order = request.env['sale.order'].sudo().browse(params['odoo_order_id'])
        odoo_order.sudo().update({
                                    'id_culqi':str(res_charge['data']['id']),
                                    'culqi_response':str(res_charge['data']),
                                    'culqi_type':str(res_charge['data']['source']['type']),
                                    'culqi_card_number':str(res_charge['data']['source']['card_number']),
                                    'culqi_card_category':str(res_charge['data']['source']['iin']['card_category']),
                                    'culqi_card_brand':str(res_charge['data']['source']['iin']['card_brand']),
                                    'culqi_card_type':str(res_charge['data']['source']['iin']['card_type']),
                                    'culqi_outcome_merchant_type':str(res_charge['data']['outcome']['type']),
                                    'culqi_outcome_merchant_message':str(res_charge['data']['outcome']['merchant_message']),
                                 })
                                 
        
        if(str(res_charge['data']['outcome']['type'])=="venta_exitosa"):
            odoo_order.sudo().update({'state':str("sale")})
            odoo_order.action_confirm()
            odoo_order._send_order_confirmation_mail()

            try:
                setting = {}
                setting['automatic_invoice'] = True
                query = "select automatic_invoice from res_config_settings where company_id = " + str(request.website.company_id.id)
                request.cr.execute(query)
                setting = request.cr.dictfetchone()
                _logger.warning('_setting -> automatic_invoice')
                _logger.warning(setting)
                if(not setting):
                    setting = {}
                    setting['automatic_invoice'] = True
                    setting['autoconfirm_payment'] = True

                if( setting ):
                    if( bool( setting['automatic_invoice'] ) ):
                        invoices = self.autogenerate_invoice(odoo_order)
                        if(invoices):
                            # do after create invoices..
                            _logger.warning('invoices')
                            _logger.warning(invoices)
                            if( 'autoconfirm_invoice' in acquirer ):
                                autoconfirm_invoice = acquirer['autoconfirm_invoice']
                                if( bool(autoconfirm_invoice) ):
                                    _logger.warning("Autoconfirm invoice exec")
                                    self.autoconfirm_invoice(odoo_order)
                                    if( 'autoconfirm_payment' in acquirer ):
                                        autoconfirm_payment = acquirer['autoconfirm_invoice']
                                        if( bool(autoconfirm_payment) ):
                                            self.autoconfirm_payment(odoo_order)
                                            pass
                                    pass
            except Exception as e:
                exc_traceback = sys.exc_info()
                _logger.warning(getattr(e, 'message', repr(e))+" ON LINE "+format(sys.exc_info()[-1].tb_lineno)) 

            uid = http.request.env.context.get('uid')
            if (not uid):
                _logger.warning("URL1")
                _response['url_send'] = str(base_url) + str("/shop/confirmation") + str("?state=" + str(res_charge['data']['outcome']['type']) + str("&message=") + str(res_charge['data']['outcome']['merchant_message']))
            else:
                if(odoo_order.require_payment):
                    _logger.warning("URL2")
                    _response['url_send'] = str(base_url) + str("/my/orders/") + str(odoo_order.id) + str("?state=done&message=") + str(res_charge['data']['outcome']['merchant_message'])
                else:
                    _logger.warning("URL3")
                    _response['url_send'] = str(base_url) + str("/shop/confirmation?state=done") + str("&message=") + str(res_charge['data']['outcome']['merchant_message'])
            request.website.sale_reset()
            #return werkzeug.utils.redirect("/shop/confirmation?state=done")
        else:
            if (not uid):
                _logger.warning("URL4")
                _response['url_send'] = str(base_url) + str("/web/login/") + str("?state=" + str(res_charge['data']['outcome']['type']) + str("&message=") + str(res_charge['data']['outcome']['merchant_message']))
            else:            
                if(odoo_order.require_payment):
                    _logger.warning("URL5")
                    _response['url_send'] = str(base_url) + str("/my/orders/") + str(odoo_order.id) + str("?state=" + str(res_charge['data']['outcome']['type']) + str("&message=") + str(res_charge['data']['outcome']['merchant_message']))
                else:
                    _logger.warning("URL6")
                    _response['url_send'] = str(base_url) + str("&state=" + str(res_charge['data']['outcome']['type']) + str("&message=") + str(res_charge['data']['outcome']['merchant_message']))

        _response['res_charge'] = res_charge
        _response['_customer'] = _customer
        _response['token'] = kw.get('token')
        _response['culqi_preference'] = params['culqi_preference']

        _logger.warning("proces_payment_response")
        _logger.warning(_response)

        return _response

        # status 400
        # ['data']['merchant_message']
    
    def autogenerate_invoice(self, order):
        if order:
            invoices = order.sudo()._create_invoices()
            return invoices
        else:
            return None  

    def autoconfirm_payment(self, order, acquirer=None):
        try:
            if order:
                i=0
                last_transaction = None
                for transaction in order.sudo().transaction_ids:
                    if(i==0):
                        last_transaction = request.env['payment.transaction'].sudo().browse(int(transaction.id))

                _logger.warning('order.last_transaction')
                _logger.warning(order.transaction_ids)
                _logger.warning(last_transaction)
                if(last_transaction):
                    if(last_transaction.acquirer_id):
                        _logger.warning('order.last_transaction.provider')
                        _logger.warning(last_transaction.acquirer_id.provider)
                        if(last_transaction.acquirer_id.provider == 'culqi'):
                            _logger.warning('order.invoice_ids')
                            _logger.warning(order.invoice_ids)
                            if(order.invoice_ids):
                                _logger.warning('pay_and_reconcile')                                
                                for invoice in order.invoice_ids:
                                    _logger.warning(invoice.journal_id.name)
                                    _logger.warning(invoice.name)
                                    invoice = request.env['account.move'].sudo().browse(int(invoice.id))
                                    invoice.sudo().pay_and_reconcile(invoice.journal_id, invoice.amount_total)
                        else:
                            raise Warning("La transacción "+str(last_transaction.name)+" no es de Culqi")
                else:
                    raise Warning("El pedido no tiene una transacción adjunta.")                
        except Exception as e:
                exc_traceback = sys.exc_info()
                _logger.warning(getattr(e, 'message', repr(e))+" ON LINE "+format(sys.exc_info()[-1].tb_lineno))


    def get_journal_currency(self):
        pass      
    
    def autoconfirm_invoice(self, order):
        try:
            _logger.warning('order')
            _logger.warning(order)
            if order:
                if(order.invoice_ids):
                    _logger.warning('order.invoice_ids')
                    _logger.warning(order.invoice_ids)
                    for invoice in order.invoice_ids:
                        invoice = request.env['account.move'].sudo().browse(int(invoice.id))
                        invoice.sudo().action_post()
        except Exception as e:
                exc_traceback = sys.exc_info()
                _logger.warning(getattr(e, 'message', repr(e))+" ON LINE "+format(sys.exc_info()[-1].tb_lineno))
    
    def search_customer(self, customers_response, email):
        customers = None
        customer = None
        if(customers_response['status'] == '200'):
            customers = customers_response['data']['items']
            for customer in customers:
                if(str(customer['email'])==str(email)):
                    return customer
        else:
            return customer

    @http.route('/culqi/get_culqi_acquirer/', methods=['POST'], type='json', auth="public", website=True)
    def get_culqi_acquirer(self, **kw):       
        response = {"acquirer":None,"form_bill":None}                
        query = "select name, website_id,company_id, state,  provider, culqi_public_key, culqi_public_key_produccion from payment_acquirer where provider = 'culqi' limit 1"
        request.cr.execute(query)    
        acquirer = request.cr.dictfetchone()        
        response = {"acquirer":acquirer}
        return response
    
        
    @http.route('/culqi/get_sale_order/', methods=['POST'], type='json', auth="public", website=True)
    def get_sale_order(self, **kw): 
        params = {}
        params['acquirer_id'] = kw.get('acquirer_id')
        params['partner_id'] = kw.get('partner_id')
        params['online_payment'] = kw.get('online_payment')
                       
        query = "select id, name, website_id,company_id, state,  provider, culqi_public_key, culqi_public_key_produccion from payment_acquirer where provider = 'culqi' limit 1"
        request.cr.execute(query)
        acquirer = request.cr.dictfetchone()

        if(params['acquirer_id']!=acquirer['id']):
            params['acquirer_id'] = acquirer['id']
         
        environment = acquirer['state']
        if(params['online_payment']=="no"):
            query = "select id, name, amount_total, amount_tax, date_order, partner_shipping_id from sale_order where partner_id = '"+str(params['partner_id'])+"' and state = '"+str('draft')+"' order by date_order desc limit 1"
        if(params['online_payment']=="yes"):
            query = "select id, name, amount_total, amount_tax, date_order, partner_shipping_id from sale_order where partner_id = '"+str(params['partner_id'])+"' and state = '"+str('sent')+"' and require_payment = True order by date_order desc limit 1"
        _logger.warning("ORDER_ID")
        _logger.warning(query)
        request.cr.execute(query)    
        draft_order = request.cr.dictfetchone() 

        product_titles = str("")
        separator = str("\n")
                  
       
        query = "select res_partner.id, res_partner.name, res_partner.vat, res_partner.phone, res_partner.mobile, res_partner.email, res_partner.street, res_partner.city, res_partner.zip, res_partner.lang, res_country.name as country_name, res_country.code as country_code, res_country_state.name as state_name, res_currency.name as currency_name, res_currency.symbol as currency_symbol from res_partner left join res_country on res_country.id = res_partner.country_id left join res_country_state on res_country_state.id = res_partner.state_id left join res_currency on res_country.currency_id = res_currency.id   where res_partner.id = '"+str(draft_order['partner_shipping_id'])+"' limit 1"
        request.cr.execute(query)    
        res_partner_shipping = request.cr.dictfetchone()
  
        if(draft_order):                                   
            order_name = str(datetime.datetime.now())
            order_name = re.sub('[^0-9]','', order_name)
            order_name = order_name[-9:]
            millis = int(round(time.time() * 1000)) + int(604800000)
            draft_order['name'] = draft_order['name'] + str(uuid4().hex[:3])
            
            # base url
            query = "select value from ir_config_parameter where key = 'web.base.url' limit 1"
            request.cr.execute(query)
            ir_config_parameter = request.cr.dictfetchone()
            base_url = ir_config_parameter['value']

            _logger.warning("ORDER_DRAFT")
            _logger.warning(draft_order)

            draft_order_lines = http.request.env['sale.order.line'].sudo().search([['order_id','=',draft_order["id"]]])   
            checkout_items = []
            checkout_taxes = []
            _logger.warning("ORDER_LINES")
            _logger.warning(draft_order_lines)
            for order_line in draft_order_lines:
                product_titles = str(product_titles) + str(order_line.name) + separator
                checkout_item = {
                                    "title":order_line.name,
                                    "quantity":order_line.product_uom_qty,
                                    "currency_id":order_line.currency_id.name,
                                    "currency_id_id":order_line.currency_id.id,
                                    "unit_price":int(math.ceil(order_line.price_total))
                                }
                checkout_items.append(checkout_item)
                #product_taxes = http.request.env['product.taxes.rel'].sudo().search([['prod_id','=',order_line.product_id.id]])
                query = "select tax_id from product_taxes_rel where prod_id = " + str(order_line.product_id.id)
                request.cr.execute(query)
                product_taxes = request.cr.dictfetchall()

                for product_tax in product_taxes:
                    taxes_details = http.request.env['account.tax'].sudo().search([['id','=',product_tax['tax_id']]])  
                     
                    if(int(taxes_details.amount)>0):
                        tax = {"type":"iva","value":int(taxes_details.amount)}
                        if(checkout_taxes.__len__()>0):
                            for tax_added in checkout_taxes:   
                                if(int(tax_added["value"])!=int(taxes_details.amount)):
                                    checkout_taxes.append(tax)
                        else:
                            checkout_taxes.append(tax)

            jsonPreference = str("")
            return {
                        'status' :  "OK",
                        'environment':environment,                        
                        'json_preference':draft_order,
                        'product_lines':str(product_titles)[:75],
                        'customer':res_partner_shipping,
                        'checkout_items':checkout_items,
                        'currency_name':checkout_items[0]['currency_id'],
                        'acquirer_id':params['acquirer_id'],
                    }