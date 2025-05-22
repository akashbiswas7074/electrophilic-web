const nodemailer = require("nodemailer");

async function main() {
  // Using the Ethereal account details you provided
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "maddison53@ethereal.email",
      pass: "jn7jnAPss4f63QBp6D",
    },
  });

  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"Maddison Foo Koch" <maddison53@ethereal.email>', // sender address
      to: "bar@example.com, baz@example.com", // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>", // html body
    });

    console.log("Message sent: %s", info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

  } catch (error) {
    console.error("Error sending email with Ethereal:", error);
  }
}

main().catch(console.error);
