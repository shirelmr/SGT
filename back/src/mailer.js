const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendAceptacionEmail({ nombre, email }) {
  const registerUrl = `${process.env.FRONTEND_URL}/register`

  await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Actualización sobre tu postulación como tutor',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>¡Hola, ${nombre}!</h2>
        <p>
          Tu video y captura de pantalla han sido revisados por nuestro equipo.
        </p>
        <p>
          Por favor, <strong>espera instrucciones por parte de Servicio Social</strong>
          para continuar con el proceso.
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
