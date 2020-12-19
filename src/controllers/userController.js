import express from 'express'
import bcrypt from 'bcrypt'
import Conf from '../config/config.js'
import {
    v4 as uuidv4
} from 'uuid'
import bodyParser from 'body-parser'
import nodemailer from 'nodemailer'
import generator from 'generate-password'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'

var userRouter = express.Router();

userRouter.use(bodyParser.urlencoded({
    extended: false
}));
userRouter.use(bodyParser.json());

// ADD User
userRouter.post('/registration', async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            isVerified
        } = req.body;

        const saltRounds = 10;
        const hashedPw = await bcrypt.hash(password, saltRounds);
        const VerificationToken = uuidv4(email);

        const emailDuplicate = await User.findOne({
            "email": email
        })

        if (emailDuplicate) {
            res.status(401).json({
                message: 'This email Already Registered'
            });
        } else {
            User.create({
                    username: username,
                    email: email,
                    password: hashedPw,
                    isVerified: isVerified,
                },
                async function (err) {
                    try {
                        if (err) {
                            console.log(err)
                            res.status(500).send({
                                message: 'Gagal Melakukan Registrasi Akun!'
                            });
                        } else {
                            res.status(201).send('Registration is successful. Please wait for the admin to confirm your account.');
                        }
                    } catch (error) {
                        res.status(500).json(error);
                    }
                });
        }
    } catch (error) {
        res.status(500).json(error);
    }
});

//FORGOT PASSWORD
userRouter.post('/forgot-password', async (req, res) => {
    try {
        User.findOne({
            email: req.body.email
        }, async (err, customer) => {
            if (!customer) return res.status(201).json({
                msg: 'We were unable to find a user with that email.'
            });
            if (customer.isVerified === false) return res.status(201).json({
                msg: 'This account has not been verified. Please verify.'
            });

            //Generate New Password
            var newPassword = generator.generate({
                length: 8,
                numbers: true,
                uppercase: true,
                lowercase: true

            })

            // Hashed Password
            var saltRounds = 12
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

            //Changed Hashed Password
            customer.password = hashedPassword
            console.log(newPassword)
            console.log(customer.password)
            console.log(customer)

            //Show in Postman only
            //res.status(200).json(newPassword)

            // Save the New Password
            customer.save(function (err) {
                if (err) {
                    return res.status(500).json({
                        msg: err.message
                    });
                }

                // Send the email contain new password
                var transporter = nodemailer.createTransport({
                    service: "gmail",
                    host: "smtp.gmail.com",
                    port: 465,
                    secure: true,
                    auth: {
                        user: process.env.MAIL,
                        pass: process.env.PASS,
                    },
                });

                var info = ({
                    from: '"no-reply" <admin@BRImo>', // sender address
                    to: customer.email, // list of receivers
                    subject: "Reset Your BRI Complaint Handling Account Password", // Subject line
                    text: 'Dear ' + customer.username + ',' + '\n\n' + 'Did you forget your password?\n\n' +
                        'Please input your changed password account by input this new password: ' + newPassword + '\n\n' +
                        'Thank you,\n' +
                        'UGM 05 Team'
                    // html: '<p>Silahkan verifikasi akun dengan klik link B. <a href=" http://cf82d7e6deb2.ngrok.io/cust/reset/'+VerificationToken+'">Verifikasi</a></p>', // html body
                });
                transporter.sendMail(info, function (err) {
                    if (err) {
                        return res.status(500).json({
                            msg: err.message
                        });
                    }
                    res.status(200).send('A Changed Password has been sent to ' + customer.email + '.');
                    //res.status(200).json('A Changed Password has been sent to ' + customer.email + '.\n', 'Message sent: %s', info.messageId + '\n' + 'Preview URL: %s', nodemailer.getTestMessageUrl(info));
                });
            });

        });
    } catch (error) {
        res.status(500).json({
            error: error
        })
    }
})

//CHANGE PASSWORD
userRouter.post('/change-password', async (req, res) => {
    try {
        var token = req.headers['authorization']
        if (!token)
            return res.status(401).send({
                auth: false,
                message: 'No token provided.'
            })

        jwt.verify(token, Conf.secret, async (err) => {

            if (err)
                return res.status(500).send({
                    auth: false,
                    message: 'Failed to authenticate token.'
                })


            const {
                email,
                password,
                newPassword
            } = req.body
            const currentCustomer = await new Promise((resolve, reject) => {
                User.find({
                    "email": email
                }, function (err, customer) {
                    if (err) reject(err)
                    resolve(customer)
                })
            })
            if (currentCustomer[0]) {
                bcrypt.compare(password, currentCustomer[0].password).then(async (result, err) => {
                    if (result) {
                        if (err) return res.status(201).json("There is a problem registering the user")
                        const customer = currentCustomer[0]

                        // Hashed Password
                        var saltRounds = 12
                        const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

                        //Changed password to Hashed Password
                        customer.password = hashedPassword
                        // console.log(customer.newPassword)
                        // console.log(customer.password)
                        // console.log(customer)

                        //Save New Password
                        customer.save()

                        res.status(200).json({
                            "status": "Successfully Changed Pasword!!"
                        })
                    } else {
                        res.status(201).json({
                            "status": "wrong password"
                        })
                    }
                })
            } else {
                res.status(201).json({
                    "status": "email not found"
                })
            }
        })
    } catch (error) {
        res.status(500).json({
            error: error
        })
    }
})

//login
userRouter.post('/login', async (req, res) => {
    try {
        const {
            username,
            password
        } = req.body;

        const currentUser = await new Promise((resolve, reject) => {
            User.find({
                "username": username
            }, function (err, cust) {
                if (err)
                    reject(err)
                resolve(cust)
            })
        })

        //cek apakah ada user?
        if (currentUser[0]) {
            //check password
            bcrypt.compare(password, currentUser[0].password).then(function (result) {
                if (result) {
                    const cust = currentUser[0];
                    // Make sure the user has been verified
                    if (!currentUser[0].isVerified) return res.status(404).send({
                        type: 'not-verified',
                        msg: 'Your account has not been verified.'
                    });
                    // console.log(cust);
                    const id = cust._id;
                    //urus token disini
                    var token = jwt.sign({
                        id
                    }, Conf.secret, {
                        expiresIn: 86400 // expires in 24 hours
                    });
                    cust.token = token;
                    res.status(200).send({
                        auth: true,
                        token: token,
                        "status": "logged in!"
                    });
                } else {
                    res.status(402).json({
                        "status": "wrong password."
                    });
                }
            });
        } else {
            res.status(401).json({
                "status": "username not found"
            });
        }
    } catch (error) {
        res.status(500).json({
            error: error
        })
    }
})

//Get profile
userRouter.get('/profile', async (req, res) => {

    //header apabila akan melakukan akses
    var token = req.headers['authorization'];
    if (!token) return res.status(401).send({
        auth: false,
        message: 'No token provided.'
    });

    //verifikasi jwt
    jwt.verify(token, Conf.secret, async function (err, decoded) {
        if (err) return res.status(500).send({
            auth: false,
            message: 'Failed to authenticate token.'
        });
        const user = await User.findById(decoded.id);

        if (user && user.length !== 0) {
            res.json(user)
        } else {
            res.status(404).json({
                message: 'Cust not found'
            });
        }
    })
});

//testing
//DELETE all data customers
userRouter.delete('/user', async (req, res) => {
    const cust = await User.deleteMany();

    if (cust) {
        res.json({
            message: 'all users removed'
        })
    } else {
        res.status(404).json({
            message: 'user not found'
        })
    }
})

//UPDATE customer
userRouter.put('/detail', async (req, res) => {

    //header apabila akan melakukan akses
    var token = req.headers['authorization'];
    if (!token) return res.status(401).send({
        auth: false,
        message: 'No token provided.'
    });

    //verifikasi jwt
    jwt.verify(token, Conf.secret, async function (err, decoded) {
        if (err) return res.status(500).send({
            auth: false,
            message: 'Failed to authenticate token.'
        });
        const cust = await User.findById(decoded.id);

        if (cust && cust.length !== 0) {
            const {
                nama_lengkap,
                no_ktp,
                no_rekening
            } = req.body;

            cust.nama_lengkap = nama_lengkap;
            cust.no_ktp = no_ktp;
            cust.no_rekening = no_rekening;

            const updateDataCust = await cust.save()
            res.send(updateDataCust);

        } else {
            res.status(500).send(` Tidak Memiliki Wewenang`);
        }
    })
})

export default userRouter;