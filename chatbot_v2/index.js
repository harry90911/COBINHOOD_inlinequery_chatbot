'use strict';

const axios = require("axios");
const trading_pair = require('./trading_pair.json');
const url   = "https://api.cobinhood.com/v1/market/stats";

function PriceRequest() {
  return new Promise((resolve,reject) => {
    axios.get(url).then(response => {
        resolve(response.data["result"]);
      })
      .catch(err => {
        console.log(err);
        res.status(200).end();
      });
  });
}

function DictToArr(dict) {
  var arr = [];
  for (var key in dict) {
    arr.push([key, dict[key]["percent_changed_24hr"]]);
  }
  return arr;
} 

function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (parseFloat(arr[j][1]) > parseFloat(arr[j + 1][1])) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

exports.bot_v8 = (req, res) => {
  console.log(req.body);
  //If the request method is not POST, reject the call
  if (req.body.hasOwnProperty('message') && req.body.message.hasOwnProperty('text') && req.body.message.text.startsWith("/") && req.body.message.text != '/top3@COBX_pricebot') {
    return PriceRequest()
      .then((response) => {
      // Send the formatted message back to Telegram Chat
        const reply = {
          method: 'sendMessage',
          chat_id: req.body.message.chat.id,
          text: "*" + req.body.message.text.replace("/","") + "*" + 
          "\n*Current price : *" + response[req.body.message.text.replace("/","")]["last_price"] + ' ' + req.body.message.text.split("-")[1] +
          "\n*Percent change 24hr : *" + Math.round(response[req.body.message.text.replace("/","")]["percent_changed_24hr"]*100)+'%',
          parse_mode: "Markdown"
        };
        return res.json(reply);
      })
      .catch((err) => {
        console.log(req.body);
        console.log(err);
        res.status(200).end();
      });
  }
  else if (req.body.hasOwnProperty('message') && req.body.message.hasOwnProperty('text') && req.body.message.text == '/top3@COBX_pricebot') {
    return PriceRequest()
      .then((response) => {
        const parsed = bubbleSort(DictToArr(response));
        return parsed;
      })
      .then((parsed) => {
        const reply = {
          method: 'sendMessage',
          chat_id: req.body.message.chat.id,
          text: "*Current Top3 Raiser : \n*" +
                parsed[parsed.length-1][0] + " " + Math.round(parsed[parsed.length-1][1]*100)+'%' + "\n" +
                parsed[parsed.length-2][0] + " " + Math.round(parsed[parsed.length-2][1]*100)+'%' + "\n" +
                parsed[parsed.length-3][0] + " " + Math.round(parsed[parsed.length-3][1]*100)+'%' + "\n" +
                "-------------------------------------\n"+
                "*Current Top3 Downer : \n*" + 
                parsed[0][0] + " " + Math.round(parsed[0][1]*100)+'%' + "\n" +
                parsed[1][0] + " " + Math.round(parsed[1][1]*100)+'%' + "\n" +
                parsed[2][0] + " " + Math.round(parsed[2][1]*100)+'%' + "\n",
          parse_mode: "Markdown"
        };
        return res.json(reply);
      })
      /*
      .then(() => {
        const reply = {
          method: 'deleteMessage',
          chat_id: req.body.message.from.id,
          message_id: req.body.message.message_id
        }
        return res.json(reply);
      })
      */
      .catch((err) => {
        console.log(req.body);
        console.log(err);
        res.status(200).end();
      });
  }
  else if (req.body.hasOwnProperty('inline_query') && req.body.inline_query.query.length>=3) {
    const inline_query = req.body.inline_query;
    const query = inline_query.query;
    const prices = [];
    const names = [];
    const percent_changes = [];
    const results = [];

    return PriceRequest()
      .then((response) => {
        // build result list to collect trading pair match query text
        for (var tp in trading_pair) {
          if (trading_pair[tp].pair.startsWith(query)) {
            names.push(trading_pair[tp]);
            prices.push(response[trading_pair[tp].pair]["last_price"]);
            percent_changes.push(response[trading_pair[tp].pair]["percent_changed_24hr"]);
          }
        }
      })
      .then(() => {
        for (var i=0; i<prices.length; i++) {
          const result = {
            type: "article",
            id: names[i].id,
            title: names[i].pair,
            description: "Current price : " + prices[i] + ' ' + names[i].pair.split("-")[1],
            input_message_content: {
              message_text: "*" + names[i].pair + "*" + 
              "\n*Current price : *" + prices[i] + ' ' + names[i].pair.split("-")[1] +
              "\n*Percent change 24hr : *" + Math.round(percent_changes[i]*100)+'%',
              parse_mode: "Markdown"
            }
          };
          results.push(result);
        }
        const reply = {
          method: "answerInlineQuery",
          inline_query_id: inline_query.id,
          results: JSON.stringify(results)
        };
        return res.json(reply);
      })
      .catch((err) => {
        console.log(req.body);
        console.log(err);
        res.status(200).end();
      });
  }
  res.status(200).end();
};