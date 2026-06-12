import requests
from decouple import config
from requests.auth import HTTPBasicAuth

class PayPalAPI:
    def __init__(self):
        self.client_id = config('PAYPAL_CLIENT_ID')
        self.client_secret = config('PAYPAL_CLIENT_SECRET')
        self.environment = config('PAYPAL_ENV', 'sandbox')
        
        if self.environment == 'sandbox':
            self.base_url = "https://api-m.sandbox.paypal.com"
        else:
            self.base_url = "https://api-m.paypal.com"
        
        self.access_token = self._get_access_token()
    
    def _get_access_token(self):
        url = f"{self.base_url}/v1/oauth2/token"
        headers = {'Accept': 'application/json', 'Accept-Language': 'en_US'}
        
        response = requests.post(
            url,
            auth=HTTPBasicAuth(self.client_id, self.client_secret),
            headers=headers,
            data={'grant_type': 'client_credentials'}
        )
        
        if response.status_code == 200:
            return response.json().get('access_token')
        return None
    
    def create_order(self, amount, currency='KES', return_url=None, cancel_url=None):
        """Create PayPal order"""
        url = f"{self.base_url}/v2/checkout/orders"
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'intent': 'CAPTURE',
            'purchase_units': [
                {
                    'amount': {
                        'currency_code': currency,
                        'value': str(amount)
                    }
                }
            ]
        }
        
        if return_url and cancel_url:
            payload['application_context'] = {
                'return_url': return_url,
                'cancel_url': cancel_url
            }
        
        response = requests.post(url, json=payload, headers=headers)
        return response.json()
    
    def capture_order(self, order_id):
        """Capture PayPal payment"""
        url = f"{self.base_url}/v2/checkout/orders/{order_id}/capture"
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, headers=headers)
        return response.json()