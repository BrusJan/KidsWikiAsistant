# README.md

# My Express App

This project is an Express application that interfaces with the Wikipedia API and the Mistral LLM API. It provides endpoints to fetch Wikipedia articles and communicate with the Mistral language model.

## Project Structure

```
backend
├── src
│   ├── app.js                  # Entry point of the application
│   ├── controllers             # Contains controller functions
│   │   ├── index.js            # Main controller aggregator
│   │   ├── wikiController.js    # Functions for Wikipedia API requests
│   │   └── mistralController.js  # Functions for Mistral LLM API communication
│   ├── routes                  # Contains route definitions
│   │   ├── index.js            # Main route setup
│   │   ├── wikiRoutes.js       # Wikipedia-related routes
│   │   └── mistralRoutes.js    # Mistral LLM-related routes
│   └── config                  # Configuration settings
│       └── config.js           # API keys and endpoint URLs
├── package.json                # npm configuration file
└── README.md                   # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd backend
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the application, run:
```
node src/app.js
```

The server will start and listen on the specified port. You can then access the endpoints for fetching Wikipedia articles and communicating with the Mistral LLM.

## API Endpoints

- **Wikipedia Endpoints**
  - Fetch article data from Wikipedia.

- **Mistral LLM Endpoints**
  - Communicate with the Mistral LLM API.

## Environment Variables

The following environment variables are required:

### Firebase Configuration
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Service account private key (with newlines as \n)
- `FIREBASE_CLIENT_EMAIL`: Service account client email

### Other Configuration
- `MISTRAL_API_KEY`: Your Mistral API key
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PRICE_ID`: Your Stripe price ID
- `FRONTEND_URL`: Your frontend URL
- `LANGUAGE`: The language for Wikipedia searches and AI prompts (options: 'cs', 'en', default: 'cs')

For local development, copy `.env.example` to `.env` and fill in the values.
For production deployment on Render.com, add these as environment variables in your service settings.

## License

This project is licensed under the MIT License.