import pyotp, qrcode, base64, string, random
from io import BytesIO
from django.conf import settings

def GenerateQR(user):
	# Generate code and return url
    topt = pyotp.totp.TOTP(settings.OTP_SECRET_KEY)
    qr_code_url = topt.provisioning_uri(name=user.username.lower(), issuer_name='ft_transcendence_chads')
    # Generate QR Image
    img = qrcode.make(qr_code_url)
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    # Reset BytesIO position to the beginning
    buffered.seek(0)
    img_str = base64.b64encode(buffered.getvalue())
    return img_str

def generate_random_string(length=10):
        characters = string.ascii_letters + string.digits
        random_string = ''.join(random.choice(characters) for _ in range(length))
        return random_string