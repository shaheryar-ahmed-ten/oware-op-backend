const nodemailer = require("nodemailer");
const fs = require("fs");
const ejs = require("ejs");

const Mailclient = nodemailer.createTransport({
  host: process.env.MAILER_HOST || "smtp.gmail.com",
  secureConnection: false,
  port: process.env.MAILER_PORT || 587,
  authentication: "OAuth",
  auth: {
    user: process.env.MAILER_EMAIL,
    pass: `${process.env.MAILER_PASSWORD}`,
  },
});

async function sendMail(payload) {
  let mailOptions = {
    from: payload.senderName ? `${payload.senderName} <${process.env.MAILER_EMAIL}> ` : process.env.MAILER_EMAIL,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  };
  let response = null;
  try {
    response = await Mailclient.sendMail(mailOptions);
    return {
      success: true,
      data: response
    }
  } catch (err) {
    console.log(err)
    return {
      success: false,
      data: err.message
    }
  }
}

function sendCustomerInquiryEmail(customerInquiry) {
  let customerInquiryTemplate = fs.readFileSync("templates/customer-inquiry.html", { encoding: "utf-8" });
  let html = ejs.render(customerInquiryTemplate, customerInquiry);
  return sendMail({
    to: process.env.LEAD_EMAIL_RECIPIENT,
    from: process.env.MAILER_EMAIL,
    senderName: "Customer Inquiry",
    subject: "New Lead",
    html,
  });
}

function sendGeneralEmailToCompanies(customerEmails, data, subject, senderName) {
  let generalTemplate = fs.readFileSync("templates/customer-statistics.html", { encoding: "utf-8" });
  let html = ejs.render(generalTemplate, data);
  return sendMail({
    to: customerEmails,
    from: process.env.MAILER_EMAIL,
    senderName,
    subject,
    html,
    // text: `${data}`
  });
}

async function sendDailyScheduledEmail(recipientEmails, data, subject, senderName) {
  let generalTemplate = fs.readFileSync("templates/daily-email.html", { encoding: "utf-8" });
  let html = ejs.render(generalTemplate, data);
  return sendMail({
    to: recipientEmails,
    from: process.env.MAILER_EMAIL,
    senderName,
    subject,
    html,
    // text: `${data}`
  });
}

async function sendCurrentScheduledEmail(recipientEmails, data, subject, senderName) {
  let generalTemplate = fs.readFileSync("templates/current-email.html", { encoding: "utf-8" });
  let html = ejs.render(generalTemplate, data);
  return sendMail({
    to: recipientEmails,
    from: process.env.MAILER_EMAIL,
    senderName,
    subject,
    html,
    // text: `${data}`
  });
}


module.exports = { sendCustomerInquiryEmail, sendGeneralEmailToCompanies, sendDailyScheduledEmail, sendCurrentScheduledEmail };
