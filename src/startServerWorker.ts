import { setupWorker } from 'msw/browser';
import { handlers } from 'test/handlers';

setupWorker(...handlers).start();
