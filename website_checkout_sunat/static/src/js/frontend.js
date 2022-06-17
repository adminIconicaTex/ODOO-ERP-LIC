odoo.define('website_checkout_sunat.checkout', function (require) {
    'use strict';

    var publicWidget = require('web.public.widget');
    var rpc = require('web.rpc');
    var Dialog = require('web.Dialog');
    const core = require("web.core");
    const _t = core._t;

    publicWidget.Widget.include({
        init: function (parent, action) {
            var self = this;
            this._super(parent, action);
        },
        start: function () {
            this.init_form();
            return this._super.apply(this, arguments);
        },
        init_form: function () {
            var self = this;

            var div_vat = setInterval(function () {
                if ($('div.div_vat').length  == 2) {
                    $('div.div_vat').last().remove();     
                    clearInterval(div_vat);
                }
            }, 2);

            /**
             * Start document type for sunat with default document types module
             */
            var params = {
                '_selector': $('input#l10n_latam_identification_type_id'),
                '_route': '/selections/partner_document_types',
                '_fields': ['id', 'name'],
                '_domain': [],
                '_multiple': false,
            };

            var l10n_latam_identification_type_id = setInterval(function () {
                if (params['_selector'].length > 0) {

                    self._start_any_select2_003(params);
                    clearInterval(l10n_latam_identification_type_id);
                    self.set_default_document_type();
                }
            }, 2);

            /**
             * Start default country (Perú)
             */
            var country_id = setInterval(function () {
                if ($('select#country_id').length > 0) {

                    self.start_country_id('PE');
                    clearInterval(country_id);
                }
            }, 2);

            /**
             * Validations for Document Number for Sunat
             */
            var vat = setInterval(function () {
                if ($('input[name=vat]').length > 0) {
                    $("input[name=vat]").off('keypress');
                    $('input[name=vat]').on('keypress', function () {
                        self.validate_vat('keypress');
                    });
                    $("input[name=vat]").off('blur');
                    $('input[name=vat]').on('blur', function () {
                        self.validate_vat('blur');
                    });
                    clearInterval(vat);
                }
            }, 2);

            var address_validation = setInterval(function () {
                if ($('div.div_city').length > 0 || $('div.div_zip').length > 0) {
                    self.hide_unecesary_elements();
                    clearInterval(address_validation);
                }
            }, 2);

            /**
             * Events for country, state, province and district
             */
            var state_id = setInterval(function () {
                if ($('select[name=state_id]').length > 0) {

                    $("select[name=state_id]").off('change');
                    $("select[name=state_id]").unbind('change');
                    $('select[name=state_id]').on('change', function () {

                        var country_id = $('select[name=country_id]').val();
                        var state_id = $('select[name=state_id]').val();

                        // for states
                        var params = {
                            '_selector': $('input#city_id'),
                            '_route': '/selections/location/cities',
                            '_fields': ['id', 'name'],
                            '_domain': [['country_id', '=', parseInt(country_id)], ['state_id', '=', parseInt(state_id)]],
                            '_multiple': false,
                            '_limit': 1,
                            '_model': 'res.city'
                        }
                        self._start_any_select2_003(params);
                        self.set_any_default(params);

                        $('input[name=city]').val($("select[name=state_id] option:selected").val());
                    });                    

                    clearInterval(state_id);
                }
            }, 2);


            var l10n_pe_district = setInterval(function () {
                if ($('input#city_id').length > 0) {
                    $('input#city_id').off('change');
                    $('input#city_id').unbind('change');
                    $('input#city_id').on('change', function () {
                        // for districts
                        var city_id = $("input#city_id").val();
                        var params = {
                            '_selector': $('input#l10n_pe_district'),
                            '_route': '/selections/location/districts',
                            '_fields': ['id', 'name'],
                            '_domain': [['city_id', '=', parseInt(city_id)]],
                            '_multiple': false,
                            '_limit': 1,
                            '_model': 'l10n_pe.res.city.district'
                        }
                        self._start_any_select2_003(params);
                        self.set_any_default(params);
                    });
                    clearInterval(l10n_pe_district);
                }
            }, 2);

            $("input[name=l10n_latam_identification_type_id]").off('change');
            $('input[name=l10n_latam_identification_type_id]').on('change', function () {
                var l10n_latam_identification_type_id_data = $('input#l10n_latam_identification_type_id').select2('data');
                var dt_name = null;
                if (l10n_latam_identification_type_id_data) {
                    dt_name = l10n_latam_identification_type_id_data.text;
                }
                if (String(dt_name) == "RUC" || String(dt_name) == "DNI") {
                    $('input[name=vat]').attr('type', 'number');
                }
                else {
                    $('input[name=vat]').attr('type', 'text');
                }
            });

            $('input#l10n_pe_district').off('change');
            $('input#l10n_pe_district').on('change', function () {
                self.set_zip_code();
            });           

            var default_state_timer = setInterval(function () {
                if ($('select[name=state_id] option').length > 1) {
                    var state_id = $('select[name=state_id] option:eq(1)').val();
                    var state_name = $('select[name=state_id] option:eq(1)').text();
                    if (String(state_name) != String("Amazonas")) {
                        var state_id = $('select[name=state_id] option:eq(1)').val();
                        $("select[name=state_id]").val(state_id);
                    }
                    else {
                        $("select[name=state_id]").val($("select[name=state_id] option:first").val());
                    }

                    $("select[name=state_id]").trigger('change');
                    clearInterval(default_state_timer);
                }
            }, 2);

            var default_partner_id = setInterval(function () {
            var partner_id = $("input[name=partner_id]").val();            
            try
            {                
                if( parseInt(partner_id) > 0 )
                {
                    var params = {
                        '_selector': $('input[name=zip]'),
                        '_route': '/selections/partner/get',
                        '_fields': [
                                        'id', 
                                        'name', 
                                        'state_id', 
                                        'city_id', 
                                        'l10n_pe_district', 
                                        'country_id', 
                                        'zip'
                                    ],
                        '_domain': [ 
                                        [ 'id', '=', parseInt(partner_id) ] 
                                    ],
                    };
                    self.set_default_location(params);
                    clearInterval(default_partner_id);
                }
            }
            catch(error)
            {console.log(error)}
                            
        }, 2);  
            
        },
        set_any_default: function (params) {
            rpc.query({

                route: params['_route'],
                params: {
                    fields: params['_fields'],
                    domain: params['_domain'],
                    _limit: params['_limit'],
                }
            }).then(function (data) {
                if (data) {
                    if (data.read_results) {
                        var read_results = data.read_results;
                        if (read_results.length > 0) {
                            var id = read_results[0].id;
                            var name = read_results[0].name;
                            params['_selector'].select2('data', { id: id, text: name, create: false }, false);
                            params['_selector'].trigger('change')
                        }
                    }
                }
            });
        },
        hide_unecesary_elements: function () {
            $('div.div_zip').hide();
            $('div.div_city').hide();
        },
        webservice_search_document: function (document_type, document_number) {
            var self = this;
            var l10n_latam_identification_type_id_data = $('input#l10n_latam_identification_type_id').select2('data')
            var dt_name = null;
            if (l10n_latam_identification_type_id_data) {
                dt_name = l10n_latam_identification_type_id_data.text;
                dt_name = String(dt_name).toLowerCase();
            }
            rpc.query({
                route: '/validators/document_type',
                params: {
                    'document_type': document_type,
                    'document_number': document_number
                }
            }).then(function (entity) {
                if (entity) {
                    if(!entity.error)
                    {
                        if(entity.data)
                        {
                            if(entity.data.nombre)
                            {
                                var name = entity.data.nombre;
                                $('input[name=name]').val(name);
                            }
                            if(entity.data.nombre_comercial)
                            {
                                var legal_name = entity.data.nombre_comercial;
                                $('input[name=company_name]').val(legal_name);
                            }
                            if(entity.data.street)
                            {
                                var street = entity.data.street;
                                $('input[name=street]').val(street);
                            }                        
                            if(entity.data.ubigeo)
                            {
                                var zip = entity.data.ubigeo;
                                $('input[name=zip]').val(zip);
                            }
                            if(entity.data.domicilio_fiscal)
                            {
                                var address = entity.data.domicilio_fiscal;
                                $('input[name=street]').val(address);
                            }
                            
                            self.start_country_id('PE');      
                            
                            if(entity.data.ubigeo)
                            {
                                var zip = entity.data.ubigeo;
                                var params = {
                                    '_selector': $('input#l10n_pe_district'),
                                    '_route': '/selections/location/districts',
                                    '_fields': ['id', 'name', 'code'],
                                    '_domain': [['code', '=', String(zip)]],
                                    '_code': zip
                                }
                                self.set_location_by_district_code(params);
                            }
                        }
                    }
                }
            });
        },
        set_default_location: function(params)
        {
            var self = this;
            rpc.query({

                route: params['_route'],
                params: {
                    fields: params['_fields'],
                    domain: params['_domain'],
                    _limit: params['_limit'],
                }
            }).then(function (data) {
                if (data) {
                    if (data.read_results) {
                        var read_results = data.read_results;
                        if (read_results.length > 0) {
                            try
                            {
                                var zip = read_results[0].zip;
                                if( String(zip) == String("") )
                                {}
                                else
                                {
                                    try
                                    {
                                        var params = {
                                            '_selector': $('input#l10n_pe_district'),
                                            '_route': '/selections/location/districts',
                                            '_fields': ['id', 'name', 'code'],
                                            '_domain': [['code', '=', String(zip)]],
                                            '_code': zip
                                        };
                                        self.set_location_by_district_code(params);
                                    }
                                    catch(error)
                                    {
                                        console.log(error);
                                    }                                
                                }
                                if( String(zip) == String("") )
                                {
                                    // country_id
                                    try
                                    {
                                        var country_id = read_results[0].country_id;
                                        if(parseInt(country_id))
                                        {
                                            $('select[name=country_id]').val(country_id);
                                        }
                                    }
                                    catch(error)
                                    {
                                        console.log(error);
                                    }

                                    // state_id
                                    try
                                    {
                                        var state_id = read_results[0].state_id;
                                        if(parseInt(state_id))
                                        {
                                            $('select[name=state_id]').val(state_id);
                                        }
                                        // province_id
                                        try
                                        {
                                            var province_id = read_results[0].city_id;
                                            if(parseInt(province_id))
                                            {
                                                // for states
                                                var params = {
                                                    '_selector': $('input#city_id'),
                                                    '_route': '/selections/location/cities',
                                                    '_fields': ['id', 'name'],
                                                    '_domain': [
                                                                    ['country_id', '=', parseInt(country_id)], 
                                                                    ['state_id', '=', parseInt(state_id)
                                                                ]],
                                                    '_multiple': false,
                                                    '_limit': 1,
                                                    '_model': 'res.city'
                                                }
                                                self._start_any_select2_003(params);
                                                self.set_any_default(params);
                                            }
                                            // district_id
                                            try
                                            {
                                                var district_id = read_results[0].l10n_pe_district;
                                                if(parseInt(district_id))
                                                {
                                                    var params = {
                                                        '_selector': $('input#l10n_pe_district'),
                                                        '_route': '/selections/location/districts',
                                                        '_fields': ['id', 'name'],
                                                        '_domain': [
                                                                        ['city_id', '=', parseInt(city_id)]
                                                                ],
                                                        '_multiple': false,
                                                        '_limit': 1,
                                                        '_model': 'l10n_pe.res.city.district'
                                                    };
                                                    self._start_any_select2_003(params);
                                                    self.set_any_default(params);
                                                }
                                            }
                                            catch(error)
                                            {
                                                console.log(error);
                                            }
                                        }
                                        catch(error)
                                        {
                                            console.log(error);
                                        }
                                    }
                                    catch(error)
                                    {
                                        console.log(error);
                                    }
                                }
                            }
                            catch(error)
                            {
                                console.log(error);
                            }                           
                        }
                    }
                }
            });
        },
        set_location_by_district_code: function(params)
        {
            rpc.query({

                route: params['_route'],
                params: {
                    fields: params['_fields'],
                    domain: params['_domain'],
                    _limit: params['_limit'],
                }
            }).then(function (data) {
                if (data) {
                    if (data.read_results) {
                        var read_results = data.read_results;
                        if (read_results.length > 0) {
                            var district_code = read_results[0].code;
                            var district_id = read_results[0].id;
                            var district_name = read_results[0].name;
                            var params = {
                                '_selector': $('input#l10n_pe_district'),
                                '_route': '/selections/location/cities',
                                '_fields': ['id', 'name', 'state_id'],
                                '_domain': [['l10n_pe_code', '=', String((district_code)).substring(0,4)]],
                            };
                            rpc.query({

                                route: params['_route'],
                                params: {
                                    fields: params['_fields'],
                                    domain: params['_domain'],
                                    _limit: params['_limit'],
                                }
                            }).then(function (data) {
                                if (data) {
                                    if (data.read_results) {
                                        var read_results = data.read_results;
                                        if (read_results.length > 0) {
                                            var city_id = read_results[0].id;
                                            var state_id = read_results[0].state_id;

                                            $("select[name=state_id]").val(state_id);
                                            $("select[name=state_id]").trigger('change');
                                            $("input[name=city_id]").val(city_id);
                                            $("input[name=zip]").val(district_code);

                                            var default_value = $("input[name=l10n_pe_district]").val();

                                            setTimeout(() => {
                                                    $("input[name=zip]").val(district_code);
                                                    $('input#l10n_pe_district').select2('data', { id: district_id, text: district_name, create: false }, false);
                                                    $("input[name=l10n_pe_district]").val(district_id);
                                            }, 1500);                                            
                                        }
                                        else
                                        {
                                            console.log("Not found; city_id / province")
                                        }
                                    }
                                }
                            });                            
                        }
                        else
                        {
                            console.log("Not found; district")
                        }
                    }
                }
            });
        },
        validate_vat: function (_event) {
            var self = this;
            var vat = $('input[name=vat]').val();
            var l10n_latam_identification_type_id_data = $('input#l10n_latam_identification_type_id').select2('data')
            var dt_name = null;
            if (l10n_latam_identification_type_id_data) {
                dt_name = l10n_latam_identification_type_id_data.text;
            }

            if (vat) {
                try {
                    vat = parseFloat(vat);

                    if (dt_name == "RUC") {
                        if (String(vat).length <= 11) {
                            // query to company details for auto fill electronic invoices fields
                            if (_event == "blur")
                                self.webservice_search_document('ruc', vat);
                        }
                        else if (String(vat).length > 11) {
                            vat = String(vat).substring(0, String(vat).length - 1);
                            $('input[name=vat]').val(vat);
                        }
                        else {
                            console.log("ERROR");
                        }
                    }
                    else if (dt_name == "DNI") {
                        if (String(vat).length <= 8) {
                            // query to company details for auto fill electronic invoices fields
                            if (_event == "blur")
                                self.webservice_search_document('dni', vat);
                        }
                        else if (String(vat).length > 8) {
                            vat = String(vat).substring(0, String(vat).length - 1);
                            $('input[name=vat]').val(vat);
                        }
                        else {
                            console.log("ERROR");
                        }
                    }
                    else { $('input[name=vat]').attr('type', 'text'); }
                }
                catch (error) {
                    console.log(error)
                    Dialog.alert(null, String('El número de documento no es un valor númerico.'), { 'title': String('Documento del comprador') })
                }
            }
        },
        set_default_document_type: function () {
            var document_type_id = $('input#l10n_latam_identification_type_id').val();
            var partner_id = $('input[name=partner_id]').val();
            if (document_type_id) { }
            else {
                var params = {
                    '_route': '/selections/partner_document_types',
                    '_fields': ['id', 'name'],
                    '_domain': [['webcheckout_is_default', '=', true]],
                    '_partner_id': partner_id
                };
                rpc.query({

                    route: params['_route'],
                    params: {
                        fields: params['_fields'],
                        domain: params['_domain'],
                        partner_id: params['_partner_id'],
                    }
                }).then(function (data) {
                    if (data) {
                        
                        if (data.read_results) {
                            var read_results = data.read_results;
                            var read_results = data.read_results;
                            if (read_results.length > 0) {
                                var id = read_results[0].id;
                                var name = read_results[0].name;
                                $('input#l10n_latam_identification_type_id').select2('data', { id: id, text: name, create: false }, false);
                                if (String(name) == "RUC" || String(name) == "DNI") {
                                    $('input[name=vat]').attr('type', 'number');
                                }
                            }
                            if(data.default_type)
                            {
                                
                                var default_type = data.default_type[0];
                                $('input#l10n_latam_identification_type_id').select2('data', { id: parseInt(default_type.id), text: String(default_type.name), create: false }, false);
                                $('input#l10n_latam_identification_type_id').trigger('change');
                            }
                            
                        }
                    }
                });
            }
        },
        set_zip_code: function () {
            var l10n_pe_district_id = $('input#l10n_pe_district').val();

            var params = {
                '_route': '/selections/any_default',
                '_fields': ['id', 'name', 'code'],
                '_domain': [['id', '=', parseInt(l10n_pe_district_id)]],
                '_limit': 1,
                '_model': 'l10n_pe.res.city.district'
            };
            rpc.query({
                route: params['_route'],
                params: {
                    fields: params['_fields'],
                    domain: params['_domain'],
                    _model: params['_model'],
                    _limit: params['_limit']
                }
            }).then(function (data) {
                if (data) { $('input[name=zip]').val(data[0].code); }
            });
        },
        start_country_id: function (code) {
            var self = this;
            var params = {
                '_route': '/selections/get_countries',
                '_fields': ['id', 'name'],
                '_domain': [['code', '=', code]],
            };
            rpc.query({

                route: params['_route'],
                params: {
                    fields: params['_fields'],
                    domain: params['_domain'],
                }
            }).then(function (data) {
                if (data) {
                    if (data.read_results) {
                        var read_results = data.read_results;
                        if (read_results.length > 0) {
                            $('select#country_id').val(read_results[0].id);
                        }
                    }
                }
            });
        },
        _start_any_select2_003: function (params) {
            var self = this;
            params['_selector'].select2({
                width: '100%',
                allowClear: true,
                formatNoMatches: false,
                multiple: params["_multiple"],
                selection_data: false,
                formatSelection: function (data) {
                    if (data.tag) {
                        data.text = data.tag;
                    }
                    return data.text;
                },
                createSearchChoice: function (term, data) {
                    var addedTags = $(this.opts.element).select2('data');
                    if (_.filter(_.union(addedTags, data), function (tag) {
                        return tag.text.toLowerCase().localeCompare(term.toLowerCase()) === 0;
                    }).length === 0) {
                        if (this.opts.can_create) {
                            return {
                                id: _.uniqueId('tag_'),
                                create: true,
                                tag: term,
                                text: _.str.sprintf(_t("Create new Tag '%s'"), term),
                            };
                        } else {
                            return undefined;
                        }
                    }
                },
                fill_data: function (query, data) {
                    var that = this,
                        tags = { results: [] };
                    _.each(data, function (obj) {
                        if (that.matcher(query.term, obj.name)) {
                            tags.results.push({ id: obj.id, text: obj.name });
                        }
                    });
                    query.callback(tags);
                },
                query: function (query) {
                    var that = this;
                    if (!this.selection_data) {
                        rpc.query({

                            route: params['_route'],
                            params: {
                                fields: params['_fields'],
                                domain: params['_domain'],
                            }
                        }).then(function (data) {
                            that.can_create = data.can_create;
                            that.fill_data(query, data.read_results);
                            that.selection_data = data.read_results;
                        });
                    } else {
                        this.fill_data(query, this.selection_data);
                    }
                }
            });
        },
    });
});