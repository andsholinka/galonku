import express from 'express'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken';
import Conf from '../config/config.js'
import Galon from '../models/galon.js'
import User from '../models/user.js';

var galonRouter = express.Router();

galonRouter.use(bodyParser.urlencoded({
    extended: false
}));
galonRouter.use(bodyParser.json());

// create data galon
galonRouter.post('/create', async (req, res) => {

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

        try {
            const {
                tempat
            } = req.body;
            const galon = new Galon({
                nama: `${user.username}`,
                tempat
            });
            const createDoc = await galon.save();
            res.status(201).json(createDoc);
        } catch (err) {
            console.log(err)
            res.status(500).json({
                error: 'Galon creation failed'
            });
        }
    })
});

// get all data
galonRouter.get('/data', async (req, res) => {

    //header apabila akan melakukan akses
    var token = req.headers['authorization'];
    if (!token) return res.status(401).send({
        auth: false,
        message: 'No token provided.'
    });

    //verifikasi jwt
    jwt.verify(token, Conf.secret, async function (err) {
        if (err) return res.status(500).send({
            auth: false,
            message: 'Failed to authenticate token.'
        });

        const galon = await Galon.find({});
        if (galon && galon.length !== 0) {
            res.json(galon)
        } else {
            res.status(404).json({
                message: 'Complaint not found'
            });
        }
    })
});

export default galonRouter;