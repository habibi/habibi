import ApolloClient, {createNetworkInterface} from 'apollo-client';
import {getApiToken} from './configuration';

const networkInterface = createNetworkInterface({
  uri: 'https://habibi.one/graphql',
});

networkInterface.use([{
  applyMiddleware(req, next) {
    if (! req.options.headers) {
      req.options.headers = {};
    }

    // Read the API token from the netrc file
    const token = getApiToken();

    // Only send the authentication header if a local API token exists
    if (token) {
      req.options.headers.authorization = `Bearer ${token}`;
    }

    next();
  },
}]);

const client = new ApolloClient({
  networkInterface,
});

export default client;
