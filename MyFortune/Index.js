'use strict'
var http = require('http');

exports.handler = function (event, context) {
    var request = event.request;

    if (request.type === "LaunchRequest") {
        context.succeed(buildResponse({
            speechText: "Welcome to my fortune. What is the zodiac you want to check fortune today?",
            repromptText: "You can say for example, How will be the day for aries today.",
            endSession: false
        }));
    }
    else if (request.type === "IntentRequest") {
        let options = {};
        let sign = request.intent.slots.ZODIAC.value;
        if (sign === "undefined" || sign === undefined || sign === null) {
            options.speechText = " hmmm you have forgotten to tell your zodiac sign . What is your zodiac sign?"
            options.endSession = false;
            context.succeed(buildResponse(options));
        }
        if (request.intent.name === "MyFortuneIntent") {

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
            options.endSession = true;
        }
        else if (request.type === "SessionEndedRequest") {
            options.endSession = true;
        }
        else {
            context.fail("Unknown Intent")
        }
    }


    else {
        context.fail("Unknown Intent type")
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
            "smallImageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-P3eM2RJwwAmp5Obb9eBkWhHyx4GMMRMXHd2NZ86JPVWMelXYRw",
            "largeImageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-P3eM2RJwwAmp5Obb9eBkWhHyx4GMMRMXHd2NZ86JPVWMelXYRw"
        }
    }
    return response;
}

function findMyFortune(sign, callBack) {
    console.log("sign is " + sign)
    var url = `http://horoscope-api.herokuapp.com/horoscope/today/${sign}`;
    try {
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

                console.log(horoscopeText)
                callBack(horoscopeText)
            });
        }).on("error", (error) => {
            callBack(err);
        });

    } catch (error) {
        // callBack(error);
    }


}

