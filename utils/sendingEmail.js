const nodemailer = require('nodemailer');

const sendEmail = async ({ html, subject, to }) => {
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `Jumia backend clone <process.env.EMAIL>`,
    to,
    subject,
    html,
  };

  const info = await transporter.sendMail(mailOptions);

  return info;
};

module.exports = sendEmail;
