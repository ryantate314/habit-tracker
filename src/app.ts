import server from './server';
import 'dotenv/config'
import { Environment } from './models/environment.model';

const environment = <Environment>(<unknown>process.env);

const port = parseInt(process.env.PORT || '4000');

const starter = new server(environment).start(port)
  .then(() => console.log(`Running on port ${port}`))
  .catch(error => {
    console.log(error)
  });

export default starter;