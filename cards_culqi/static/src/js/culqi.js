/*
 *   Copyright (c) 2020 
 *   All rights reserved.
 */
/*
 *   Jhon Alexander Grisales Rivera
 *   Copyright (c) 2020 
 *   All rights reserved.
 */

var odoo_order_id = null;
var odoo_order = null;
var odoo_order_customer = null;
var culqi_enviroment = null;
var checkout_items = null;
var _acquirer_id = null;
var global_amount_total = null;

odoo.define('module.CQ', function (require) {
    "use strict";
    var rpc = require('web.rpc');
    var Dialog = require('web.Dialog');

    $(document).ready(function () {
        var url_string = window.location.href;
        var url = new URL(url_string);
        var state = url.searchParams.get("state");
        var message = url.searchParams.get("message");
        if (state == "done" || state == "venta_exitosa") {
            $('.o_wsale_my_cart').fadeOut();
            Dialog.alert(null, message, {
                Title: "CULQI - Orden de Venta",
            });
        }
        else {
            if (String(state) != String("null")) {
                Dialog.alert(null, message, {
                    Title: "CULQI - Solicitud Orden de Venta",
                });
            }

        }

        var default_button = $("form.o_payment_form").find("button[name='o_payment_submit_button']");

        if ($("#payment_method").length > 0) {
            $("button[name='o_payment_submit_button']").after(function () {
                initCulqiPagoAcquirer();
            });
        }

        $("button[name='o_payment_submit_button']").on("click", function () {
            event.preventDefault();
            var data_provider = $("input[name='o_payment_radio']:checked").attr("data-provider");

            if (data_provider == "culqi") {
                Culqi.open();
                event.preventDefault();

                setInterval(function () {
                    $("button[name='o_payment_submit_button']").find("span.o_loader").remove();
                    $("button[name='o_payment_submit_button']").removeAttr("disabled");
                }, 1);

            }
            else {
                if (data_provider != "culqi")
                    $("form.o_payment_form").submit();
            }
        });

    });

    function initCulqiPagoAcquirer() {
        var data = { "params": {} }
        $.ajax({
            type: "POST",
            url: '/culqi/get_culqi_acquirer',
            data: JSON.stringify(data),
            dataType: 'json',
            contentType: "application/json",
            async: false,
            success: function (response) {
                var acquirer = response.result.acquirer;
                if (String(acquirer.state) == "enabled" || String(acquirer.state) == "test") {
                    createPreference(acquirer, Culqi)
                }
            }
        });
    }

    function createPreference(acquirer, Culqi) {
        var partner_id = $(".o_payment_form").attr("data-partner-id");
        var acquirer_id = $('input[data-provider="culqi"]').attr("data-acquirer-id");
        var online_payment = "no";

        if ($("#quote_content").length > 0) {
            online_payment = "yes";
        }

        var data = { "params": { partner_id: partner_id, acquirer_id: acquirer_id, online_payment: online_payment } }

        $.ajax({
            type: "POST",
            url: '/culqi/get_sale_order',
            data: JSON.stringify(data),
            dataType: 'json',
            contentType: "application/json",
            async: false,
            success: function (response) {
                var json_preference = response.result.json_preference;
                var preference = json_preference
                var state_enviroment = response.result.environment;
                var product_lines = response.result.product_lines;
                var customer = response.result.customer;
                var currency_name = response.result.currency_name;
                var acquirer_id = response.result.acquirer_id;

                global_amount_total = preference.amount_total
                var amount = parseInt(String(String(parseFloat(preference.amount_total).toFixed(2)).replace(".", "")).replace(",", ""));
                try {
                    if (amount < 300) {
                        Dialog.alert(null, "Permite totales mayor que 3 Soles o bien 3 Dólares Americanos", {
                            Title: "CULQI - Orden de Venta",
                        });
                        return false;
                    }
                }
                catch (error) { }

                if (state_enviroment == 'test') {
                    culqi_enviroment = 'sandbox'
                    Culqi.publicKey = acquirer.culqi_public_key;
                }

                if (state_enviroment == 'enabled') {
                    culqi_enviroment = 'production'
                    Culqi.publicKey = acquirer.culqi_public_key_produccion;
                }
                var culqi_transaction = {
                    title: preference.name,
                    currency: currency_name,
                    description: product_lines,
                    amount: amount
                }
                odoo_order = culqi_transaction;
                odoo_order_id = preference.id;
                odoo_order_customer = customer;
                checkout_items = response.result.checkout_items;
                _acquirer_id = acquirer_id;
                Culqi.settings(culqi_transaction);
            }
        });
    }
});
/**
 * This function should be rigth listener 
 * but it isen't getting token or some error
 * 
 * Main file was loaded locally but not properlly as 
 * docummentation recommends. Anyway working with Odoo
 */
function culqi() {
    console.log(Culqi)
}

function handleCulqiToken(token) {
    //alert(token)    
    if (String(token).length > 0) {
        //alert(global_amount_total)
        var data = {
            "params": {
                'enviroment': culqi_enviroment,
                'token': token,
                'culqi_preference': odoo_order,
                'customer': odoo_order_customer,
                'odoo_order_id': odoo_order_id,
                'checkout_items': checkout_items,
                'acquirer_id': _acquirer_id,
                'amount_total': global_amount_total
            }
        }
        $.ajax({
            type: "POST",
            url: '/culqi/process_culqi_payment',
            data: JSON.stringify(data),
            dataType: 'json',
            contentType: "application/json",
            async: false,
            success: function (response) {
                console.log(response)
                var url_send = response.result.url_send;
                window.location = url_send
            }
        });
    }
}

window.culqijs = function (e) {
    var t = {};

    function o(n) {
        if (t[n]) return t[n].exports;
        var r = t[n] = {
            i: n,
            l: !1,
            exports: {}
        };
        return e[n].call(r.exports, r, r.exports, o), r.l = !0, r.exports
    }
    return o.m = e, o.c = t, o.d = function (e, t, n) {
        o.o(e, t) || Object.defineProperty(e, t, {
            enumerable: !0,
            get: n
        })
    }, o.r = function (e) {
        "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(e, Symbol.toStringTag, {
            value: "Module"
        }), Object.defineProperty(e, "__esModule", {
            value: !0
        })
    }, o.t = function (e, t) {
        if (1 & t && (e = o(e)), 8 & t) return e;
        if (4 & t && "object" == typeof e && e && e.__esModule) return e;
        var n = Object.create(null);
        if (o.r(n), Object.defineProperty(n, "default", {
            enumerable: !0,
            value: e
        }), 2 & t && "string" != typeof e)
            for (var r in e) o.d(n, r, function (t) {
                return e[t]
            }.bind(null, r));
        return n
    }, o.n = function (e) {
        var t = e && e.__esModule ? function () {
            return e.default
        } : function () {
            return e
        };
        return o.d(t, "a", t), t
    }, o.o = function (e, t) {
        return Object.prototype.hasOwnProperty.call(e, t)
    }, o.p = "", o(o.s = 0)
}([function (e, t, o) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    }), Object.defineProperty(t, "Checkout", {
        enumerable: !0,
        get: function () {
            return n.default
        }
    }), Object.defineProperty(t, "Elements", {
        enumerable: !0,
        get: function () {
            return r.default
        }
    });
    var n = a(o(1)),
        r = a(o(2));

    function a(e) {
        return e && e.__esModule ? e : {
            default: e
        }
    }
}, function (e, t, o) {
    "use strict";

    function n(e, t) {
        for (var o = 0; o < t.length; o++) {
            var n = t[o];
            n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, n.key, n)
        }
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    }), t.default = void 0;
    var r, a, l, c, i, s = !1,
        u = {
            title: "Culqi Store",
            currency: "PEN",
            description: "Polo/remera Culqi lover",
            amount: 100,
            version: 3
        },
        d = {
            lang: "auto",
            modal: !0,
            onlyInputs: !1,
            head: !0,
            installments: !1,
            customButton: "",
            style: {
                bgcolor: "#fafafa",
                maincolor: "#0ec1c1",
                disabledcolor: "#ffffff",
                buttontext: "#ffffff",
                maintext: "#4A4A4A",
                desctext: "#4A4A4A",
                logo: "https://static.culqi.com/v2/v2/static/img/logo.png"
            }
        },
        f = "",
        p = "",
        m = function () {
            function e() {
                ! function (e, t) {
                    if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
                }(this, e)
            }
            var t, o, a;
            return t = e, (o = [{
                key: "_cambiarContenedor",
                value: function () {
                    return "" == f ? "document.body" : f
                }
            }, {
                key: "init",
                value: function () {
                    console.log("%cCULQI JS%cv2", "padding: 5px; border-radius: 4px 0 0 4px; background: linear-gradient(#34c4ad, #0AA6A9); color: #FFF; text-transform: uppercase; font-size: 10px;font-family: sans-serif;font-weight: bold;text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.3)", "padding: 5px; border-radius: 0 4px 4px 0; background-color: #676767; color: #FFF; text-transform: uppercase; font-size: 10px;font-family: sans-serif")
                }
            }, {
                key: "initCheckout",
                value: function (e) {
                    g(e)
                }
            }, {
                key: "settings",
                value: function (e) {
                    var t = !0;

                    return p.length > 5 ? (u = e, Number(u.amount) % 1 == 0 ? (u.amount = Number(u.amount), window.addEventListener("message", b, !1), this.initCheckout(!0), t = !0) : console.log("%cJS%cEl monto no es válido", "padding: 5px; border-radius: 4px 0 0 4px; background-color: #38d9a9; color: #222b31; text-transform: uppercase; font-weight: bold; font-size: 10px;font-family: sans-serif", "padding: 5px; border-radius: 0 4px 4px 0; background-color: #ad1411; color: #FFF; text-transform: uppercase; font-size: 10px;font-family: sans-serif; font-weight: bold; text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.3)")) : (s || console.log("%cJS%cNo configuro publicKey", "padding: 5px; border-radius: 4px 0 0 4px; background-color: #38d9a9; color: #222b31; text-transform: uppercase; font-weight: bold; font-size: 10px;font-family: sans-serif", "padding: 5px; border-radius: 0 4px 4px 0; background-color: #ad1411; color: #FFF; text-transform: uppercase; font-size: 10px;font-family: sans-serif; font-weight: bold; text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.3)"), t = !1), t
                }
            }, {
                key: "options",
                value: function (e) {
                    return void 0 !== e && (void 0 !== e.lang && (d.lang = e.lang), void 0 !== e.modal && (d.modal = e.modal), void 0 !== e.onlyInputs && (d.onlyInputs = e.onlyInputs), void 0 !== e.head && (d.head = e.head), void 0 !== e.installments && "" != e.installments && (d.installments = e.installments), void 0 !== e.customButton && (d.customButton = e.customButton), void 0 !== e.style && (void 0 !== e.style.bgcolor && (d.style.bgcolor = e.style.bgcolor), void 0 !== e.style.maincolor && (d.style.maincolor = e.style.maincolor), void 0 !== e.style.disabledcolor && (d.style.disabledcolor = e.style.disabledcolor), void 0 !== e.style.buttontext && (d.style.buttontext = e.style.buttontext), void 0 !== e.style.maintext && (d.style.maintext = e.style.maintext), void 0 !== e.style.desctext && (d.style.desctext = e.style.desctext), void 0 !== e.style.logo && (d.style.logo = e.style.logo))), d
                }
            }, {
                key: "open",
                value: function () {
                    y()
                }
            }, {
                key: "close",
                value: function () {
                    g(!0)
                }
            }, {
                key: "createToken",
                value: function () {
                    var e, t, o, n, r;
                    e = document.getElementsByClassName("culqi-email").length > 0 ? document.getElementsByClassName("culqi-email")[0] : document.querySelectorAll('[data-culqi="card[email]"]').length > 0 ? document.querySelectorAll('[data-culqi="card[email]"]')[0] : document.getElementById("card[email]"), t = document.getElementsByClassName("culqi-card").length > 0 ? document.getElementsByClassName("culqi-card")[0] : document.querySelectorAll('[data-culqi="card[number]"]').length > 0 ? document.querySelectorAll('[data-culqi="card[number]"]')[0] : document.getElementById("card[number]"), o = document.getElementsByClassName("culqi-cvv").length > 0 ? document.getElementsByClassName("culqi-cvv")[0] : document.querySelectorAll('[data-culqi="card[cvv]"]').length > 0 ? document.querySelectorAll('[data-culqi="card[cvv]"]')[0] : document.getElementById("card[cvv]"), n = document.getElementsByClassName("culqi-expy").length > 0 ? document.getElementsByClassName("culqi-expy")[0] : document.querySelectorAll('[data-culqi="card[exp_year]"]').length > 0 ? document.querySelectorAll('[data-culqi="card[exp_year]"]')[0] : document.getElementById("card[exp_year]"), r = document.getElementsByClassName("culqi-expm").length > 0 ? document.getElementsByClassName("culqi-expm")[0] : document.querySelectorAll('[data-culqi="card[exp_month]"]').length > 0 ? document.querySelectorAll('[data-culqi="card[exp_month]"]')[0] : document.getElementById("card[exp_month]");
                    var a = {
                        email: e.value,
                        card_number: t.value.replace(/\s/g, ""),
                        cvv: o.value,
                        expiration_year: n.value,
                        expiration_month: r.value
                    },
                        c = JSON.stringify(a),
                        i = new XMLHttpRequest;
                    i.open("POST", "https://secure.culqi.com/v2/tokens", !0), i.setRequestHeader("Content-type", "application/json"), i.setRequestHeader("Authorization", "Bearer " + p), i.setRequestHeader("X-API-VERSION", "2"), i.setRequestHeader("X-API-KEY", p), i.setRequestHeader("X-CULQI-ENV", "live"), i.onreadystatechange = function () {
                        return 4 == i.readyState && (l = JSON.parse(i.response), culqi()), !1
                    }, i.send(c)
                }
            }, {
                key: "env",
                set: function (e) {
                    s = e
                }
            }, {
                key: "name",
                get: function () {
                    return "Culqi Checkout v3.0"
                }
            }, {
                key: "publicKey",
                get: function () {
                    return p
                },
                set: function (e) {
                    p = e
                }
            }, {
                key: "container",
                get: function () {
                    return f
                },
                set: function (e) {
                    f = e
                }
            }, {
                key: "getSettings",
                get: function () {
                    return u
                }
            }, {
                key: "getOptions",
                get: function () {
                    return d
                }
            }, {
                key: "order",
                get: function () {
                    return r
                }
            }, {
                key: "token",
                get: function () {
                    return l
                },
                set: function (e) {
                    l = e
                }
            }, {
                key: "error",
                get: function () {
                    return c
                }
            }, {
                key: "closeEvent",
                get: function () {
                    return i
                }
            }]) && n(t.prototype, o), a && n(t, a), e
        }();

    function y() {
        var e;
        "Apple Computer, Inc." == navigator.vendor && altScrollTo.call(window, 0, 0), null != document.querySelector(".culqi_checkout") && ((e = document.getElementById("culqi_checkout_frame")).style.visibility = "visible", e.style.display = "block", e.style.width = "100%", e.style.height = "100%")
    }

    function g(e, t) {
        var o, n = null,
            r = null,
            l = "?public_key=" + p + "&title=" + encodeURIComponent(window.btoa(unescape(encodeURIComponent(u.title)))) + "&currency=" + encodeURIComponent(window.btoa(unescape(encodeURIComponent(u.currency)))) + "&description=" + encodeURIComponent(window.btoa(unescape(encodeURIComponent(u.description)))) + "&amount=" + encodeURIComponent(window.btoa(unescape(encodeURIComponent(u.amount)))) + "&logo=" + encodeURIComponent(window.btoa(unescape(encodeURIComponent(d.style.logo)))) + "&installments=" + d.installments;
        if (void 0 !== u.order ? l += "&orders=" + encodeURIComponent(window.btoa(unescape(encodeURIComponent(u.order)))) : l += "&orders=", null == document.querySelector(".culqi_checkout")) {
            (n = document.createElement("IFRAME")).setAttribute("src", "https://checkout.culqi.com" + l), n.setAttribute("id", "culqi_checkout_frame"), n.setAttribute("name", "checkout_frame"), n.setAttribute("class", "culqi_checkout"), n.setAttribute("allowtransparency", "true"), n.setAttribute("frameborder", "0"), n.style.backgroundColor = "rgba(0,0,0,0.62)", n.style.border = "0px none trasparent", n.style.overflowX = "hidden", n.style.overflowY = "auto", n.style.margin = "0px", d.modal ? (n.style.zIndex = 99999, n.style.position = "fixed", n.style.visibility = "hidden", n.style.visibility = "collapse", n.style.height = 0, n.style.width = 0) : (n.setAttribute("frameborder", 0), n.setAttribute("allowfullscreen", !0), n.style.height = "100%", n.style.width = "100%"), n.style.left = "0px", n.style.top = "0px", n.style.backgroundPosition = "initial initial", n.style.backgroundRepeat = "initial initial", o = "" != f ? document.getElementById(f) : document.body;
            try {
                o.appendChild(n)
            } catch (e) {
                console.log("%c>JS> Error: No existe contenedor %c" + o + "%c" + e, "padding: 0 10px; background-color: #000000; color: #ff0000; text-transform: uppercase; font-weight: bold;", "background-color: #000000; padding: 0 10px; color: #fff", "padding: 0 10px; color: #ff0000; font-weight: bold;")
            }
            "Apple Computer, Inc." == navigator.vendor && (window.altScrollTo = n.contentWindow.scrollTo), (r = document.getElementById("culqi_checkout_frame")).addEventListener("load", function () {
                ! function (e) {
                    !0 === e && console.log("%cCULQI Checkout%cv3.0", "padding: 5px; border-radius: 4px 0 0 4px; background: linear-gradient(#34c4ad, #0AA6A9); color: #FFF; text-transform: uppercase; font-size: 10px;font-family: sans-serif;font-weight: bold;text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.3)", "padding: 5px; border-radius: 0 4px 4px 0; background-color: #676767; color: #FFF; text-transform: uppercase; font-size: 10px;font-family: sans-serif")
                }(e),
                    function () {
                        var e = m,
                            t = {
                                _publicKey: p,
                                _settings: u,
                                _options: d
                            },
                            o = document.getElementById("culqi_checkout_frame");
                        o ? o.contentWindow.postMessage(t, "*") : console.log("%c>JS> Error: Revise contenedor %c" + e.container, "padding: 0 10px; background-color: #000000; color: #ff0000; text-transform: uppercase; font-weight: bold;", "background-color: #000000; padding: 0 10px 0 0; color: #fff")
                    }(), e || void 0 === t || (r.contentWindow.postMessage({
                        type: "recupera",
                        data: t,
                        order: a
                    }, "*"), y())
            })
        } else null != (r = document.getElementById("culqi_checkout_frame")) && (r.parentNode.removeChild(r), g(!1, t));
        return !0
    }

    function b(e) {
        var t, o;
        if (i = null, "string" == typeof e.data) try {
            t = JSON.parse(e.data)
        } catch (t) {
            switch (e.data) {
                case "culqi_destroy_checkout":
                    setTimeout(function () {
                        document.getElementById("culqi_checkout_frame").remove()
                    }, 500);
                    break;
                case "checkout_cerrado":
                    i = e.data, l = null, null != (o = document.getElementById("culqi_checkout_frame")) && (o.style.visibility = "hidden", o.style.visibility = "collapse", o.style.width = "0px", o.style.height = "0px");
                    break;
                case "checkout_cargando_recupera":
                    i = e.data, l = null, culqi();
                    break;
                default:
                    "" != e.data && console.log("%cJS%cNo se reconoce Instrucción%c" + e.data, "padding: 5px; border-radius: 4px 0 0 4px; background-color: #38d9a9; color: #222b31; text-transform: uppercase; font-size: 10px;font-family: sans-serif", "padding: 5px; background-color: #222b31; color: #ff8f00; text-transform: uppercase; font-size: 10px;font-family: sans-serif;border-left: 5px solid #ff8f00;", "padding: 5px; border-radius: 0 4px 4px 0; background-color: #08696b; color: #fff; text-transform: uppercase; font-size: 10px;font-family: sans-serif; font-weight: bold;text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.3)")
            }
        } else if ("string" == typeof e.data.object) switch (e.data.object) {
            case "error":
                /*
                swal({
                    title: "Orden de Venta",
                    text: e.data.user_message,
                    type: "success",
                    showCancelButton: true,
                    cancelButtonText: "OK",
                    closeOnCancel: true
                });*/
                //alert("%cJS%c" + e.data.type.replace(/_/g, " ") + "%c" + e.data.param + "%c\n" + e.data.merchant_message + ": " + e.data.user_message, "padding: 5px; border-radius: 4px 0 0 4px; background-color: #38d9a9; color: #222b31; text-transform: uppercase; font-size: 10px;font-family: sans-serif", "padding: 5px; background-color: #222b31; color: #ff4f4f; text-transform: uppercase; font-size: 10px;font-family: sans-serif;border-left: 5px solid #ff4f4f;", "padding: 5px; border-radius: 0 4px 4px 0; background-color: #08696b; color: #fff; text-transform: uppercase; font-size: 10px;font-family: sans-serif; font-weight: bold;text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.3)", "color: #FFF; font-family: sans-serif");
                var n = function () {
                    var e = navigator.userAgent.toLowerCase();
                    return -1 != e.indexOf("msie") && parseInt(e.split("msie")[1])
                };
                t = n() && n() < 9 ? JSON.parse(e.data) : e.data, l = null, c = t, a = null, r = null, "2" != u.version && culqi(), u.order && g(!0);
                break;
            case "order":
                r = e.data, c = null, l = null, culqi();
                break;
            case "token":
                console.log("%cJS%c" + e.data.object + "%c" + e.data.id, "padding: 5px; border-radius: 4px 0 0 4px; background-color: #38d9a9; color: #222b31; text-transform: uppercase; font-size: 10px;font-family: sans-serif", "padding: 5px; background-color: #222b31; color: #ff8f00; text-transform: uppercase; font-size: 10px;font-family: sans-serif;border-left: 5px solid #ff8f00;", "padding: 5px; border-radius: 0 4px 4px 0; background-color: #08696b; color: #fff; text-transform: uppercase; font-size: 10px;font-family: sans-serif; font-weight: bold;text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.3)"), l = e.data, c = null, a = Object.assign({}, r), r = null, culqi()
                handleCulqiToken(e.data.id)
        }
    }
    t.default = m, e.exports = t.default
}, function (e, t, o) {
    "use strict";
    Object.defineProperty(t, "__esModule", {
        value: !0
    }), t.default = void 0;
    var n, r = (n = o(3)) && n.__esModule ? n : {
        default: n
    };

    function a(e) {
        return (a = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (e) {
            return typeof e
        } : function (e) {
            return e && "function" == typeof Symbol && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e
        })(e)
    }

    function l(e, t) {
        for (var o = 0; o < t.length; o++) {
            var n = t[o];
            n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, n.key, n)
        }
    }
    var c, i, s = "",
        u = "https://checkout.culqi.com/#/elements",
        d = u + "/controller/",
        f = function () {
            function e(t) {
                ! function (e, t) {
                    if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
                }(this, e);
                this.iframe = document.createElement("IFRAME"), this.elementStatus = "init", t ? (s = t, console.log("%cCULQI Elements%c", "padding: 5px; border-radius: 4px 0 0 4px; background: linear-gradient(#34c4ad, #0AA6A9); color: #FFF; text-transform: uppercase; font-size: 10px;font-family: sans-serif;font-weight: bold;text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.3)", "padding: 5px; border-radius: 0 4px 4px 0; background-color: #676767; color: #FFF; text-transform: uppercase; font-size: 10px;font-family: sans-serif", t)) : console.log("%cJS%cNo configuro publicKey", "padding: 5px; border-radius: 4px 0 0 4px; background-color: #38d9a9; color: #222b31; text-transform: uppercase; font-weight: bold; font-size: 10px;font-family: sans-serif", "padding: 5px; border-radius: 0 4px 4px 0; background-color: #ad1411; color: #FFF; text-transform: uppercase; font-size: 10px;font-family: sans-serif; font-weight: bold; text-shadow: 0 -1px 0 rgba(0, 0, 0, 0.3)"), null == document.querySelector("#elements_frame_controller") && (this.iframe.setAttribute("src", d), this.iframe.setAttribute("class", "culqi-elements_controller"), this.iframe.setAttribute("id", "elements_frame_controller"), this.iframe.setAttribute("name", "elements_frame_controller"), this.iframe.setAttribute("allowtransparency", "true"), this.iframe.setAttribute("frameborder", "0"), this.iframe.style.height = "0px", this.iframe.style.width = "0px", document.body.appendChild(this.iframe)), window.addEventListener("message", function (e) {
                    var t = e.data;
                    if (c = null, i = null, "clq-element_autofocus" === t.type) {
                        var o = "";
                        switch (t.element) {
                            case "expiry":
                                o = "Expiry";
                                break;
                            case "cvv":
                                o = "Cvc"
                        }
                        document.querySelector(".culqi-element_iframe[name = culqi-element_card" + o).contentWindow.postMessage({
                            type: "clq_focusElement"
                        }, u)
                    }
                    "clq-element_event" == t.type && (document.querySelectorAll(".culqi-element_iframe"), document.querySelector('.culqi-element_iframe[name="culqi-element_cardCvc"]').contentWindow.postMessage({
                        data: t.data,
                        type: "clq_setCVVMask"
                    }, u));
                    "token" == t.object ? (c = t, culqi()) : "error" == t.object && (i = t, culqi())
                }, !1)
            }
            var t, o, n;
            return t = e, (o = [{
                key: "create",
                value: function (e, t) {
                    return void 0 === t && (t = 0), new r.default(e, t)
                }
            }, {
                key: "sendData",
                value: function (e) {
                    var t, o = document.querySelector("#elements_frame_controller"),
                        n = document.querySelectorAll(".culqi-element_iframe");
                    o.contentWindow.postMessage({
                        type: "clq_restartElementsData"
                    }, d);
                    for (var r = 0; r < n.length; r++) n[r].contentWindow.postMessage({
                        type: "clq_getElementsData"
                    }, u), t = "object" == a(e) ? {
                        type: "clq_getElementsData",
                        metadata: e
                    } : {
                        type: "clq_getElementsData"
                    }, o.contentWindow.postMessage(t, d)
                }
            }, {
                key: "publicKey",
                get: function () {
                    return s
                },
                set: function (e) {
                    s = e
                }
            }, {
                key: "token",
                get: function () {
                    return c
                }
            }, {
                key: "error",
                get: function () {
                    return i
                }
            }]) && l(t.prototype, o), n && l(t, n), e
        }();
    t.default = f, e.exports = t.default
}, function (e, t, o) {
    "use strict";

    function n(e, t) {
        for (var o = 0; o < t.length; o++) {
            var n = t[o];
            n.enumerable = n.enumerable || !1, n.configurable = !0, "value" in n && (n.writable = !0), Object.defineProperty(e, n.key, n)
        }
    }
    Object.defineProperty(t, "__esModule", {
        value: !0
    }), t.default = void 0;
    var r = "https://checkout.culqi.com/#/elements",
        a = function () {
            function e(t, o) {
                ! function (e, t) {
                    if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
                }(this, e), this.type = t, this.options = o, this.iframe = document.createElement("IFRAME"), this.iframe.setAttribute("src", r), this.iframe.setAttribute("class", "culqi-element_iframe"), this.iframe.setAttribute("name", "culqi-element_" + t), this.iframe.setAttribute("allowtransparency", "true"), this.iframe.setAttribute("frameborder", "0"), this.iframe.style.height = "inherit", this.iframe.style.width = "100%"
            }
            var t, o, a;
            return t = e, (o = [{
                key: "mount",
                value: function (e) {
                    var t = this;
                    document.querySelector(e).appendChild(t.iframe);
                    var o = document.querySelector(e + " iframe");
                    o.onload = function () {
                        o.contentWindow.postMessage({
                            data: t.options,
                            clqElementType: t.type,
                            type: "clq_setElementData"
                        }, r)
                    }
                }
            }, {
                key: "on",
                value: function (e, t) {
                    var o = this;
                    window.addEventListener("message", function (n) {
                        var r = o.type.toLowerCase();
                        "clq-element_status" == n.data.type && r == n.data.data.element.replace("-", "") && ("all" == e ? t && t({
                            event: n.data.event,
                            data: n.data.data
                        }) : n.data.event == e && t && t({
                            data: n.data.data
                        }))
                    }, !1)
                }
            }]) && n(t.prototype, o), a && n(t, a), e
        }();
    t.default = a, e.exports = t.default
}]);
var Culqi = new culqijs.Checkout()