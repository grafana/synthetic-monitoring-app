import { setupWorker } from 'msw';
import { handlers } from 'test/handlers';

setupWorker(...handlers).start();
