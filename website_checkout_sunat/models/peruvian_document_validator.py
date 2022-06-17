import sys, requests
import logging
_logger = logging.getLogger(__name__)

class peruvian_document_validator:
    dni1_ws = "http://api.grupoyacck.com/dni/"
    ruc1_ws = "http://api.grupoyacck.com/ruc/"

    def get_by_dni(self,document_number):
        url = self.dni1_ws + str(document_number) + str('/?format=json')
        res = {'error': True, 'message': None, 'data': {}}
        try:
            response = requests.get(url)
        except requests.exceptions.ConnectionError as e:
            res['message'] = 'Error en la conexion'
            return res
        try:   
            response = response.json()
            person = response
            if str(person['name']) != '':
                res['error'] = False
                res['data']['nombres'] = person['name']
                res['data']['ape_paterno'] = person['paternal_surname']
                res['data']['ape_materno'] = person['maternal_surname']
                res['data']['fecha_nacimiento'] = None #person['FechaNacimiento']
                res['data']['sexo'] = None #person['Sexo']
            else:
                try:
                    res['message'] = str("No encontrado.")
                except Exception as e:
                    res['error'] = True
            res['url'] = url
            return res         
        except Exception as e:
            exc_traceback = sys.exc_info()
            res['error'] = True
            return res
        return res
    
    def get_by_ruc(self,ruc):
        res = {'error': False, 'message': None, 'data': {}}
        try:
            response = requests.get(self.ruc1_ws + str(ruc) + str('/?format=json'))
            society = response.json()
            res['error'] = False
            res['data']['ruc'] = ruc
            res['data']['tipo_contribuyente'] = society.get('type_taxpayer')
            res['data']['nombre_comercial'] = society.get('commercial_name')
            res['data']['nombre'] = society.get('name')
            res['data']['domicilio_fiscal'] = society.get('street')
            res['data']['departamento'] = self.get_department(society.get('region'))
            res['data']['provincia'] = society.get('province')
            res['data']['distrito'] = society.get('district')
            res['data']['ubigeo'] = society.get('ubigeo')
            res['data']['sistema_emision_comprobante'] = society.get('emission_system')
            res['data']['sistema_contabilidad'] = society.get('accounting_system')
            res['data']['estado_contribuyente'] = society.get('state')
            res['data']['condicion_contribuyente'] = society.get('condition')
            res['data']['actividad_economica'] = society.get('activities')
            res['data']['representantes_legales'] = society.get('representatives')
        except Exception as e:
            _logger.warning("get_by_ruc")
            _logger.warning(getattr(e, 'message', repr(e))+" ON LINE "+format(sys.exc_info()[-1].tb_lineno))
            res['error'] = True
            return res
        return res
   
    def get_department(self, department):
        if(str(department)==str("DIOS")):
            department = str("MADRE DE DIOS")
        if(str(department)==str("MARTIN")):
            department = str("SAN MARTIN")
        if(str(department)==str("LIBERTAD")):
            department = str("LA LIBERTAD")
        if(str(department)==str("111)  LIMA")):
            department = str("LIMA")
        if(str(department)==str("(SSA")):
            department = str("LIMA")         
        return department