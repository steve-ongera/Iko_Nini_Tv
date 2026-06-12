from celery import shared_task
from django.utils import timezone
import time
from .models import MpesaTransaction, Payment, Order, OrderStatusHistory
from .utils.mpesa import MpesaAPI

@shared_task
def poll_mpesa_transaction(checkout_request_id, max_polls=24, poll_interval=5):
    """Poll M-Pesa transaction status every 5 seconds (max 2 minutes)"""
    
    for poll_count in range(max_polls):
        time.sleep(poll_interval)
        
        try:
            mpesa_trans = MpesaTransaction.objects.get(checkout_request_id=checkout_request_id)
            mpesa_trans.poll_count = poll_count + 1
            mpesa_trans.last_polled_at = timezone.now()
            
            # Query status
            mpesa = MpesaAPI()
            status = mpesa.query_status(checkout_request_id)
            
            if status.get('ResultCode'):
                mpesa_trans.result_code = status.get('ResultCode')
                mpesa_trans.result_description = status.get('ResultDesc')
                
                if status.get('ResultCode') == '0':
                    # Payment successful
                    mpesa_trans.is_confirmed = True
                    mpesa_trans.mpesa_receipt_number = status.get('ReceiptNumber', '')
                    
                    # Update payment and order
                    payment = mpesa_trans.payment
                    payment.status = 'success'
                    payment.save()
                    
                    order = payment.order
                    order.status = 'confirmed'
                    order.save()
                    
                    OrderStatusHistory.objects.create(
                        order=order,
                        status='confirmed',
                        note=f'Payment confirmed via M-Pesa (polling). Receipt: {mpesa_trans.mpesa_receipt_number}'
                    )
                
                elif status.get('ResultCode') == '1037':
                    # User cancelled
                    mpesa_trans.payment.status = 'failed'
                    mpesa_trans.payment.save()
                
                mpesa_trans.save()
                
                if mpesa_trans.is_confirmed or mpesa_trans.result_code == '1037':
                    return f"Transaction {checkout_request_id} completed with code {mpesa_trans.result_code}"
            
        except MpesaTransaction.DoesNotExist:
            return f"Transaction {checkout_request_id} not found"
        except Exception as e:
            return f"Error polling {checkout_request_id}: {str(e)}"
    
    return f"Transaction {checkout_request_id} still pending after {max_polls} polls"