const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1) Create a transporter
    // service to send the email -eg) like we have gmail
    const transporter = nodemailer.createTransport({
        // service: 'Gmail',     //there are other popular ones also here
        // we wont use gmail here as it is not good for production app as there is a limit and u may be marked as spammer

        // we use MAIL TRAP here 
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }

        // if we do for gmail --Activate in gmail "less secure app" option
    });

    // 2) Define the email options
    const mailOptions = {
        from: 'Jogeshwar Singh <hello@gmail.com>',
        to: options.email,      //options object is the argument passed to this function
        subject: options.subject,
        text: options.message
        // html:
    };

    // 3) Actually send the email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
