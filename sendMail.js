//This is only for sending emails

const nodemailer = require('nodemailer');

const sendForgotPasswordMail = async (email, token) => {
    
    try{
        let mailTransport = nodemailer.createTransport({
            service: "gmail",
            auth: {
            user:`${process.env.EMAIL}`,//Put the email address you want to send the email from that is not a gmail account
            pass:`${process.env.EMAIL_PASSWORD}`//if you use gmail, you would need to provide a generated password, however,
            //if you have another account that is not gmail, then you can provide the password
        }
    })

    const mailDetails = {
        from: `${process.env.EMAIL}`,
        to: `${email}`,
        subject: "Forgot Password",
        html: `<h1>Here is the token to reset your password. Please 
        click the button. 
        
        <a class"" href='https://www.yourcareerex.com/reset-password/${token}'>Click here to reset your password.</a>

        If the button does not work for any reason, please copy and paste the link below into your browser:
        https://www.yourcareerex.com/reset-password/${token}

        ${token}.
        
        </h1>`
    }

     await mailTransport.sendMail(mailDetails)
     //, (error, info) => {
    //     if(error){
    //         console.log("Error sending email: ", error);
    //     }else{
    //         console.log("Email sent: ", info.response);
    //     }
    // })
    }catch(error){
        console.log(error);
    }
}    

const validEmail = (email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
module.exports ={
    sendForgotPasswordMail,
    validEmail
}