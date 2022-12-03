require('dotenv').config();
var express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);


const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Creates a router instance that I can use to define the routes and endpoints
var router = express.Router();

const crypto = require('crypto');

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}


/**
 *
 *  @api {post} /parse Parse text for facts
 *  @apiName Parse
 *  @apiGroup TextProcessor
 *  @apiParam {String} text The text to be parsed for facts.
 *  @apiParam {String} context The context within which the facts should be extracted.
 *  @apiSuccess {Object} facts A JSON object containing the extracted facts.
 *  @apiSuccessExample Success-Response:
 *  HTTP/1.1 200 OK
 *  {
 *     "facts": [
 *       "John McCrae wrote the web serial Worm",
 *       "Worm follows the story of Taylor Hebert, a teenage girl from the fictional East Coast city of Brockton Bay",
 *       "Taylor is a parahuman with the ability to control bugs within a certain radius",
 *       "Taylor is mistaken for a supervillain on her first night out",
 *       "Taylor becomes a member of the Undersiders, a group of teenage villains",
 *       "The 'heroes' of Brockton Bay are not always heroic",
 *       "Taylor has to do the wrong things for the right reasons in the superpowered underworld of Brockton Bay"
 *     ]
 *  }
 * @apiError InvalidTextParameter The text parameter is missing or too long.
 * @apiError InvalidContextParameter The context parameter is missing or too long.
 * @apiErrorExample InvalidTextParameter:
 * HTTP/1.1 400 Bad Request
 * {
 *   "error": "Invalid text parameter"
 * }
 * @apiErrorExample InvalidContextParameter:
 * HTTP/1.1 400 Bad Request
 * {
 *   "error": "Invalid context parameter"
 * }
 * @apiError InternalServerError There was a problem with the server.
 * @apiErrorExample InternalServerError:
 * HTTP/1.1 500 Internal Server Error
 * {
 *   "error": "Internal server error"
 * }
 * @apiSampleRequest off
 * @apiVersion 1.0.0
 * @apiPermission none
 * @apiDescription This endpoint takes in text and context as input and uses GPT-3 to extract facts as a JSON object.
 * @apiParamExample {json} Request-Example:
 * {
 *   "text": "John McCrae wrote the web serial Worm. Worm follows the story of Taylor Hebert, a teenage girl from the fictional East Coast city of Brockton Bay. Taylor is a parahuman with the ability to control bugs within a certain radius. Taylor is mistaken for a supervillain on her first night out. Taylor becomes a member of the Undersiders, a group of teenage villains. The 'heroes' of Brockton Bay are not always heroic. Taylor has to do the wrong things for the right reasons in the superpowered underworld of Brockton Bay.",
 *   "context": "Worm"
 * }
*/
router.post('/parse', async (req, res) => {
  // handle the user input and call the GPT-3 API

  // extract the user input from the request body
  const { text, context } = req.body;

  // validate the input parameters
  if (!text || text.length > 2000) {
    return res.status(400).send({ error: 'Invalid text parameter' });
  }
  if (!context || context.length > 256) {
    return res.status(400).send({ error: 'Invalid context parameter' });
  }

  const hash = hashText(text);
  //const time = new Date().toISOString();

  const prompt = `In the context of ${context}, please extract in JSON format (list) the facts (short and concise) from the following text:\n${text}\n{ "facts":[`
  // connect to the database using supabase
  let promptResults = await supabase.from('prompts').select('facts(text)').eq('hash', hash);

  // if the facts have already been extracted, return them from the database
  if (promptResults.data.length > 0) {
    res.send({ facts: promptResults.data[0].facts });
  } else {
    // otherwise, call the GPT-3 API and insert data into the database
    try {
      let completionResponse = await openai.createCompletion({
        model: 'text-davinci-002',
        prompt: prompt,
        temperature: 0.7,
        max_tokens: 512,
        n: 1,
        stream: false,
        stop: [']}', ']\n}']
      })

      // format the extracted facts and insert them into the database
      const facts = JSON.parse('{ "facts": [' + completionResponse.data.choices[0].text + ']}');
      //const facts = 'I want to parse this text so that I can get the information that I need';
      let prompt_response = await supabase
        .from('prompts')
        .insert({ text: text, context: context, hash: hash, facts: facts.facts.length })
        .select('id');

      //each fact is associated with a given prompt, so the facts to send need the prompt id.
      const prompt_id = prompt_response.data[0].id;
      const factPromises = facts.facts.map(fact => supabase.from('facts').insert(
        { text: fact, context: context, prompt_id: prompt_id }))

      await Promise.all(factPromises);

      res.send(facts);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  }
});

/**
 * @api {get} /facts
 * @apiName GetFacts
 * @apiGroup Facts
 *
 * @apiParam {String} [context] fact context to retrieve facts for
 *
 * @apiSuccess {Object[]} facts list of facts for the given prompt or context
 * @apiSuccess {Number} facts.id id of the fact
 * @apiSuccess {String} facts.text text of the fact
 * @apiSuccess {String} facts.context fact context for the fact
 * @apiSuccess {Number} facts.prompt_id foreign key to the prompt that the fact was extracted from
 * @apiSuccess {String} facts.inserted_at timestamp for when the fact was extracted
 * @apiSuccess {String} facts.updated_at timestamp for when the fact was last updated
 *
 * @apiSuccessExample {json} Success-Response:
 *   HTTP/1.1 200 OK
 *   [{
 *     "text": "This is the first fact.",
 *     "context": "context1",
 *     "prompt_id": 1,
 *     "inserted_at": "2022-12-02T17:12:01.000Z",
 *     "updated_at": "2022-12-02T17:12:01.000Z"
 *   },
 *   {
 *     "text": "This is the second fact.",
 *     "context": "context1",
 *     "prompt_id": 2,
 *     "inserted_at": "2022-12-02T17:12:01.000Z",
 *     "updated_at": "2022-12-02T17:12:01.000Z"
 *   }]
 * @apiSampleRequest off
 * @apiVersion 1.0.0
 * @apiPermission none
 * @apiDescription This endpoint takes in a context as input and returns all relevant facts.
 * @apiParamExample {json} Request-Example:
 * {
 *   "context": "Worm"
 * }
 */
router.get('/facts', async (req, res) => {
  const { context } = req.body;

  // connect to the database using supabase
  let results = await supabase.from('facts').select('*').eq('context', context);
  if (results.data.length > 0) {
    res.send({ facts: results.data });
  } else {
    res.status(404).send({ error: 'No facts were found matching the specified text and context.' });
  }
});

module.exports = router;