import { ConfigService } from './config.service.js';

const config = new ConfigService();
export default () => config.data;
