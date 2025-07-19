import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'santoshwebtechnology@gmail.com',
    pass: 'rrrwivywutbdwxul'
  }
});

transporter.sendMail({
  from: 'santoshwebtechnology@gmail.com',
  to: 'santoshwebtechnology@gmail.com',
  subject: 'Test Email',
  text: 'This is a test email from Flick backend.'
}, (err, info) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Email sent:', info.response);
  }
});