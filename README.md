# Kafka Connect Manager

This is a Next.js application for managing Kafka Connect clusters.

## Running Locally

To get started and run the application on your local machine, follow these steps. This is the recommended approach if the deployed application cannot access your Kafka Connect instance due to network restrictions.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1. Install Dependencies

Open your terminal in the project's root directory and run the following command to install the necessary packages:

```bash
npm install
```

### 2. Configure Environment Variables

The application needs your Kafka Connect URL and credentials to connect.

1.  Create a new file in the root of the project named `.env.local`.
2.  Copy the contents of `.env.local.example` into your new `.env.local` file.
3.  Replace the placeholder values with your actual Kafka Connect instance details.

Your `.env.local` file should look like this:

```
KAFKA_CONNECT_URL=https://poc-kafka.vitonta.com/
KAFKA_CONNECT_USERNAME=admin
KAFKA_CONNECT_PASSWORD=P@ssw0rd@kafka
```

**Note:** The credentials you provided have been used as the default values. The `.env.local` file is ignored by version control, so your credentials will remain secure on your machine.

### 3. Run the Development Server

Once the dependencies are installed and the environment is configured, start the development server:

```bash
npm run dev
```

The application will start, typically on `http://localhost:9002`. You can open this URL in your browser. Since your local machine is likely on an authorized network, it should now be able to connect to your Kafka instance without the "403 Forbidden" error.