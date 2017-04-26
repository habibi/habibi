import fs from 'fs';
import gql from 'graphql-tag';
import graphql from './graphql';
import {decrypt} from './pgp';
import {getPrivateKey, getPgpPassphrase} from './configuration';
import Settings from './settings';

const pullEnvironments = gql`
  query pullEnvironments($projectId: String!) {
    environments(projectId: $projectId) {
      name
      data
    }
  }
`;

const decryptAndStore = async (ciphertext, fileName) => {
  const {data: envFile} = await decrypt({
    ciphertext: ciphertext,
    privateKey: getPrivateKey(),
    password: getPgpPassphrase(),
  });

  // Store the data to the local file
  fs.writeFileSync(fileName, envFile);
};

const decryptAndStoreMany = async (envList = []) => {
  const promises = [];
  envList.forEach((e) => {
    promises.push(decryptAndStore(e.ciphertext, e.fileName));
  });
  // Wait for promises to resolve
  return await Promise.all(promises);
};

const pull = async ({environmentName: envName, all}) => {
  try {
    // Retrieve the encrypted data
    const {data: {environments}} = await graphql.query({
      query: pullEnvironments,
      variables: {
        projectId: Settings.app.projectId,
      },
    });

    if (all === true) {
      return await decryptAndStoreMany(environments.map(e => ({
        ciphertext: e.data,
        fileName: '.env.' + e.name,
      })));
    }

    if (envName) {
      return await decryptAndStoreMany(environments.filter(e => e.name === envName).map(e => ({
        ciphertext: e.data,
        fileName: '.env',
      })));
    }

    if (environments.length === 1) {
      return await decryptAndStoreMany(environments.map(e => ({
        ciphertext: e.data,
        fileName: '.env',
      })));
    }

    console.log('You have to provide a environment name. Available names are:',
      environments.map(e => e.name).join(' '));

  } catch (e) {
    console.error(e);
  }
};

export default pull;
