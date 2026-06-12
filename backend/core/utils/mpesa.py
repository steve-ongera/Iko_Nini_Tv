import requests
import base64
import datetime
from decouple import config
from requests.auth import HTTPBasicAuth

class MpesaAPI:
    def __init__(self):
        self.consumer_key = config('MPESA_CONSUMER_KEY')
        self.consumer_secret = config('MPESA_CONSUMER_SECRET')
        self.shortcode = config('MPESA_SHORTCODE')
        self.passkey = config('MPESA_PASSKEY')
        self.environment = config('MPESA_ENV', 'sandbox')
        
        if self.environment == 'sandbox':
            self.base_url = "https://sandbox.safaricom.co.ke"
        else:
            self.base_url = "https://api.safaricom.co.ke"
        
        self.access_token = self._get_access_token()
    
    def _get_access_token(self):
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        response = requests.get(url, auth=HTTPBasicAuth(self.consumer_key, self.consumer_secret))
        
        if response.status_code == 200:
            return response.json().get('access_token')
        return None
    
    def stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """Initiate STK Push"""
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(
            f"{self.shortcode}{self.passkey}{timestamp}".encode()
        ).decode()
        
        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'TransactionType': 'CustomerPayBillOnline',
            'Amount': int(amount),
            'PartyA': phone_number,
            'PartyB': self.shortcode,
            'PhoneNumber': phone_number,
            'CallBackURL': config('MPESA_CALLBACK_URL'),
            'AccountReference': account_reference,
            'TransactionDesc': transaction_desc
        }
        
        response = requests.post(url, json=payload, headers=headers)
        return response.json()
    
    def query_status(self, checkout_request_id):
        """Query transaction status"""
        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        password = base64.b64encode(
            f"{self.shortcode}{self.passkey}{timestamp}".encode()
        ).decode()
        
        url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
        
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'BusinessShortCode': self.shortcode,
            'Password': password,
            'Timestamp': timestamp,
            'CheckoutRequestID': checkout_request_id
        }
        
        response = requests.post(url, json=payload, headers=headers)
        return response.json()