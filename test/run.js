'use strict';

// Test script to send messages to the feeder SMTP

// Usage to send 1234 messages using kreata.ee SMTP:
//  node test/run.js 1234 kreata.ee

const config = require('config');
const nodemailer = require('nodemailer');
const moment = require('moment');

let expecting = Number(process.argv[2]) || 100;
let destserver = process.argv[3] || 'localhost';
let rcptCount = Number(process.argv[4]) || 10;
let domainCount = Number(process.argv[5]) || 6;
let maxAttachmentSize = Number(process.argv[6]) || 0.10;

let total = expecting;
let finished = false;

let startTime = new Date();
let sent = 0;
let errors = 0;

// Create a SMTP transporter object
const transporter = nodemailer.createTransport({
    pool: true,
    maxConnections: 50,
    host: destserver,
    port: config.feeder.port,
    auth: {
        user: config.feeder.user,
        pass: config.feeder.pass
    },
    logger: false, // log to console
    debug: false // include SMTP traffic in the logs
}, {
    // default message fields
    // sender info
    from: 'Andris Test <andris@kreata.ee>'
});

let recipients = [];
for (let i = 0; i < rcptCount; i++) {
    recipients += (i ? ', ' : '') + 'Test #' + (i + 1) + ' <test+' + (i + 1) + '@test' + ((i % domainCount) + 1) + '.tahvel.info>';
}

let send = () => {
    if (total-- <= 0) {
        finished = true;
        return;
    }
    // Message object
    let message = {

        // Comma separated list of recipients
        //to: '"Receiver Name" <andris@kreata.ee>, andris+2@kreata.ee, andris+3@kreata.ee, andris+4@kreata.ee, andris+5@kreata.ee, andris+6@kreata.ee, andris+7@kreata.ee, andris+8@kreata.ee, andris+9@kreata.ee, andris+10@kreata.ee, andris.reinman@gmail.com, andmekala@hot.ee, andris.reinman@hotmail.com, andris.reinman@yahoo.com',

        //to: 'Andris <andris@test.tahvel.info>,andris2@test2.tahvel.info,andris3@test3.tahvel.info',

        to: recipients,

        //to: 'andris@127.0.0.1',
        //to: 'andris+1@kreata.ee',
        //to: '"Receiver Name" <andris@kreata.ee>, andris+2@kreata.ee, andris.reinman@gmail.com',

        //to:'andris.reinman@hotmail.com',

        //to: 'lutik@mutikasnutikas.ee',



        // Subject of the message
        subject: 'Nodemailer is unicode friendly ✔ ' + Date.now(), //

        // plaintext body
        text: 'Hello to myself!',

        // HTML body
        html: '<p><b>Hello</b> to myself <img src="cid:note@example.com"/></p>',

        /*
                headers: {
                    'X-Sending-Zone': [
                        'default', // default
                        'loopback'
                    ]
                },
        */
        // An array of attachments
        attachments: [
            // String attachment
            {
                filename: 'notes.txt',
                content: 'Some notes about this e-mail',
                contentType: 'text/plain' // optional, would be detected from the filename
            },

            // Binary Buffer attachment
            {
                filename: 'image.png',
                content: new Buffer('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQMAAAAlPW0iAAAABlBMVEUAAAD/' +
                    '//+l2Z/dAAAAM0lEQVR4nGP4/5/h/1+G/58ZDrAz3D/McH8yw83NDDeNGe4U' +
                    'g9C9zwz3gVLMDA/A6P9/AFGGFyjOXZtQAAAAAElFTkSuQmCC', 'base64'),

                cid: 'note@example.com' // should be as unique as possible
            }, {
                filename: 'attachment.bin',
                content: new Buffer(Math.ceil(Math.random() * maxAttachmentSize * 1024 * 1024))
            }
        ]
    };

    transporter.sendMail(message, error => {
        if (error) {
            errors++;
            return;
        }
        sent++;
    });
};

transporter.on('idle', () => {
    while (!finished && transporter.isIdle()) {
        send();
    }
});


function stats() {
    console.log('Sent %s messages, errored %s (total %s, %s%), started %s (%s, %s)', sent, errors, sent + errors, Math.round((sent + errors) / expecting * 100), moment(startTime).fromNow(), startTime.getTime(), Date.now()); // eslint-disable-line no-console
    if (total <= 0) {
        process.exit(0);
    }
}

setInterval(stats, 10 * 1000);

stats();
