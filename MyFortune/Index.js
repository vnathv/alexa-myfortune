'use strict'
var http = require('http');

var APP_ID = 'amzn1.ask.skill.99913c87-366f-4eb4-8ef1-2b8c035bf864';

exports.handler = function (event, context) {

    try {

        if (APP_ID !== '' && event.session.application.applicationId !== APP_ID) {
            context.fail('Invalid Application ID');
        }

        var request = event.request;

        if (request.type === "LaunchRequest") {
            context.succeed(buildResponse({
                speechText: "Welcome to my fortune. What is the zodiac sign you want to check fortune today?",
                repromptText: "You can say for example, How will be the day for aries today.",
                endSession: false
            }));
        } 
        else if (request.type === "IntentRequest") {
            let options = {};         


            if (request.intent.name === "MyFortuneIntent") {

                if (request.intent.slots.zodiac !== undefined)
                    var sign = request.intent.slots.zodiac.value;


                //Check sign is valid
                if (sign === undefined || sign === null) {
                    options.speechText = " hmmm you have forgotten to tell your zodiac sign . What is your zodiac sign?"
                    options.endSession = false;
                    context.succeed(buildResponse(options));
                    return;
                }

                if (request.intent.slots.zodiac !== undefined && !ValidateZodiacSign(sign)) {
                    options.speechText = ` The Zoadiac sign ${sign} is not a valid one. Please tell a valid zodiac sign .`
                    options.endSession = false;
                    context.succeed(buildResponse(options));
                    return;
                }


                findMyFortune(sign, function (todaysFortune, error) {
                    if (error) {
                        context.fail(error);
                        options.speechText = "There has been a problem with the request."
                        options.endSession = true;
                        context.succeed(buildResponse(options));
                    } else {
                        options.speechText = todaysFortune
                        options.speechText += " . Have a nice day ahead . "
                        options.sign = sign
                        options.cardText = todaysFortune
                        options.endSession = true;
                        context.succeed(buildResponse(options));
                    }
                });

            } else if (request.intent.name === "AMAZON.StopIntent" || request.intent.name === "AMAZON.CancelIntent") {
                options.speechText = "ok, good bye."
                options.endSession = true;
                context.succeed(buildResponse(options));
            }
             else if (request.intent.name === "AMAZON.HelpIntent") {
                options.speechText = "My fortune will forecast the day, based on zodiac sign. For example, you can ask what is the fortune for Aquarius today, to know about the day for the zodiac sign Aquarius. Please refer to skill description for all possible utterences. What is the zodiac sign you want to know today's fortune?.";
                options.repromptText = "What is the zodiac sign you want to know fortune about today? If you want to exit from my fortune skill please say stop or cancel."
                options.endSession = false;
                context.succeed(buildResponse(options));
            }
            else {
                context.fail("Unknown Intent")
            }
        }

        else if (request.type === "SessionEndedRequest") {
            options.endSession = true;
            context.succeed();
        }
        else {
            context.fail("Unknown Intent type")
        }

    } catch (e) {
        context.fail(e.message)
    }


}

function buildResponse(options) {
    var response = {
        version: "1.0",
        response: {
            outputSpeech: {
                "type": "SSML",
                "ssml": `<speak><prosody rate="slow">${options.speechText}</prosody></speak>`
            },

            shouldEndSession: options.endSession
        }
    };

    if (options.repromptText) {
        response.response.reprompt = {
            outputSpeech: {
                "type": "SSML",
                "ssml": `<speak><prosody rate="slow">${options.repromptText}</prosody></speak>`
            }
        };
    }
    if (options.cardText) {
        response.response.card = {
            "type": "Standard",
            "title": `Fortune for ${options.sign} today`,
            "text": options.cardText,
        }
        response.response.card.image = {
            "smallImageUrl": "https://s3.amazonaws.com/myfortunezodiacsign/ZodiacSmall.jpg",
            "largeImageUrl": "https://s3.amazonaws.com/myfortunezodiacsign/ZodiacLarge.jpg"
        }
    }
    return response;
}

function findMyFortune(sign, callBack) {
   
    var url = `http://horoscope-api.herokuapp.com/horoscope/today/${sign}`;

    var req = http.get(url, (res) => {
        var body = "";

        res.on("data", (chunk) => {
            body += chunk
        });

        res.on("end", () => {
            var horoscope = JSON.parse(body);
            var horoscopeText = horoscope.horoscope;
            horoscopeText = horoscopeText
                .replace(/(\\n|\\r)/g, '')
                .replace(/[^a-zA-Z0-9.\d\s]+/gi, "")
                .trim();
            
            callBack(horoscopeText)
        });
    }).on("error", (error) => {
        callBack(err);
    });
}

function ValidateZodiacSign(zodiacSign) {

    let zodiacSigns = ['aries', 'leo', 'sagittarius', 'taurus', 'virgo', 'capricorn', 'gemini', 'libra', 'aquarius', 'cancer', 'scorpio', 'pisces'];

    if (zodiacSigns.indexOf(zodiacSign.toLowerCase()) > -1) {
        return true;
    } else {
        return false;
    }
}