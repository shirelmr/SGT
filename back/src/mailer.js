const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendAceptacionEmail({ nombre, email }) {
  const registerUrl = `${process.env.FRONTEND_URL}/register`

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '¡Felicidades! Tu postulación como tutor fue aceptada',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Hola, ${nombre}!</h2>
        <p>
          Nos complace informarte que tu postulación como tutor ha sido
          <strong>aceptada</strong>. ¡Bienvenido al equipo!
        </p>
        <p>
          Para comenzar, necesitas crear tu cuenta en el sistema. Haz clic en
          el siguiente botón e ingresa con el correo con el que postulaste
          (<strong>${email}</strong>).
        </p>
        <p style="text-align: center; margin: 32px 0;">
          <a
            href="${registerUrl}"
            style="
              background-color: #2563eb;
              color: #ffffff;
              padding: 12px 24px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: bold;
            "
          >
            Crear mi cuenta
          </a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
          <a href="${registerUrl}">${registerUrl}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 13px;">
          Este correo fue enviado automáticamente por el Sistema de Gestión de Tutorías.
        </p>
      </div>
    `,
  })
}

module.exports = { sendAceptacionEmail }
