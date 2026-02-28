from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from config import config

# Configuración de conexión SMTP con Brevo
mail_config = ConnectionConfig(
    MAIL_USERNAME=config.smtp_user,
    MAIL_PASSWORD=config.smtp_password,
    MAIL_FROM=config.smtp_from_email,
    MAIL_FROM_NAME=config.smtp_from_name,
    MAIL_PORT=config.smtp_port,
    MAIL_SERVER=config.smtp_host,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

fastmail = FastMail(mail_config)

async def send_verification_email(to_email: str, token: str):
    """
    Envía un email de verificación. El usuario recibirá
    un enlace con el token usado para verificar su cuenta.
    """
    verification_url = f"{config.frontend_url}/verify?token={token}"

    html_body = f"""
    <html>
    <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0d1117; color: #c9d1d9; padding: 40px;">
        <div style="max-width: 500px; margin: 0 auto; background: #161b22; border-radius: 12px; padding: 32px; border: 1px solid #30363d;">
            <h1 style="color: #58a6ff; text-align: center; margin-bottom: 8px;">🔐 AChave</h1>
            <p style="text-align: center; color: #8b949e; font-size: 14px;">Gestor de Contraseñas Zero-Knowledge</p>
            <hr style="border: 1px solid #30363d; margin: 24px 0;">
            <p style="font-size: 16px;">¡Bienvenido!</p>
            <p>Haz clic en el botón para verificar tu correo electrónico y activar tu cuenta:</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="{verification_url}"
                   style="background: linear-gradient(135deg, #58a6ff, #1f6feb); color: white;
                          padding: 14px 32px; border-radius: 8px; text-decoration: none;
                          font-weight: bold; font-size: 16px;">
                    Verificar mi correo
                </a>
            </div>
            <p style="color: #8b949e; font-size: 13px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="{verification_url}" style="color: #58a6ff; word-break: break-all;">{verification_url}</a>
            </p>
            <p style="color: #8b949e; font-size: 12px; margin-top: 24px;">
                Este enlace expira en 24 horas. Si no solicitaste esta verificación, ignora este email.
            </p>
        </div>
    </body>
    </html>
    """

    message = MessageSchema(
        subject="AChave — Verifica tu correo electrónico",
        recipients=[to_email],
        body=html_body,
        subtype=MessageType.html,
    )

    try:
        await fastmail.send_message(message)
        print(f"********✅ Email de verificación enviado a {to_email}")
    except Exception as e:
        print("\n" + "🔥" * 25)
        print(f"⚠️ ERROR DE SMTP: No se pudo enviar el email a {to_email}")
        print(f"Detalle del error: {e}")
        print("\n¡NO TE PREOCUPES! PARA CONTINUAR EL HACKATHON:")
        print("Copia y pega este enlace de verificación en tu navegador:")
        print(f"\n👉  {verification_url}  👈\n")
        print("🔥" * 25 + "\n")
