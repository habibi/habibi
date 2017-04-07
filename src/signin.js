import gql from 'graphql-tag';
import netrc from 'netrc';
import graphql from './graphql';
import RegEx from './regex';
import {generateSignUpHash, generatePGPHash} from './crypto';
// import {getPgpPassphrase, getApiToken} from './configuration';
import prompt from './prompt';

const schema = {
  properties: {
    email: {
      pattern: RegEx.email,
      message: 'Email must be valid and only lower case letters are allowed',
      required: true,
    },
    password: {
      hidden: true,
      required: true,
    },
  },
};

const signInMutation = gql`
  mutation signInMutation($email: String!, $password: String!) {
    signIn(email: $email, password: $password)
  }
`;

const signin = async () => {
  try {
    const input  = await prompt(schema);

    const {data} = await graphql.mutate({
      variables: {
        email: input.email,
        password: generateSignUpHash(input.password),
      },
      mutation: signInMutation,
    });

    console.log(JSON.stringify(data, null, 2));

    const myNetrc = netrc();
    myNetrc['habibi.one'] = {
      login: input.email,
      password: data.signIn,
      pgpPassphrase: generatePGPHash(input.password),
    };

    netrc.save(myNetrc);

  } catch (e) {
    console.error(e);
  }
};

export default signin;
