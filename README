# KnowledgeBase

A project that allows users to submit text and extract facts using GPT-3. The prompts, context, and facts are stored in a database for future reference.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Prerequisites
    - Node.js
    - npm
    - A supabase instance
    - An OpenAI account

## Installation
1. Clone the repository:

```git clone https://github.com/RileyMueller/Knowledgebase.git```

2. Install the dependencies:

```npm install```

3. Setup your .env following .env.example


## Usage
3. Start the server:

```npm start```

    Make a POST request to the /parse endpoint with the following JSON in the request body:

{
  "text": "<text to process>",
  "context": "<context for the text>"
}

## Example

curl -X POST \
  http://localhost:3000/parse \
  -H 'Content-Type: application/json' \
  -d '{
  "text": "John McCrae wrote the web serial Worm. Worm follows the story of Taylor Hebert, a teenage girl from the fictional East Coast city of Brockton Bay. Taylor is a parahuman with the ability to control bugs within a certain radius. Taylor is mistaken for a supervillain on her first night out. Taylor becomes a member of the Undersiders, a group of teenage villains. The 'heroes' of Brockton Bay are not always heroic. Taylor has to do the wrong things for the right reasons in the superpowered underworld of Brockton Bay.",
  "context": "Worm"
}'

## Built With

    - Node.js - JavaScript runtime
    - Express.js - Web framework for Node.js
    - OpenAI - Natural language processing
    - Supabase - Realtime database

## Authors

   - Riley Mueller - Initial work - [RileyMueller](https://github.com/RileyMueller)

## License

This project is licensed under the MIT License - see the LICENSE file for details.


## TODO
 
Working on a frontend with React